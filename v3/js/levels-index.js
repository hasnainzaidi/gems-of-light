// Gems of Light v3 — levels-index.js
// The text index in front of the level maps: every world in journey order,
// grouped by island, each row a link to its map. Built from the live world
// registry, so a new wN-<key>.js recipe appears here the moment it exists —
// there is no list to keep in sync. Review tool; the game never links here.
(function () {
  const GOL = window.GOL;
  const el = (id) => document.getElementById(id);

  // Cloudflare Pages redirects /page.html → /page. A navigation that redirects
  // is fatal inside the root service worker (it hands the redirected response
  // to respondWith, which browsers reject with ERR_FAILED), so on Pages every
  // link here must already be extension-less. A plain file server has no such
  // rewrite and needs the .html. This page's own address says which we are on:
  // reached as /v3/levels.html we are on a file server, as /v3/levels we are
  // on Pages — because Pages redirected us here itself.
  const EXT = /\.html$/.test(location.pathname) ? '.html' : '';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // notes pinned in THIS browser, counted per world
  function localCounts() {
    const by = {};
    try {
      const raw = JSON.parse(localStorage.getItem('gemsOfLight.v3.levelNotes') || '{}');
      const deleted = raw.deleted || {};
      for (const id of Object.keys(raw.notes || {})) {
        const nt = raw.notes[id];
        if (!nt || deleted[id]) continue;
        const c = (by[nt.world] = by[nt.world] || { open: 0, total: 0, ids: {} });
        c.ids[id] = true;
        c.total++;
        if (!nt.done) c.open++;
      }
    } catch (e) { /* a corrupt draft must not blank the index */ }
    return by;
  }

  const counts = localCounts();
  const surahOf = (w) => (GOL.surahForWorld ? GOL.surahForWorld(w) : null);

  // the four painted islands, then anything the journey list has not placed
  const STAGES = GOL.JOURNEY_STAGE_CHOICES || [];
  function islandOf(w) {
    const i = (GOL.WORLD_ORDER || []).indexOf(w.key);
    if (i < 0) return STAGES.length;
    for (let s = STAGES.length - 1; s >= 0; s--) if (i >= STAGES[s].frontier) return s;
    return 0;
  }

  const worlds = (GOL.orderedWorlds ? GOL.orderedWorlds() : (GOL.WORLDS3 || []).filter(Boolean));
  const built = worlds.filter((w) => w.build);
  el('hint').textContent = built.length + ' worlds built' +
    (worlds.length - built.length ? ' · ' + (worlds.length - built.length) + ' still growing' : '') +
    ' · press / to filter, Enter opens the first';

  function rowHTML(w) {
    const s = surahOf(w);
    const c = counts[w.n];
    const facts = [];
    if (s && s.verses) facts.push(s.verses.length + (s.verses.length === 1 ? ' ayah' : ' ayat'));
    if (w.w && w.h) facts.push(w.w + '×' + w.h);
    if (!w.build) facts.push('not built yet');
    const notes = c
      ? '<span class="notes' + (c.open ? '' : ' clear') + '">' +
        (c.open ? c.open + ' open' : c.total + ' done') + '</span>'
      : '';
    const search = [w.key, w.name, s && s.englishName, s && s.meaningName].join(' ').toLowerCase();
    return '<a class="row' + (w.build ? '' : ' dim') + '"' +
      (w.build ? ' href="level-map' + EXT + '?w=' + w.n + '"' : '') +
      ' data-search="' + esc(search) + '">' +
      '<span class="n">' + w.n + '</span>' +
      '<span class="name">' + esc(s ? s.englishName : w.key) + '</span>' +
      (s ? '<span class="ar">' + esc(s.arabicName) + '</span>' : '') +
      '<span class="of">' + esc(w.name || '') + '</span>' +
      '<span class="facts">' + facts.join(' · ') + (notes ? ' · ' + notes : '') + '</span>' +
      '</a>';
  }

  function render() {
    const groups = [];
    for (const w of worlds) {
      const g = islandOf(w);
      (groups[g] = groups[g] || []).push(w);
    }
    let html = '';
    groups.forEach((list, i) => {
      if (!list || !list.length) return;
      const stage = STAGES[i];
      html += '<h2>' + esc(stage ? stage.label : 'Off the journey map') + '</h2>' +
        list.map(rowHTML).join('');
    });
    el('list').innerHTML = html + '<p class="empty" id="none" hidden>Nothing matches that.</p>';
  }

  function filter(q) {
    q = q.trim().toLowerCase();
    let shown = 0;
    [...document.querySelectorAll('a.row')].forEach((r) => {
      const hit = !q || r.dataset.search.indexOf(q) >= 0;
      r.hidden = !hit;
      if (hit) shown++;
    });
    // a heading whose whole island is filtered out should go too
    [...document.querySelectorAll('h2')].forEach((h) => {
      let next = h.nextElementSibling, any = false;
      while (next && next.tagName === 'A') {
        if (!next.hidden) { any = true; break; }
        next = next.nextElementSibling;
      }
      h.hidden = !any;
    });
    el('none').hidden = shown > 0;
  }

  render();
  const box = el('filter');
  box.addEventListener('input', () => filter(box.value));
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = [...document.querySelectorAll('a.row')].find((r) => !r.hidden && r.href);
      if (first) location.href = first.href;
    }
    if (e.key === 'Escape') { box.value = ''; filter(''); box.blur(); }
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== box) { e.preventDefault(); box.focus(); box.select(); }
  });
})();
