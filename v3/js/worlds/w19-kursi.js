// World Nineteen — Ayat al-Kursi · The Guarded Night
// The game's first PASSAGE world: one great ayah (2:255), memorized in its nine
// traditional maqati' (surahId 255, nine data segments → nine gems). The child
// walks the settled night utterly safe — nothing here fears the dark, because
// the Guardian never sleeps. Wordless: no throne, no figure. The Kursi that
// "encompasses the heavens and the earth" is expressed ONLY as vastness of
// light — an aurora ribbon that begins as a faint shimmer high over the world's
// centre and, segment by gathered segment, extends and brightens until at the
// last it arcs horizon to horizon over the whole 104-tile night.
//
// The seeing is carried the way the guiding-light prototype (P15) proved out:
// palette 'falaqNoor' settled dark at night 0.8, the child's own carried aura,
// three boxes of light kindling the seed-trail onward, and the next segment's
// faint beacon. As the segments are gathered the darkness mask lifts (engine:
// restoreK) toward the endPalette 'qadrEnd' — the night NEVER becomes day; it
// becomes a guarded, peaceful, starred night. The guarded ones sleep around the
// child: a curled tortoise, two roosting birds, pale moths at every glow.
(function () {
  const GOL = window.GOL;

  GOL.registerWorld(19, {
    id: 29, key: 'kursi', name: 'the guarded night',
    surahId: 255,
    palette: 'falaqNoor',   // the settled darkness
    endPalette: 'qadrEnd',  // the night becomes a guarded, starred night — never day
    // The proven guiding-light intensity was 0.82 over 82 tiles with four
    // boxes; this world is longer (104 tiles) with three, so the dark is nudged
    // a hair to 0.8 — still deeply, safely night, never frustrating-dark: the
    // aura, the kindled seeds and the next-segment beacon always carry seeing.
    night: 0.8,
    w: 104, h: 16,
    density: 0.1, // a still, sparse night — the light supplies the wonder

    // THE VAST LIGHT — abstract aurora, drawn behind the props on the landmark
    // layer, then muted by the night mask so it reveals itself as the darkness
    // lifts. Two–three sine-wobbled bands of warm luminous gold (cream tint of
    // P.gold, P.gold, P.goldDeep — falaqNoor's P.ray is too muted a blue-grey
    // to survive additive drawing under the night overlay), breathing with t.
    // At prog 0 a faint shimmer high over centre; each gem EXTENDS its reach
    // and lifts its alpha; at prog 1 it arcs horizon to horizon over the whole
    // world — the sky's quiet crown. Alphas run hot (0.35 → ~0.8 per band)
    // because the night mask still eats a large share early on. The arc lives
    // in world rows ~2.5–5.5, fully inside the bottom-clamped resting camera.
    // No throne, no figure — light only.
    drawLandmark(ctx, t, P, L, prog) {
      prog = prog || 0;
      const TILE = GOL.TILE;
      const alpha = GOL.color.alpha, tint = GOL.color.tint;
      const cx = 52 * TILE; // world centre
      // reach grows from a shimmer over centre to horizon-to-horizon (± >52t)
      const half = (11 + prog * 46) * TILE;
      const x0 = cx - half, x1 = cx + half;
      const bands = 2 + Math.round(prog); // a third band joins near the full arc
      // warm luminous golds, brightest band uppermost
      const cols = [tint(P.gold, 0.5), P.gold, P.goldDeep];

      ctx.save();
      ctx.globalCompositeOperation = 'lighter'; // additive glow through the night
      ctx.lineCap = 'round';
      for (let k = 0; k < bands; k++) {
        const col = cols[k];
        // Rows ~7.2–9.4: the bottom-clamped camera's top edge lands around
        // row 6 on a phone view, and the visible sky runs rows ~6–12 — so the
        // arc rides the upper-middle sky, grazing the far hilltops (caught in
        // browser verification twice: rows 3.1 and 5.6 both hid off-frame).
        const baseY = (7.8 + k * 0.85) * TILE - prog * 0.4 * TILE; // rises as it fills
        const amp = (0.5 + k * 0.28) * TILE; // wobble stays within rows ~7–9.8
        const breath = 0.82 + 0.18 * Math.sin(t * 0.6 + k * 1.3); // gentle, never gone
        const aPk = (0.35 + prog * 0.45) * (1 - k * 0.16) * breath;

        const grad = ctx.createLinearGradient(x0, 0, x1, 0);
        grad.addColorStop(0, alpha(col, 0));      // fades into the dark at the reach edges
        grad.addColorStop(0.5, alpha(col, Math.min(1, aPk)));
        grad.addColorStop(1, alpha(col, 0));
        ctx.strokeStyle = grad;
        ctx.lineWidth = (10 + prog * 16) * (1 - k * 0.18);

        ctx.beginPath();
        const steps = 56;
        for (let i = 0; i <= steps; i++) {
          const f = i / steps;
          const x = x0 + (x1 - x0) * f;
          const wob = Math.sin(f * Math.PI * (2.4 + k) + t * 0.5 + k) * amp
                    + Math.sin(f * Math.PI * 5 - t * 0.3) * amp * 0.3;
          const y = baseY + wob;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    },

    build(b) {
      b.ground(0, 103, 13);
      b.start(3);

      // ── THE FIRST DARK STRETCH (segments 1–3) ────────────────────────────
      // The world opens on its own image: not a flowered mound but a box of
      // light at the head of the dark, kindling the way in.
      b.lightbox(8);
      b.prop('cypress', 5).prop('lantern', 8);
      b.gem(1, 10, 11); // on the flat, close and findable

      // first low rise — a soft swell in the night ground
      b.block(16, 22, 12, 12);
      b.gem(2, 20, 10);
      b.prop('bush', 15, { v: 1 }).prop('tuft', 23);

      // two roosting birds sleep on a low wall — the world at rest
      b.prop('wall', 26);
      b.gem(3, 31, 11);
      b.prop('cypress', 34, { v: 1 });

      // ── THE MIDDLE DARK STRETCH (segments 4–6) ───────────────────────────
      b.lightbox(38); // the second box, mid-journey
      b.prop('lantern', 38);

      // second low rise
      b.block(39, 45, 12, 12);
      b.gem(4, 42, 10);
      b.prop('bush', 44, { v: 2 });

      // the shallow dip — two soft shoulders with a hollow between them; the
      // one bright star of the night waits here, straight above a bounce.
      b.block(47, 49, 12, 12);
      b.gem(5, 52, 11);      // in the hollow
      b.bounce(56);
      b.blossom(56, 6);      // a star within reach, seven rows up in open sky
      b.block(58, 60, 12, 12);

      b.gem(6, 62, 11);
      b.prop('cypress', 65);

      // ── THE LAST DARK STRETCH (segments 7–9) ─────────────────────────────
      b.lightbox(70); // the third box, lighting the walk home
      b.prop('lantern', 70).prop('bush', 68, { v: 1 });
      b.gem(7, 72, 11);

      b.gem(8, 82, 11);
      b.prop('cypress', 85, { v: 1 });

      b.gem(9, 92, 11); // the last segment — the arc now full overhead
      b.prop('bush', 90, { v: 2 });

      // the earned resting place and the shrine door, on flat open night ground
      b.campfire(97);
      b.door(101);
      b.prop('lantern', 95).prop('flowers', 99, { v: 1 });

      // ── THE SINGING SEED TRAIL — the very path the orbs kindle ────────────
      b.seedRun(4, 8);                    // start → first box
      b.seed(10, 11).seed(13, 11);
      b.seedArc(16, 11, 22, 11, 6, 2);    // over the first rise
      b.seedRun(24, 30, 1);
      b.seed(31, 11);
      b.seedRun(34, 38);                  // → the second box
      b.seedArc(39, 11, 45, 11, 6, 2);    // over the second rise
      b.seedRun(46, 52, 1);               // into the hollow
      b.seed(56, 11).seed(56, 9);         // the upward hint to the star
      b.seedRun(58, 62, 1);
      b.seedArc(64, 11, 70, 11, 5, 1);    // → the third box, gentle over flat
      b.seed(72, 11);
      b.seedRun(74, 82, 1);
      b.seed(82, 11);
      b.seedRun(84, 92, 1);
      b.seedRun(94, 100, 1);              // across the resting clearing

      // ── THE GUARDED SLEEPERS ──────────────────────────────────────────────
      // One tortoise curled asleep (range 0), the two roosting birds on the
      // wall, and pale moth-butterflies gathered at each box of light.
      b.creature('tortoise', 48, null, { range: 0 });
      b.creature('bird', 25, 11).creature('bird', 27, 11);
      const moth = { colA: '#EDE6C8', colB: '#F7F2E4' };
      const moth2 = { colA: '#E8E2C0', colB: '#F4EFDC' };
      b.creature('butterfly', 8, 10, moth)
       .creature('butterfly', 38, 10, moth2)
       .creature('butterfly', 56, 9, moth)
       .creature('butterfly', 70, 10, moth2);
    }
  });
})();
