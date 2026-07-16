// Gems of Light v3 — grownups.js
// A quiet page for grown-ups, reached from the title by a patient press-and-hold
// on the little star (children drift past it). It does two things, plainly:
//   1. shows how far the child has come in each surah (completed / in progress),
//   2. lets a grown-up open any surah on the map — a permanent toggle, so the
//      child can reach it without collecting every level in between first.
// One scrolling row per surah, so the whole journey fits however long it grows.
// Everything is read from (and written to) the local save; nothing leaves the
// device. Text is welcome here — this page is for adults.
(function () {
  const GOL = window.GOL;
  const { alpha } = GOL.color;
  const INK = GOL.INK, INK_SOFT = GOL.INK_SOFT, GOLD = GOL.GOLD;
  const GREEN = '#3E8E4A';
  const CREAM = '#F5EDD4';

  // "today / yesterday / N days ago / —" from an epoch-ms timestamp
  function relDay(ms) {
    if (!ms) return '';
    const days = Math.floor((Date.now() - ms) / (24 * 3600 * 1000));
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    return days + ' days ago';
  }

  // a small on/off switch (parchment track, cream knob)
  function drawToggle(ctx, x, y, w, h, on, enabled) {
    const r = h / 2;
    ctx.save();
    GOL.roundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = on
      ? (enabled ? 'rgba(62,142,74,0.9)' : 'rgba(62,142,74,0.35)')
      : 'rgba(120,104,70,0.20)';
    ctx.fill();
    ctx.strokeStyle = on ? alpha(GREEN, enabled ? 0.9 : 0.4) : alpha(INK, 0.32);
    ctx.lineWidth = 1.3; ctx.stroke();
    const kx = on ? x + w - r : x + r;
    ctx.beginPath(); ctx.arc(kx, y + r, r - 3.5, 0, Math.PI * 2);
    ctx.fillStyle = enabled ? '#FFF8E8' : 'rgba(255,248,232,0.8)';
    ctx.fill();
    ctx.restore();
  }

  const grownups = {
    t: 0, scroll: 0, buttons: [],
    dragPrev: null, dragMoved: false,

    enter() {
      this.t = 0;
      this.scroll = 0;
      this.dragPrev = null;
      this.dragMoved = false;
      if (GOL.audio && GOL.audio.stopAmbience) GOL.audio.stopAmbience();
    },

    // One shared layout for update (hit-testing) and draw, so the two never
    // drift. Returns the list panel geometry and a row per playable surah, each
    // already shifted by the current scroll and carrying its toggle hit-rect.
    layout(W, H) {
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      const L = sa.l, R = W - sa.r;
      const titleY = 24 + sa.t * 0.5;
      const px = L + 16, pw = (R - L) - 32;
      const panelTop = titleY + 40;
      const footerY = H - 16 - sa.b * 0.5;
      // a grown-up on a phone browser gets a quiet "add to home screen" line
      // just above the footer; installed players (standalone) don't need it
      const showInstall = !GOL.isStandalone();
      const installH = showInstall ? 26 : 0;
      const panelH = Math.max(80, (footerY - 14 - installH) - panelTop);
      const installLink = showInstall
        ? { cx: (L + R) / 2, cy: footerY - installH + 6, x: (L + R) / 2 - 150, y: footerY - installH - 6, w: 300, h: 24 }
        : null;
      const ix = px + 24, iw = pw - 48;
      const viewTop = panelTop + 12, viewH = panelH - 24;

      const worlds = (GOL.orderedWorlds ? GOL.orderedWorlds() : (GOL.WORLDS3 || []).filter(Boolean))
        .filter((w) => w.build && w.surahId != null); // only surahs a child can play
      const rH = 50;
      const maxScroll = Math.max(0, worlds.length * rH - viewH);
      const scroll = Math.max(0, Math.min(maxScroll, this.scroll || 0));

      const toggleW = 46, toggleH = 24;
      const rows = worlds.map((w, i) => {
        const y = viewTop + i * rH - scroll;
        const reached = GOL.worldProgressOpen(w.n); // reachable by natural play
        const opened = !!(GOL.store.data.opened && GOL.store.data.opened.includes(w.surahId));
        const tx = ix + iw - toggleW, ty = y + rH / 2 - toggleH / 2;
        // a generous tap target spanning the "on the map" label and the switch
        const hit = { x: tx - 92, y: y + 4, w: toggleW + 92, h: rH - 8 };
        return { w, i, y, reached, opened, tx, ty, toggleW, toggleH, hit };
      });
      return { px, pw, ix, iw, titleY, panelTop, panelH, viewTop, viewH, footerY, rH, rows, maxScroll, scroll, installLink };
    },

    update(dt, W, H) {
      this.t += dt;
      this.buttons = [Object.assign({}, GOL.homeButton())];
      const lay = this.layout(W, H);

      // drag to scroll the list (map.js's release-as-tap pattern, so a scroll
      // never fires a toggle and a clean tap always does)
      const drag = GOL.Input.drag;
      if (drag) {
        if (this.dragPrev && this.dragPrev.id === drag.id) {
          this.scroll += (this.dragPrev.y - drag.y);
          if (Math.hypot(drag.x - drag.startX, drag.y - drag.startY) > 8) this.dragMoved = true;
        }
        this.dragPrev = { id: drag.id, x: drag.x, y: drag.y };
      }
      this.scroll = Math.max(0, Math.min(lay.maxScroll, this.scroll));

      const released = GOL.Input.releases.length > 0 && this.dragPrev != null;
      const clickAt = released && !this.dragMoved ? GOL.Input.releases[0] : null;
      if (released) { this.dragPrev = null; this.dragMoved = false; }

      // swallow raw taps so nothing slips through to a scene behind this one
      for (const tap of GOL.Input.taps) tap.ui = true;

      if (!clickAt) return;

      // home button
      const home = this.buttons[0];
      if (GOL.dist(clickAt.x, clickAt.y, home.x, home.y) < home.r) {
        GOL.audio.sfx('tap');
        home.fn();
        return;
      }
      // the "add to home screen" line — always available here, opens the steps
      const il = lay.installLink;
      if (il && clickAt.x >= il.x && clickAt.x <= il.x + il.w &&
          clickAt.y >= il.y && clickAt.y <= il.y + il.h) {
        GOL.audio.sfx('tap');
        GOL.go('install', { from: 'grownups' });
        return;
      }
      // a surah's "on the map" toggle — only worlds not already reachable can
      // be opened or closed; reached worlds are on the map for good
      for (const r of lay.rows) {
        if (r.reached) continue;
        const h = r.hit;
        if (clickAt.x >= h.x && clickAt.x <= h.x + h.w && clickAt.y >= h.y && clickAt.y <= h.y + h.h) {
          const d = GOL.store.data;
          d.opened = d.opened || [];
          const idx = d.opened.indexOf(r.w.surahId);
          if (idx >= 0) { d.opened.splice(idx, 1); GOL.audio.sfx('tap'); }
          else { d.opened.push(r.w.surahId); GOL.audio.unlock(); GOL.audio.sfx('unlockLevel'); }
          GOL.store.save();
          return;
        }
      }
    },

    draw(ctx, W, H) {
      const t = this.t;
      const lay = this.layout(W, H);
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };

      // a soft green-dusk backdrop, calmer than the bright meadow
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#33473A');
      bg.addColorStop(1, '#25362C');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const cx = (sa.l + (W - sa.r)) / 2;
      GOL.text(ctx, "Your child's journey", cx, lay.titleY, { size: 19, weight: '800', color: CREAM });
      GOL.text(ctx, 'each surah they have learned — and any you want to open on the map',
        cx, lay.titleY + 20, { size: 11.5, weight: '600', color: alpha(CREAM, 0.6), shadow: false });

      // the list panel
      GOL.drawPanel(ctx, lay.px, lay.panelTop, lay.pw, lay.panelH, { radius: 18 });

      // clip the scrolling rows to the panel interior
      ctx.save();
      GOL.roundRect(ctx, lay.px + 10, lay.panelTop + 9, lay.pw - 20, lay.panelH - 18, 12);
      ctx.clip();

      for (const r of lay.rows) {
        const w = r.w;
        const ry = r.y, mid = ry + lay.rH / 2;
        if (ry + lay.rH < lay.panelTop || ry > lay.panelTop + lay.panelH) continue; // off-screen
        const surah = (window.GOL_DATA && w.surahId != null)
          ? window.GOL_DATA.surahs.find((s) => s.id === w.surahId) : null;
        const st = GOL.store.level(w.surahId);
        const done = GOL.worldDone(w.n);
        const visited = !!(st && ((st.lastPlayed || 0) > 0 || (st.heardFull || 0) > 0 ||
          (st.seeds || 0) > 0 || (st.replays || 0) > 0));

        if (r.i % 2 === 0) {
          ctx.fillStyle = alpha(INK, 0.05);
          GOL.roundRect(ctx, lay.ix - 12, ry + 3, lay.iw + 24, lay.rH - 6, 9);
          ctx.fill();
        }

        // completion glyph, left
        const gx = lay.ix + 6;
        if (done) {
          GOL.star8Path(ctx, gx, mid, 8, Math.PI / 8 + t * 0.15);
          ctx.fillStyle = GOLD; ctx.fill();
        } else if (visited) {
          GOL.star8Path(ctx, gx, mid, 7.5, Math.PI / 8);
          ctx.strokeStyle = alpha(GREEN, 0.85); ctx.lineWidth = 1.6; ctx.stroke();
        } else {
          ctx.beginPath(); ctx.arc(gx, mid, 6, 0, Math.PI * 2);
          ctx.strokeStyle = alpha(INK, 0.28); ctx.lineWidth = 1.4; ctx.stroke();
        }

        // name + status
        const nx = lay.ix + 24;
        const name = surah ? surah.englishName : ('world ' + w.n);
        GOL.text(ctx, name, nx, mid - 8, { size: 15, weight: '800', color: INK, align: 'left', shadow: false });
        let status = done ? 'completed' : (visited ? 'in progress' : 'not started yet');
        const when = relDay(st && st.lastPlayed);
        if (when && (done || visited)) status += ' · last played ' + when;
        const meaning = surah && surah.meaningName ? surah.meaningName + ' · ' : '';
        GOL.text(ctx, meaning + status, nx, mid + 9,
          { size: 10.5, weight: '600', color: alpha(INK, done ? 0.62 : 0.5), align: 'left', shadow: false });

        // "on the map" control, right
        const lx = r.tx - 10;
        if (r.reached) {
          // reachable by natural play — on the map for good, nothing to press
          GOL.text(ctx, 'on the map', r.tx + r.toggleW, mid,
            { size: 11, weight: '700', color: alpha(GREEN, 0.85), align: 'right', shadow: false });
        } else {
          GOL.text(ctx, 'on the map', lx, mid,
            { size: 10.5, weight: '700', color: alpha(INK, r.opened ? 0.7 : 0.5), align: 'right', shadow: false });
          drawToggle(ctx, r.tx, r.ty, r.toggleW, r.toggleH, r.opened, true);
        }
      }
      ctx.restore();

      // gentle fades top & bottom of the list when there is more to scroll to
      if (lay.maxScroll > 0) {
        const fadeH = 18;
        if (lay.scroll > 1) {
          const g = ctx.createLinearGradient(0, lay.panelTop + 9, 0, lay.panelTop + 9 + fadeH);
          g.addColorStop(0, 'rgba(247,240,220,0.9)'); g.addColorStop(1, 'rgba(247,240,220,0)');
          ctx.fillStyle = g; ctx.fillRect(lay.px + 10, lay.panelTop + 9, lay.pw - 20, fadeH);
        }
        if (lay.scroll < lay.maxScroll - 1) {
          const by = lay.panelTop + lay.panelH - 9;
          const g = ctx.createLinearGradient(0, by - fadeH, 0, by);
          g.addColorStop(0, 'rgba(240,229,200,0)'); g.addColorStop(1, 'rgba(240,229,200,0.9)');
          ctx.fillStyle = g; ctx.fillRect(lay.px + 10, by - fadeH, lay.pw - 20, fadeH);
        }
        // slim scrollbar on the right edge
        const trackY = lay.panelTop + 12, trackH = lay.panelH - 24;
        const thumbH = Math.max(28, trackH * (trackH / (trackH + lay.maxScroll)));
        const thumbY = trackY + (trackH - thumbH) * (lay.scroll / lay.maxScroll);
        ctx.fillStyle = alpha(INK, 0.18);
        GOL.roundRect(ctx, lay.px + lay.pw - 12, thumbY, 3.5, thumbH, 2); ctx.fill();
      }

      // the quiet "add to home screen" line, in the map ribbon's warm gold
      const il = lay.installLink;
      if (il) {
        const star8 = 0.8 + 0.2 * Math.sin(t * 1.6);
        GOL.star8(ctx, il.cx - 118, il.cy, 5.5, Math.PI / 8 + t * 0.15, alpha('#F0C878', star8));
        GOL.text(ctx, 'Add Gems of Light to your home screen', il.cx + 10, il.cy,
          { size: 12.5, weight: '800', color: '#EBCB86', shadow: false });
      }

      // footer reassurance
      GOL.text(ctx, 'Turn a switch on to let your child reach that surah on the map. Everything stays on this device.',
        cx, lay.footerY, { size: 10.5, weight: '600', color: alpha(CREAM, 0.5), shadow: false });

      // home button
      for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, 22, b.iconName);
    }
  };
  GOL.registerScene('grownups', grownups);
})();
