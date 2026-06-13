/* arboleda.co — renders Step 0 report objects (from report-content.js) to HTML.
   String-building only; used by portal.html (preview) and report.html (full). */
(function (root) {
  'use strict';

  var SERVICE_META = {
    anatomy: { practice: 'Anatomy', tag: 'Foundations', color: '#0C4A33' },
    aurora: { practice: 'Aurora', tag: 'Intelligence', color: '#0C4A33' },
    alchemy: { practice: 'Alchemy', tag: 'Automation', color: '#0C4A33' },
    brief: { practice: 'Step 1', tag: 'Audit call brief', color: '#0C4A33' },
    sample: { practice: 'Step 1', tag: 'Sample deliverable', color: '#0C4A33' }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function toolModelsHTML(models, compact) {
    if (!models.length) return '';
    var h = '<section class="rep-block"><h2>Your systems, as data models</h2><div class="rep-cols-print">';
    models.forEach(function (m) {
      h += '<div class="rep-tool"><h3>' + esc(m.heading) + '</h3><p>' + esc(m.body) + '</p>';
      if (!compact && m.list && m.list.length) {
        h += '<p class="rep-entities">' + m.list.join(' &nbsp;·&nbsp; ') + '</p>';
      }
      h += '</div>';
    });
    return h + '</div></section>';
  }

  function anatomyHTML(r) {
    var h = '<section class="rep-block"><h2>Proposed master records &amp; ownership</h2>';
    h += '<table class="rep-table"><thead><tr><th>Master record</th><th>Owning system</th><th>Fed by</th></tr></thead><tbody>';
    r.masterTable.forEach(function (row) {
      h += '<tr><td><b>' + esc(row.entity) + '</b></td><td>' + esc(row.owner) + '</td><td>' + esc(row.fedBy) + '</td></tr>';
    });
    h += '</tbody></table></section>';
    if (r.moves.length) {
      h += '<section class="rep-block"><h2>First integration moves</h2>';
      r.moves.forEach(function (m, i) {
        h += '<div class="rep-move"><h3>' + (i + 1) + '. ' + esc(m.heading) + '</h3><p>' + esc(m.body) + '</p></div>';
      });
      h += '</section>';
    }
    if (r.gaps.length) {
      h += '<section class="rep-block"><h2>Gaps in the spine</h2><p>No selected system currently owns: <b>' +
        r.gaps.map(esc).join(', ') + '</b>. These are the first questions the systems review answers.</p></section>';
    }
    return h;
  }

  function auroraHTML(r) {
    var h = '<section class="rep-block"><h2>Metrics derivable from your stack today</h2><div class="rep-cols-print">';
    r.metrics.forEach(function (m, i) {
      h += '<div class="rep-metric"><h3>' + (i + 1) + '. ' + esc(m.name) + '</h3>' +
        '<p class="rep-formula">' + esc(m.formula) + '</p>' +
        '<p>' + esc(m.why) + '</p></div>';
    });
    h += '</div></section>';
    if (r.gaps.length) {
      h += '<section class="rep-block"><h2>Not yet possible — and why</h2>';
      r.gaps.forEach(function (g) {
        h += '<div class="rep-metric gap"><h3>' + esc(g.name) + '</h3><p>Needs <b>' +
          g.missing.map(esc).join(' + ') + '</b> (or equivalent) in the stack. ' + esc(g.why) + '</p></div>';
      });
      h += '</section>';
    }
    return h;
  }

  function alchemyHTML(r) {
    var h = '<section class="rep-block"><h2>Top ' + r.processes.length + ' automation use cases</h2><div class="rep-cols-print">';
    r.processes.forEach(function (p, i) {
      h += '<div class="rep-proc"><h3>' + (i + 1) + '. ' + esc(p.name) +
        ' <span class="rep-chip">' + esc(p.hours) + '</span><span class="rep-chip">' + esc(p.complexity) + ' complexity</span></h3>' +
        '<p>' + esc(p.desc) + (p.value ? ' <b class="rep-value">' + esc(p.value) + '.</b>' : '') + '</p></div>';
    });
    return h + '</div></section>';
  }

  /* ------------------------------------------------------- SVG diagrams */
  var C = { ink: '#0F1713', muted: '#5A6660', line: '#E3E8E4', card: '#F3F6F2', tint: '#EAF4EC', accent: '#157A53', deep: '#0C4A33', lime: '#CDEB8B' };
  var FONT = 'font-family="Instrument Sans, sans-serif"';

  function svgBox(x, y, w, h, fill, stroke) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="9" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '"' : '') + '/>';
  }
  function svgText(x, y, size, color, text, opts) {
    return '<text x="' + x + '" y="' + y + '" ' + FONT + ' font-size="' + size + '" fill="' + color + '"' + (opts || '') + '>' + esc(text) + '</text>';
  }

  /* Anatomy: tools (left) wired to master records (right). */
  function spineSVG(d) {
    var tools = d.tools.filter(function (t) { return t !== 'Spreadsheets'; });
    if (!tools.length) tools = d.tools;
    var masters = d.masters;
    var rows = Math.max(tools.length, masters.length);
    var rowH = 52, H = rows * rowH + 50, W = 720;
    var ty0 = 40 + (rows - tools.length) * rowH / 2;
    var my0 = 40 + (rows - masters.length) * rowH / 2;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Systems wired to master records">';
    s += svgText(20, 24, 12, C.muted, 'YOUR SYSTEMS', ' letter-spacing="1.5" font-weight="600"');
    s += svgText(436, 24, 12, C.muted, 'MASTER RECORDS', ' letter-spacing="1.5" font-weight="600"');
    // connectors first (under boxes)
    masters.forEach(function (m, j) {
      var myc = my0 + j * rowH + 19;
      m.feeders.forEach(function (f) {
        var i = tools.indexOf(f);
        if (i === -1) return;
        var tyc = ty0 + i * rowH + 19;
        s += '<path d="M 210 ' + tyc + ' C 320 ' + tyc + ', 320 ' + myc + ', 436 ' + myc + '" fill="none" stroke="' + C.accent + '" stroke-width="1.4" opacity="0.55"/>';
      });
    });
    tools.forEach(function (t, i) {
      var y = ty0 + i * rowH;
      s += svgBox(20, y, 190, 38, C.card) + svgText(35, y + 24, 13.5, C.ink, t, ' font-weight="600"');
    });
    masters.forEach(function (m, j) {
      var y = my0 + j * rowH;
      var owned = m.owner && m.owner !== '—';
      s += svgBox(436, y, 264, 38, owned ? C.tint : '#FFF', owned ? C.accent : C.line);
      s += svgText(450, y + 17, 12.5, C.deep, m.name, ' font-weight="600"');
      s += svgText(450, y + 31, 10.5, owned ? C.accent : C.muted, owned ? 'Owner: ' + m.owner : 'No owner in current stack');
    });
    return s + '</svg>';
  }

  /* Aurora: sources → one decision layer → outputs. */
  function flowSVG(d) {
    var tools = d.tools, outs = d.outputs;
    var rows = Math.max(tools.length, outs.length, 3);
    var rowH = 50, H = rows * rowH + 56, W = 720;
    var ty0 = 44 + (rows - tools.length) * rowH / 2;
    var oy0 = 44 + (rows - outs.length) * rowH / 2;
    var midY = H / 2 + 8, midH = 92;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Source systems flowing into one decision layer and out to decision views">';
    s += svgText(20, 24, 12, C.muted, 'SOURCE SYSTEMS', ' letter-spacing="1.5" font-weight="600"');
    s += svgText(282, 24, 12, C.muted, 'ONE DECISION LAYER', ' letter-spacing="1.5" font-weight="600"');
    s += svgText(540, 24, 12, C.muted, 'DECISION VIEWS', ' letter-spacing="1.5" font-weight="600"');
    tools.forEach(function (t, i) {
      var y = ty0 + i * rowH;
      s += '<path d="M 196 ' + (y + 17) + ' C 240 ' + (y + 17) + ', 240 ' + midY + ', 280 ' + midY + '" fill="none" stroke="' + C.accent + '" stroke-width="1.4" opacity="0.55"/>';
      s += svgBox(20, y, 176, 34, C.card) + svgText(34, y + 22, 13, C.ink, t, ' font-weight="600"');
    });
    s += svgBox(280, midY - midH / 2, 190, midH, C.deep);
    s += svgText(300, midY - 14, 13.5, '#FFFFFF', 'Reconciled model', ' font-weight="700"');
    s += svgText(300, midY + 6, 11, '#CDEB8B', 'metric definitions · lineage');
    s += svgText(300, midY + 22, 11, '#CDEB8B', 'ownership · one truth');
    outs.forEach(function (o, i) {
      var y = oy0 + i * rowH;
      s += '<path d="M 470 ' + midY + ' C 510 ' + midY + ', 510 ' + (y + 17) + ', 540 ' + (y + 17) + '" fill="none" stroke="' + C.accent + '" stroke-width="1.4" opacity="0.55"/>';
      s += svgBox(540, y, 160, 34, C.tint, C.accent) + svgText(554, y + 22, 13, C.deep, o, ' font-weight="600"');
    });
    return s + '</svg>';
  }

  /* Alchemy: effort vs hours-back chart, numbered to match the list. */
  function chartSVG(d) {
    var procs = d.processes;
    var W = 720, H = 320, padL = 70, padB = 50, padT = 26, padR = 24;
    var cols = { 'Low': 0, 'Med': 1, 'High': 2 };
    var maxMid = 5;
    var mids = procs.map(function (p) {
      var m = /(\d+)[–-](\d+)/.exec(p.hours);
      var mid = m ? (parseInt(m[1], 10) + parseInt(m[2], 10)) / 2 : 5;
      if (mid > maxMid) maxMid = mid;
      return mid;
    });
    var plotW = W - padL - padR, plotH = H - padT - padB;
    function x(c, jitter) { return padL + (cols[c] + 0.5) * plotW / 3 + jitter; }
    function y(v) { return padT + plotH - (v / (maxMid * 1.15)) * plotH; }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Automation use cases plotted by effort and hours returned">';
    // grid + axes
    [0.25, 0.5, 0.75, 1].forEach(function (f) {
      var gy = y(maxMid * f);
      s += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '" stroke="' + C.line + '"/>';
      s += svgText(padL - 8, gy + 4, 10.5, C.muted, Math.round(maxMid * f) + 'h', ' text-anchor="end"');
    });
    ['Low', 'Med', 'High'].forEach(function (c) {
      s += svgText(x(c, 0), H - padB + 22, 12, C.muted, c + ' effort', ' text-anchor="middle" font-weight="600"');
    });
    s += svgText(padL, 16, 11.5, C.muted, 'Hours back per month (midpoint of range) — numbers match the list below', ' font-weight="600"');
    var placed = [];
    var OFFSETS = [0, 34, -34, 68, -68, 102];
    procs.forEach(function (p, i) {
      var cy = y(mids[i]);
      var cx = x(p.complexity, 0);
      for (var o = 0; o < OFFSETS.length; o++) {
        var cand = x(p.complexity, OFFSETS[o]);
        var clash = placed.some(function (pt) {
          return Math.abs(pt.y - cy) < 27 && Math.abs(pt.x - cand) < 29;
        });
        if (!clash) { cx = cand; break; }
      }
      placed.push({ x: cx, y: cy });
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="13" fill="' + (i < 3 ? C.deep : C.tint) + '" stroke="' + C.deep + '"/>';
      s += svgText(cx, cy + 4.5, 12, i < 3 ? '#FFFFFF' : C.deep, String(i + 1), ' text-anchor="middle" font-weight="700"');
    });
    return s + '</svg>';
  }

  function diagramHTML(r) {
    if (!r.diagram) return '';
    var svg = '', caption = '';
    if (r.service === 'anatomy') { svg = spineSVG(r.diagram); caption = 'Your systems wired to single-owner master records. Unbordered records have no owner in the current stack.'; }
    if (r.service === 'aurora') { svg = flowSVG(r.diagram); caption = 'Live data flows one way: sources into a reconciled model, out to the views leadership decides with.'; }
    if (r.service === 'alchemy') { svg = chartSVG(r.diagram); caption = 'Where the wins sit: top-right is high return for low effort. Dark dots are your top three.'; }
    return '<figure class="rep-diagram">' + svg + '<figcaption>' + esc(caption) + '</figcaption></figure>';
  }

  function benchmarksHTML(r) {
    if (!r.benchmarks || !r.benchmarks.length) return '';
    var h = '<section class="rep-block"><h2>What it&rsquo;s worth — benchmark evidence</h2><div class="rep-bench-grid">';
    r.benchmarks.forEach(function (b) {
      h += '<div class="rep-bench"><p class="rep-bench-stat">' + esc(b.stat) + '</p>' +
        '<p class="rep-bench-label">' + esc(b.label) + '</p>' +
        '<p class="rep-bench-detail">' + esc(b.detail) + '</p>' +
        '<p class="rep-bench-src">' + esc(b.source) + '</p></div>';
    });
    return h + '</div></section>';
  }

  function briefHTML(r) {
    var h = '<section class="rep-block"><h2>Snapshot</h2><table class="rep-table"><tbody>';
    var s = r.snapshot;
    [['Company', s.company], ['Industry', s.industry], ['Headcount', s.headcount], ['Your contact', s.role],
     ['Audit focus', s.focus], ['Top goal', s.goal], ['KPIs that matter', s.kpis], ['Stack', s.stack],
     ['Finance/ops team', s.team], ['Timeline', s.timeline], ['Budget comfort', s.budget]].forEach(function (row) {
      h += '<tr><td style="width:34%"><b>' + esc(row[0]) + '</b></td><td>' + esc(row[1]) + '</td></tr>';
    });
    h += '</tbody></table></section>';
    if (r.pains.length) {
      var anyHours = r.pains.some(function (p) { return p.hours; });
      h += '<section class="rep-block"><h2>' + (r.painsTitle || 'Where the hours go (your words)') + '</h2><table class="rep-table">';
      if (anyHours) h += '<thead><tr><th>Item</th><th>Hours/mo</th><th>Indicative value</th></tr></thead>';
      h += '<tbody>';
      r.pains.forEach(function (p) {
        h += '<tr><td><b>' + esc(p.name) + '</b></td>' +
          (anyHours ? '<td>' + esc(p.hours || '—') + '</td><td>' + esc(p.est || '—') + '</td>' : '') + '</tr>';
      });
      h += '</tbody></table></section>';
    }
    h += '<section class="rep-block"><h2>Systems, in practice</h2>';
    r.sysNotes.forEach(function (n) {
      h += '<p><b>' + esc(n.tool) + ':</b> ' + esc(n.q) + ' <span class="rep-value">' + esc(n.a) + '</span></p>';
    });
    h += '</section>';
    if (r.success) h += '<section class="rep-block"><h2>Success, 90 days after the audit</h2><p>&ldquo;' + esc(r.success) + '&rdquo;</p></section>';
    h += '<section class="rep-block"><h2>' + esc(r.scopeTitle || 'Proposed audit scope') + '</h2><ol class="rep-ol">' +
      r.scope.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>' +
      '<p class="rep-entities">Your selections first, gaps filled from the stack ranking. We confirm and adjust this on the call.</p>' +
      (r.step2 ? '<p class="rep-entities" style="margin-top:6px"><b>Where this leads:</b> ' + esc(r.step2) + '</p>' : '') + '</section>';
    if (r.readiness && r.readiness.length) {
      h += '<section class="rep-block"><h2>Integration readiness — Step 2 inputs</h2><table class="rep-table"><tbody>';
      r.readiness.forEach(function (row) {
        h += '<tr><td style="width:40%"><b>' + esc(row[0]) + '</b></td><td>' + esc(row[1]) + '</td></tr>';
      });
      h += '</tbody></table></section>';
    }
    h += '<section class="rep-block"><h2>What to have ready</h2><ul class="rep-ul">' +
      r.ready.map(function (x) { return '<li><b>' + esc(x.tool) + ':</b> ' + esc(x.item) + '</li>'; }).join('') + '</ul></section>';
    h += '<section class="rep-block"><h2>Call agenda (55 min)</h2><ol class="rep-ol">' +
      r.agenda.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ol></section>';
    return h;
  }

  function sampleHTML(r) {
    var h = r.asAt ? '<p class="rep-meta" style="margin-top:6px"><b>v0.1 (sample)</b> · as at ' + esc(r.asAt) + '</p>' : '';
    function table(headers, rows) {
      return '<table class="rep-table"><thead><tr>' + headers.map(function (x) { return '<th>' + x + '</th>'; }).join('') +
        '</tr></thead><tbody>' + rows.map(function (row) {
          return '<tr>' + row.map(function (c, i) { return '<td>' + (i === 0 ? '<b>' + esc(c) + '</b>' : esc(c)) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table>';
    }
    if (r.sampleType === 'sysmap') {
      h += '<figure class="rep-diagram">' + spineSVG(r.diagram) + '<figcaption>Your systems wired to single-owner master records — the spine as it stands today.</figcaption></figure>';
      h += '<section class="rep-block"><h2>System inventory</h2>' +
        table(['System', 'Category', 'Admin / owner', 'Contributes'], r.inventory.map(function (x) { return [x.tool, x.category, x.owner, x.owns]; })) + '</section>';
      h += '<section class="rep-block"><h2>Attribute inventory — preview</h2><p class="rep-entities">One row per field in the full deliverable. Fill % and freshness are extracted in milestone 1, not estimated.</p>' +
        table(['System', 'Object / attribute group', 'What it holds', 'Fill %', 'Freshness'], r.attrPreview.map(function (a) { return [a.system, a.attribute, a.note, '— ' + a.fill, '— ' + a.fresh]; })) + '</section>';
      if (r.resolvedSample) {
        h += '<section class="rep-block"><h2>Resolved entities — worked example</h2>' +
          table(['Source', 'Record', 'Evidence'], r.resolvedSample.rows) + '</section>';
      }
      h += '<section class="rep-block"><h2>Mismatch queue — human-in-the-loop preview</h2>' +
        table(['Entity', 'Attribute', 'Conflict', 'Resolution path'], r.hitl.map(function (x) { return [x.entity, x.attribute, x.conflict, x.action]; })) + '</section>';
      if (r.dups.length) {
        h += '<section class="rep-block"><h2>Duplicate systems</h2>' +
          table(['Capability', 'Held in', 'Call'], r.dups.map(function (d) { return [d.capability, d.systems, d.call]; })) + '</section>';
      }
      h += '<section class="rep-block"><h2>Access-control considerations</h2><ul class="rep-ul">' +
        r.accessFindings.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul></section>';
      h += '<section class="rep-block"><h2>Where data breaks today</h2><ul class="rep-ul">' +
        r.breaks.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul></section>';
      h += '<section class="rep-block"><h2>Master records & current ownership</h2>' +
        table(['Master record', 'Owner today', 'Fed by'], r.masterTable.map(function (x) { return [x.entity, x.owner, x.fedBy]; })) + '</section>';
    } else if (r.sampleType === 'target') {
      h += '<section class="rep-block"><h2>Glossary — your words, made canonical</h2>' +
        table(['Term', 'As used today', 'Suggested canonical', 'Why'], r.glossary.map(function (g) { return [g.term, g.theirs, g.suggested, g.note]; })) + '</section>';
      h += '<section class="rep-block"><h2>Design principles</h2><ul class="rep-ul">' +
        r.principles.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></section>';
      h += '<figure class="rep-diagram">' + spineSVG(r.diagram) + '<figcaption>Target state: every master record with one owner, every system subscribing through the spine.</figcaption></figure>';
      h += '<section class="rep-block"><h2>Data ontology — master records</h2>' +
        table(['Master record', 'Owner', 'Value-chain link', 'Sensitivity', 'Survivorship rule'], r.ontology.map(function (o) { return [o.entity, o.owner, o.chain, o.sens, o.surv]; })) +
        '<p class="rep-entities" style="margin-top:8px">' + esc(r.lineageNote) + '</p></section>';
      h += '<section class="rep-block"><h2>Integration plan — sequenced</h2>';
      r.waves.forEach(function (w) {
        h += '<h3 style="margin-top:14px">' + esc(w.name) + '</h3>';
        w.moves.forEach(function (mv) {
          h += '<div class="rep-move"><p><b>' + esc(mv.pair.join(' ↔ ')) + ':</b> ' + esc(mv.text) + '</p></div>';
        });
      });
      h += '</section>';
    } else if (r.sampleType === 'readout') {
      r.slides.forEach(function (sl) {
        h += '<section class="rep-block rep-slide"><h2>' + esc(sl.h) + '</h2><ul class="rep-ul">' +
          sl.list.map(function (li) { return '<li>' + esc(li) + '</li>'; }).join('') + '</ul></section>';
      });
    }
    return h;
  }

  function headerHTML(r, intake) {
    var meta = SERVICE_META[r.service];
    var bits = [];
    if (intake.industry) bits.push(intake.industry);
    if (intake.headcount) bits.push(intake.headcount + ' staff');
    if (intake.goal) bits.push('Goal: ' + intake.goal);
    return '<header class="rep-head">' +
      '<p class="rep-kicker">' + meta.practice + ' · ' + meta.tag + ' · Step 0 preview</p>' +
      '<h1>' + esc(r.title) + '</h1>' +
      '<p class="rep-sub">' + esc(r.subtitle) + '</p>' +
      (bits.length ? '<p class="rep-meta">' + esc(bits.join(' · ')) + '</p>' : '') +
      '</header>';
  }

  function full(r, intake) {
    var tools = (intake.systems || []);
    var compact = tools.length > 4; // keep the 2-page budget with big stacks
    var body = SERVICE_META[r.service] ? '' : '';
    body += headerHTML(r, intake);
    body += '<p class="rep-intro">' + esc(r.intro) + '</p>';
    if (r.service === 'sample') {
      body += sampleHTML(r);
      body += '<aside class="rep-banner"><p><b>This is the sample, not the deliverable.</b> ' + esc(r.cta) + '</p></aside>';
      return body;
    }
    if (r.service === 'brief') {
      body += briefHTML(r);
      body += '<aside class="rep-banner"><p><b>Bring this to the call.</b> ' + esc(r.cta) + '</p></aside>';
      return body;
    }
    body += diagramHTML(r);
    body += toolModelsHTML(r.toolModels, compact);
    if (r.service === 'anatomy') body += anatomyHTML(r);
    if (r.service === 'aurora') body += auroraHTML(r);
    if (r.service === 'alchemy') body += alchemyHTML(r);
    body += benchmarksHTML(r);
    body += '<aside class="rep-banner"><p><b>Built from your stack selection — not yet your data.</b> ' +
      esc(r.cta) + '</p></aside>';
    return body;
  }

  /* Preview: header + intro + first content item, for the portal card. */
  function preview(r, intake) {
    var h = headerHTML(r, intake);
    h += '<p class="rep-intro">' + esc(r.intro) + '</p>';
    if (r.service === 'anatomy' && r.masterTable) {
      h += '<section class="rep-block"><h2>Proposed master records &amp; ownership</h2>' +
        '<table class="rep-table"><tbody>' +
        r.masterTable.slice(0, 3).map(function (row) {
          return '<tr><td><b>' + esc(row.entity) + '</b></td><td>' + esc(row.owner) + '</td></tr>';
        }).join('') + '</tbody></table></section>';
    }
    if (r.service === 'aurora' && r.metrics) {
      h += '<section class="rep-block"><h2>Metrics derivable today</h2>' +
        r.metrics.slice(0, 2).map(function (m, i) {
          return '<div class="rep-metric"><h3>' + (i + 1) + '. ' + esc(m.name) + '</h3><p class="rep-formula">' + esc(m.formula) + '</p></div>';
        }).join('') + '</section>';
    }
    if (r.service === 'alchemy' && r.processes) {
      h += '<section class="rep-block"><h2>Top use cases</h2>' +
        r.processes.slice(0, 3).map(function (p, i) {
          return '<div class="rep-proc"><h3>' + (i + 1) + '. ' + esc(p.name) + ' <span class="rep-chip">' + esc(p.hours) + '</span></h3></div>';
        }).join('') + '</section>';
    }
    return h;
  }

  var api = { full: full, preview: preview, esc: esc };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ArboledaReportRender = api;
})(typeof window !== 'undefined' ? window : this);
