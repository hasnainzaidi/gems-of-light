// Gems of Light v3 — grownups.js
// A quiet page for grown-ups: the pilot-study view. It's reached from the title
// by a patient press-and-hold on the little star (children drift past it). Text
// is welcome here — this page is for adults. Everything shown is read from the
// local save; nothing ever leaves the device.
(function () {
  const GOL = window.GOL;
  const { alpha } = GOL.color;

  // "today / yesterday / N days ago / —" from an epoch-ms timestamp
  function relDay(ms) {
    if (!ms) return '—';
    const days = Math.floor((Date.now() - ms) / (24 * 3600 * 1000));
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    return days + ' days ago';
  }

  // The honest knowledge line, read from the LAST shrine run (not shrineFirstTry,
  // which is a max-of-runs and inflatable). Falls back to shrineFirstTry when no
  // per-run telemetry exists yet. Returns { text, color }.
  //  - first-try:      placed with zero misses that run  ->  {firstTry}/{sockets}
  //  - tries per gem:  (sockets + misses) / sockets       ->  1.0 is perfect
  //  - listens per gem:listens / sockets                  ->  low = recall,
  //                                                           higher = by-ear
  //  - hints:          auto-placements, flagged quietly if > 0
  //  - trend:          tries-per-gem vs the previous run (lower is better)
  // parchment-friendly ink colours (dark text reads on the light panel)
  const INK = GOL.INK, INK_SOFT = GOL.INK_SOFT, GOLD = GOL.GOLD;
  const GREEN = '#3E8E4A', AMBER = '#B0742E';

  function knowledgeLine(st, total) {
    const runs = st.shrineRuns;
    if (!runs || !runs.length) {
      if (st.shrineFirstTry) return { text: st.shrineFirstTry + '/' + total + ' first-try', color: INK };
      return { text: '—', color: alpha(INK, 0.4) };
    }
    const r = runs[runs.length - 1];
    const sockets = r.sockets || total || 1;
    const tpg = (sockets + (r.misses || 0)) / sockets;
    const lpg = (r.listens || 0) / sockets;
    let text = (r.firstTry || 0) + '/' + sockets + ' · ' + tpg.toFixed(1) + ' tries · ' + lpg.toFixed(1) + ' listens';
    if (r.hints > 0) text += ' · ' + r.hints + ' helped';
    let color = INK;
    if (runs.length >= 2) {
      const p = runs[runs.length - 2];
      const ptpg = (p.sockets + (p.misses || 0)) / (p.sockets || 1);
      if (tpg < ptpg - 0.05) { text += '  ↓'; color = GREEN; }       // fewer tries — growing
      else if (tpg > ptpg + 0.05) { text += '  ↑'; color = AMBER; }  // more tries this time
    }
    return { text, color };
  }

  const grownups = {
    t: 0, buttons: [],
    enter() {
      this.t = 0;
      if (GOL.audio && GOL.audio.stopAmbience) GOL.audio.stopAmbience();
    },
    // Geometry for the "open a level" chooser — a centred modal (the table
    // already fills a landscape phone, so this rides over it, the way the
    // title's tuning panel does). One chip per grown world, wrapped to the
    // panel's width. Shared by update (hit-testing) and draw so the two never
    // drift; chip widths use a fixed text estimate that draw reuses exactly.
    pickerLayout(W, H) {
      const worlds = (GOL.orderedWorlds ? GOL.orderedWorlds() : (GOL.WORLDS3 || []).filter(Boolean))
        .filter((w) => w.build); // only worlds a child can actually play
      const pw = Math.min(560, W - 60);
      const px = W / 2 - pw / 2;
      const pad = 22, chipH = 30, gapX = 8, gapY = 8, headH = 46;
      const ix = px + pad, iw = pw - pad * 2;
      let x = ix, rowI = 0;
      const chips = [];
      for (const w of worlds) {
        const surah = (window.GOL_DATA && w.surahId != null)
          ? window.GOL_DATA.surahs.find((s) => s.id === w.surahId) : null;
        const label = surah ? surah.englishName : ('world ' + w.n);
        const cw = Math.round(label.length * 7.2 + 30);
        if (x !== ix && x + cw > ix + iw) { x = ix; rowI++; } // wrap
        chips.push({ label, cw, rowI, x, n: w.n, surahId: w.surahId, open: GOL.worldOpen(w.n) });
        x += cw + gapX;
      }
      const rows = rowI + 1;
      const panelH = headH + rows * chipH + (rows - 1) * gapY + 34;
      const py = Math.max(20, H / 2 - panelH / 2);
      const bodyTop = py + headH;
      for (const c of chips) { c.y = bodyTop + c.rowI * (chipH + gapY); c.w = c.cw; c.h = chipH; }
      return { px, py, pw, panelH, ix, headH, chips };
    },
    update(dt, W, H) {
      this.t += dt;
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      this.buttons = [Object.assign({}, GOL.homeButton())];
      // the "open a level" doorway — a quiet chip, top-right
      const bw = 132, bh = 30;
      this.pickBtn = { x: (W - sa.r) - 18 - bw, y: 18 + sa.t * 0.5, w: bw, h: bh };

      if (this.pickerOpen) {
        const chips = this.pickerLayout(W, H).chips;
        for (const tap of GOL.Input.taps) {
          if (tap.ui) continue;
          tap.ui = true;
          const c = chips.find((b) => tap.x >= b.x && tap.x <= b.x + b.w && tap.y >= b.y && tap.y <= b.y + b.h);
          if (c) {
            const d = GOL.store.data;
            d.opened = d.opened || [];
            if (c.surahId != null && !d.opened.includes(c.surahId)) { d.opened.push(c.surahId); GOL.store.save(); }
            GOL.audio.unlock();
            GOL.audio.sfx('unlockLevel');
            GOL.go('adventure', { world: c.n });
            return;
          }
          this.pickerOpen = false; // a tap outside the chips closes it
          GOL.audio.sfx('tap');
        }
        return;
      }

      GOL.hitButtons(GOL.Input.taps, this.buttons);
      for (const tap of GOL.Input.taps) {
        if (tap.ui) continue;
        const b = this.pickBtn;
        if (tap.x >= b.x && tap.x <= b.x + b.w && tap.y >= b.y && tap.y <= b.y + b.h) {
          tap.ui = true; this.pickerOpen = true; GOL.audio.sfx('tap');
        }
      }
      // a calm page: swallow any stray taps so nothing slips through
      for (const tap of GOL.Input.taps) tap.ui = true;
    },
    draw(ctx, W, H) {
      const t = this.t;
      const sa = GOL.SAFE || { l: 0, r: 0, t: 0, b: 0 };
      // a soft green-dusk backdrop, calmer than the bright meadow
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#33473A');
      bg.addColorStop(1, '#25362C');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const L = sa.l, R = W - sa.r;
      const cx = (L + R) / 2;
      const topY = 26 + sa.t * 0.5;
      GOL.text(ctx, 'How the garden is growing', cx, topY, { size: 19, weight: '800', color: '#F5EDD4' });

      // the main parchment table
      const worlds = GOL.orderedWorlds ? GOL.orderedWorlds() : (GOL.WORLDS3 || []).filter(Boolean);
      const rows = worlds.length;
      const headH = 30, rowH = 40;
      const px = L + 18, pw = (R - L) - 36;
      const py = topY + 20;
      const ph = headH + rows * rowH + 16;
      GOL.drawPanel(ctx, px, py, pw, ph, { radius: 18 });

      const ix = px + 20, iw = pw - 40;
      // column anchors as fractions of the inner width; the knowledge column is
      // left-aligned and wide so the honest run detail has room to breathe
      const cols = [
        { key: 'name', label: 'surah', align: 'left', f: 0.00 },
        { key: 'gem', label: 'grand gem', f: 0.16 },
        { key: 'heard', label: 'heard', f: 0.275 },
        { key: 'know', label: 'shrine · knowledge', align: 'left', f: 0.335 },
        { key: 'tricky', label: 'trickiest ayah', f: 0.695 },
        { key: 'bloom', label: 'blossom', f: 0.79 },
        { key: 'replay', label: 'replays', f: 0.865 },
        { key: 'last', label: 'last played', f: 0.945 }
      ];
      const colX = (c) => ix + c.f * iw;

      const hy = py + 21;
      for (const c of cols) {
        GOL.text(ctx, c.label, colX(c), hy, { size: 11, weight: '700', color: INK_SOFT, align: c.align || 'center', shadow: false });
      }
      ctx.strokeStyle = alpha(INK, 0.18);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ix - 6, py + headH); ctx.lineTo(ix + iw + 6, py + headH); ctx.stroke();

      worlds.forEach((w, i) => {
        const surah = (window.GOL_DATA && w.surahId != null)
          ? window.GOL_DATA.surahs.find((s) => s.id === w.surahId) : null;
        const st = GOL.store.level(w.surahId);
        const total = surah ? surah.verses.length : 0;
        const ry = py + headH + 8 + i * rowH + rowH / 2 - 8;
        if (i % 2 === 0) {
          ctx.fillStyle = alpha(INK, 0.06);
          GOL.roundRect(ctx, ix - 8, ry - rowH / 2 + 3, iw + 16, rowH - 6, 8);
          ctx.fill();
        }
        const done = GOL.worldDone(w.n);
        // trickiest ayah: the one mis-ordered most across all shrine attempts
        let worst = '—', worstN = 0;
        for (const k in (st.misorders || {})) {
          if (st.misorders[k] > worstN) { worstN = st.misorders[k]; worst = 'ayah ' + k + ' ×' + worstN; }
        }
        const know = knowledgeLine(st, total);
        const cells = {
          name: { v: surah ? surah.englishName : ('world ' + w.n), size: 14.5, weight: '800', color: INK },
          gem: { v: done ? '✓' : '·', size: 14, weight: '800', color: done ? GREEN : alpha(INK, 0.4) },
          heard: { v: String(st.heardFull || 0), size: 13, weight: '600', color: INK },
          know: { v: know.text, size: 11.5, weight: '600', color: know.color },
          tricky: { v: worst, size: 12, weight: '600', color: worstN ? INK : alpha(INK, 0.4) },
          bloom: { v: st.blossom ? '★' : '·', size: 13, weight: '700', color: st.blossom ? GOLD : alpha(INK, 0.4) },
          replay: { v: String(st.replays || 0), size: 13, weight: '600', color: INK },
          last: { v: relDay(st.lastPlayed), size: 12, weight: '600', color: INK }
        };
        for (const c of cols) {
          const cell = cells[c.key];
          GOL.text(ctx, cell.v, colX(c), ry, { size: cell.size, weight: cell.weight, color: cell.color, align: c.align || 'center', shadow: false });
        }
        // the Remembering Moon at the row's right edge — dark until the first
        // dream, then waxing in quarters, never waning
        GOL.drawMoon(ctx, ix + iw, ry, 7, st.moon || 0, t, { glow: false });
        // small notes under the surah name: cumulative hints, and the moon count
        const notes = [];
        if (st.hintsUsed) notes.push(st.hintsUsed + ' hint' + (st.hintsUsed === 1 ? '' : 's') + ' all-time');
        if ((st.moon || 0) > 0) notes.push('moon ' + Math.round((st.moon || 0) * 4) + '/4');
        if (notes.length) {
          GOL.text(ctx, notes.join(' · '), colX(cols[0]), ry + 13, { size: 9.5, weight: '600', color: alpha(INK, 0.5), align: 'left', shadow: false });
        }
      });

      // the week line — quiet engagement stamps from the last seven days
      const wk = 7 * 24 * 3600 * 1000;
      const wy = py + ph + 26;
      const week = 'this week — ' +
        GOL.stampCount('v3walkStart', wk) + ' walks · ' +
        GOL.stampCount('v3campfire', wk) + ' campfires · ' +
        GOL.stampCount('v3grandGem', wk) + ' gems · ' +
        GOL.stampCount('v3remember', wk) + ' remembrances';
      GOL.text(ctx, week, cx, wy, { size: 13, weight: '700', color: alpha('#F5EDD4', 0.82), shadow: false });

      GOL.text(ctx, 'tries per gem: 1.0 is perfect · listens per gem tell recall from by-ear · everything stays on this device',
        cx, wy + 20, { size: 10.5, weight: '600', color: alpha('#F5EDD4', 0.42), shadow: false });

      // the "open a level" doorway, top-right
      if (this.pickBtn) {
        const b = this.pickBtn;
        GOL.roundRect(ctx, b.x, b.y, b.w, b.h, 9);
        ctx.fillStyle = 'rgba(245,237,212,0.12)';
        ctx.fill();
        ctx.strokeStyle = alpha('#F5EDD4', 0.4);
        ctx.lineWidth = 1.3; ctx.stroke();
        GOL.text(ctx, 'open a level ▸', b.x + b.w / 2, b.y + b.h / 2,
          { size: 12, weight: '800', color: alpha('#F5EDD4', 0.9), shadow: false });
      }

      for (const b of this.buttons) GOL.drawButton(ctx, b.x, b.y, 22, b.iconName);

      // the chooser modal — over everything else, so it reads clearly
      if (this.pickerOpen) {
        ctx.fillStyle = 'rgba(20,30,24,0.62)';
        ctx.fillRect(0, 0, W, H);
        const p = this.pickerLayout(W, H);
        GOL.drawPanel(ctx, p.px, p.py, p.pw, p.panelH, { radius: 20 });
        GOL.text(ctx, 'open a level to play', W / 2, p.py + 24, { size: 15, weight: '800', color: INK });
        for (const c of p.chips) {
          GOL.roundRect(ctx, c.x, c.y, c.w, c.h, 9);
          // still-closed worlds glow gold (the invitation); open ones sit quiet
          ctx.fillStyle = c.open ? 'rgba(120,104,70,0.14)' : 'rgba(185,138,62,0.88)';
          ctx.fill();
          ctx.strokeStyle = c.open ? 'rgba(150,128,84,0.4)' : 'rgba(185,138,62,0.95)';
          ctx.lineWidth = 1.4; ctx.stroke();
          GOL.text(ctx, c.label, c.x + c.w / 2, c.y + c.h / 2,
            { size: 12, weight: '800', color: c.open ? INK_SOFT : '#FFF8E8', shadow: false });
        }
        GOL.text(ctx, 'gold means still closed · tap a surah to open it and jump in · tap outside to close',
          W / 2, p.py + p.panelH - 14, { size: 10.5, weight: '600', color: INK_SOFT, shadow: false });
      }
    }
  };
  GOL.registerScene('grownups', grownups);
})();
