// World Nine — Al-Ikhlas · The One Light
// Oneness has no fork; it has a center. A single radiant monument — a pillar
// of light beside the Wise Tree — stands at the world's heart, seen from
// everywhere along one straight, quiet road. The walk flows simply left to
// right: up a small rise, past the monument's foot, across still open ground
// to a stone crescent, and on to rest at the world's end. As each ayah is
// gathered, one more ring of light widens across the ground until, by the
// last gem, the whole world — and the resting child — stands inside the
// light. Still, sparse, silent: small clusters of cypress framing empty air,
// no water, two butterflies, nothing else moving.
(function () {
  const GOL = window.GOL;

  GOL.registerWorld(9, {
    id: 19, key: 'ikhlas', name: 'the one light',
    surahId: 112,
    palette: 'ikhlas', endPalette: 'fatiha',
    w: 84, h: 16,
    density: 0.08, // still and sparse: a few tufts framing long, empty sightlines

    // The monument itself. Drawn behind the props (life sits in front of the
    // light), in world space. `prog` is the fraction of this world's gems
    // gathered this visit (Wave P plumbing) — each gem widens one ground-ring.
    drawLandmark(ctx, t, P, L, prog) {
      prog = prog || 0;
      const T = GOL.TILE;
      const col = GOL.color;
      const cx = 42.5 * T;      // the pillar stands at world center
      const groundY = 13 * T;   // the walkable ground plane
      const breathe = 0.5 + 0.5 * Math.sin(t * 0.6); // one slow, even breath

      // ── ground rings: one soft glow-band per gathered ayah, widening out
      //    (radii ~8/16/24/32 tiles). By the fourth gem the world is lit.
      const nRings = Math.round(prog * (L.gems.length || 4));
      for (let i = 1; i <= nRings; i++) {
        const rx = i * 8 * T;
        const ry = 9 + i * 3;
        const a = Math.max(0, 0.16 - i * 0.02) * (0.6 + 0.4 * breathe);
        ctx.save();
        ctx.lineWidth = 10 + i * 2;
        ctx.strokeStyle = col.alpha(i % 2 ? P.ray : P.sunGlow, a);
        ctx.beginPath();
        ctx.ellipse(cx, groundY, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // ── the pillar of light: three nested soft veils, transparent at the
      //    sky, glowing where they meet the earth, breathing gently with t.
      const veils = [{ w: 150, a: 0.06 }, { w: 92, a: 0.10 }, { w: 50, a: 0.16 }];
      for (const v of veils) {
        const halfW = v.w / 2 + 6 * Math.sin(t * 0.4);
        const g = ctx.createLinearGradient(0, 0, 0, groundY);
        g.addColorStop(0, col.alpha(P.ray, 0));
        g.addColorStop(0.55, col.alpha(P.ray, v.a * (0.7 + 0.3 * breathe)));
        g.addColorStop(1, col.alpha(P.sunGlow, v.a * 1.7 * (0.7 + 0.3 * breathe)));
        ctx.fillStyle = g;
        ctx.fillRect(cx - halfW, 0, halfW * 2, groundY);
      }

      // ── the bright hearth where the light rises from the ground
      const base = ctx.createRadialGradient(cx, groundY, 0, cx, groundY, 190);
      base.addColorStop(0, col.alpha(P.ray, 0.28 * (0.7 + 0.3 * breathe)));
      base.addColorStop(0.5, col.alpha(P.sunGlow, 0.12));
      base.addColorStop(1, col.alpha(P.sunGlow, 0));
      ctx.fillStyle = base;
      ctx.beginPath();
      ctx.ellipse(cx, groundY, 190, 120, 0, 0, Math.PI * 2);
      ctx.fill();
    },

    build(b) {
      // One continuous, forgiving floor. No water anywhere — the stillness is
      // the point; the light does all the moving.
      b.ground(0, 83, 13);

      // Start at the far west: the pillar of light is already visible ahead,
      // and the whole walk simply approaches, passes, and rests within it.
      b.start(2);
      b.prop('cypress', 6).prop('cypress', 10); // a cluster framing empty air

      // AYAH 1 — the road sets out with a small rise of two garden steps.
      b.slab(13, 16, 11).slab(18, 21, 9);
      b.gem(1, 18, 7);
      b.prop('flowers', 20, { v: 1 });

      // THE SECRET — just past the rise, off the main rhythm: a bounce pad
      // with the one hidden blossom straight above it, open sky overhead.
      b.bounce(28);
      b.blossom(28, 7);

      // Between the rise and the monument: long, open, quiet ground —
      // cypresses stand apart, framing air, not filling it.
      b.prop('cypress', 33).prop('cypress', 37);

      // AYAH 2 — at the monument's very foot. The One Light rises here
      // (drawn by drawLandmark); the Wise Tree stands in front of it, and the
      // gem rests at the base of the light on flat ground.
      b.gem(2, 40, 11);
      b.prop('olive', 40, { v: 1 }); // the Wise Tree, life before the light

      // AYAH 3 — flat, still ground east of the center, marked only by a
      // quiet pair of flowers. Nothing moves; the beat is pure stillness.
      b.gem(3, 54, 11);
      b.prop('flowers', 53, { v: 2 }).prop('flowers', 55, { v: 1 });
      b.prop('cypress', 48); // one sentinel between the center and the crescent

      // AYAH 4 — the stone crescent, now simply the road's last waypoint.
      // Its gem crowns the arc's center.
      b.stoneBlock(60, 61, 12, 12);
      b.stoneBlock(62, 63, 11, 12);
      b.stoneBlock(64, 67, 10, 12);
      b.stoneBlock(68, 69, 11, 12);
      b.gem(4, 66, 8);
      b.prop('flowers', 65, { v: 1 });

      // The resting place and the way onward stand at the world's end, on
      // flat open ground past the crescent — by the time the child sits, the
      // fourth ring has carried the light out to enclose this clearing too.
      b.campfire(72);
      b.door(76);
      b.prop('lantern', 75).prop('cypress', 80);

      // A single unbroken thread of singing light traces the one-way road.
      b.seedArc(3, 12, 12, 12, 6, 0.6);       // the opening flat
      b.seedArc(13, 11, 18, 7, 5, 1.4);       // arcing up the two steps to ayah 1
      b.seed(22, 9).seed(24, 11).seed(26, 12); // easing back down to the road
      b.seed(28, 11).seed(28, 8);             // marking the bounce and its blossom
      b.seedRun(31, 41, 2);                   // across to the monument's foot
      b.seedRun(43, 57, 2);                   // the still stretch past ayah 3
      b.seedArc(58, 11, 66, 9, 6, 1.2);       // arcing up the crescent to ayah 4
      b.seed(68, 10).seed(70, 11);            // down the crescent's far side
      b.seedRun(71, 79, 2);                   // into the lit clearing

      // The only life here: two butterflies. No tortoise, no birdsong —
      // silence is the luxury this world keeps.
      b.creature('butterfly', 25, 7).creature('butterfly', 51, 7);
    }
  });
})();
