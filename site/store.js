/* arboleda.co — storage adapter.
   One facade over all client state. Two modes, decided at runtime:

   • LOCAL mode (default, Phase 1): everything in localStorage. Identical to before.
   • CLOUD mode (Phase 2): set window.ARBOLEDA_CONFIG = { supabaseUrl, supabaseAnonKey }
     (see config.js). Synced keys then read/write Supabase for the signed-in client;
     device/UI keys stay local.

   Design: hydrate() runs ONCE at the top of each page (async). It fills an in-memory
   cache so every existing synchronous Store.get/Store.set call keeps working unchanged.
   set() updates the cache, persists locally, and (cloud mode) fires an async upsert. */
(function (root) {
  'use strict';

  var CFG = root.ARBOLEDA_CONFIG || null;
  var hasCloud = !!(CFG && CFG.supabaseUrl && CFG.supabaseAnonKey && root.supabase);

  // Keys that belong to the engagement record (synced to the cloud per client).
  // 'account' is special: it's the auth identity. The rest are device/UI prefs.
  var SYNCED = { 'arboleda-intake': 'intake', 'arboleda-discovery': 'discovery', 'arboleda-engagement': 'engagement' };
  var LOCAL_ONLY = { 'arboleda-collapse': 1, 'arboleda-operator': 1, 'arboleda-runbook': 1, 'arboleda-account': 1 };

  var cache = {};      // key -> parsed value
  var sb = null;       // supabase client (cloud mode)
  var session = null;  // current auth session (cloud mode)
  var clientId = null; // clients.id for the signed-in user

  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  var Store = {
    mode: hasCloud ? 'cloud' : 'local',

    /* Call once, await, before rendering. Safe to call on every page. */
    hydrate: function () {
      // Seed cache from localStorage first — instant, and the fallback if cloud is down.
      Object.keys(SYNCED).concat(Object.keys(LOCAL_ONLY)).forEach(function (k) { cache[k] = lsGet(k); });
      if (!hasCloud) return Promise.resolve(Store);

      sb = root.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
      return sb.auth.getSession().then(function (res) {
        session = res && res.data ? res.data.session : null;
        if (!session) return Store; // logged out → local cache only
        cache['arboleda-account'] = session.user.email;
        lsSet('arboleda-account', session.user.email);
        return ensureClient().then(loadSynced).then(function () { return Store; });
      }).catch(function () { return Store; }); // network failure → degrade to local
    },

    get: function (key) { return cache[key]; },

    set: function (key, value) {
      cache[key] = value;
      lsSet(key, value); // always keep a local copy (offline + fast reload)
      if (hasCloud && session && SYNCED[key]) upsertSynced(key, value);
      return value;
    },

    remove: function (key) { delete cache[key]; lsDel(key); },

    /* Auth (cloud mode). In local mode these are no-ops the UI can still call. */
    isLoggedIn: function () { return !!session; },
    currentEmail: function () { return cache['arboleda-account'] || (session && session.user.email) || null; },
    signInWithEmail: function (email) {
      if (!hasCloud) { lsSet('arboleda-account', email); cache['arboleda-account'] = email; return Promise.resolve({ local: true }); }
      return sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: root.location.origin + '/portal' } });
    },
    signOut: function () {
      lsDel('arboleda-account'); delete cache['arboleda-account'];
      if (hasCloud && sb) return sb.auth.signOut();
      return Promise.resolve();
    },

    /* Current access token, for authenticated calls to /api/* functions. */
    token: function () { return session ? session.access_token : null; },

    /* POST to a Pages Function with the bearer token. Cloud mode only. */
    api: function (path, body) {
      var t = Store.token();
      return fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + t },
        body: JSON.stringify(body || {})
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, data: j }; }); });
    }
  };

  /* ---- cloud helpers ---- */
  function ensureClient() {
    return sb.from('clients').upsert({ email: session.user.email }, { onConflict: 'email' })
      .select('id').single().then(function (r) { if (r.data) clientId = r.data.id; });
  }
  function loadSynced() {
    if (!clientId) return Promise.resolve();
    return Promise.all([
      sb.from('intakes').select('payload').eq('client_id', clientId).maybeSingle(),
      sb.from('discovery').select('payload').eq('client_id', clientId).maybeSingle(),
      sb.from('engagements').select('*').eq('client_id', clientId).maybeSingle()
    ]).then(function (rows) {
      if (rows[0].data) cache['arboleda-intake'] = rows[0].data.payload;
      if (rows[1].data) cache['arboleda-discovery'] = rows[1].data.payload;
      if (rows[2].data) cache['arboleda-engagement'] = {
        state: rows[2].data.state, focus: rows[2].data.focus, price: rows[2].data.price,
        signoffs: rows[2].data.signoffs || {}, payments: rows[2].data.payments || []
      };
      // mirror freshly loaded cloud state back to localStorage so existing
      // synchronous localStorage reads in page code see the cloud values.
      Object.keys(SYNCED).forEach(function (k) { if (cache[k] != null) lsSet(k, cache[k]); });
      installWriteBridge();
    });
  }

  /* Make existing code cloud-aware without editing it: intercept localStorage
     writes to synced keys and push them to Supabase. Reads already work because
     loadSynced mirrored cloud → localStorage above. */
  function installWriteBridge() {
    if (root.__arboledaBridged) return;
    root.__arboledaBridged = true;
    var raw = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (k, v) {
      raw(k, v);
      if (session && SYNCED[k]) {
        try { upsertSynced(k, JSON.parse(v)); } catch (e) {}
      }
    };
  }
  function upsertSynced(key, value) {
    if (!clientId) return;
    if (key === 'arboleda-intake') sb.from('intakes').upsert({ client_id: clientId, payload: value }, { onConflict: 'client_id' }).then(noop, noop);
    else if (key === 'arboleda-discovery') sb.from('discovery').upsert({ client_id: clientId, payload: value }, { onConflict: 'client_id' }).then(noop, noop);
    else if (key === 'arboleda-engagement') {
      // Clients may write focus/discovery-derived fields; payments & state transitions
      // are server-authorised (Stripe webhook / operator), so we only upsert safe fields here.
      sb.from('engagements').upsert({ client_id: clientId, focus: value.focus }, { onConflict: 'client_id' }).then(noop, noop);
    }
  }
  function noop() {}

  root.ArboledaStore = Store;
})(typeof window !== 'undefined' ? window : this);
