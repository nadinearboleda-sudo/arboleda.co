/* arboleda.co — runtime config.
   LOCAL mode (default): leave this as-is. Everything runs in the browser exactly
   as the prototype does — no backend, no accounts needed.

   CLOUD mode (Phase 2): paste your Supabase project URL + anon (public) key below.
   The anon key is safe to ship to the browser; row-level security protects the data.
   Stripe and service-role secrets live ONLY in Cloudflare env vars, never here. */
window.ARBOLEDA_CONFIG = {
  supabaseUrl: '',        // e.g. 'https://abcd1234.supabase.co'
  supabaseAnonKey: ''     // e.g. 'eyJhbGciOi...'
};
