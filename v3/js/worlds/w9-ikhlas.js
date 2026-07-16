// World Nine — Al-Ikhlas · The One Light
// Oneness has no fork; it has a center. A single radiant monument — a pillar
// of light beside the Wise Tree — stands at the world's heart, seen from
// everywhere. The journey walks OUT past it to a quiet stone crescent that
// says "turn home," then comes back along the same road to the center. The
// only way onward is back to the One Light. Still, sparse, silent: small
// clusters of cypress framing empty air, no water, and — as each ayah is
// gathered — one more ring of light widens across the ground until, by the
// last gem, the whole world stands inside the light.
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

      // Start well to the west, so the whole out-and-back reads at a glance.
      b.start(2);
      b.prop('cypress', 7).prop('cypress', 11); // a cluster framing empty air

      // AYAH 1 — the journey sets out with a small rise of two garden steps.
      b.slab(14, 17, 11).slab(19, 22, 9);
      b.gem(1, 20, 7);
      b.prop('flowers', 21, { v: 1 });

      // Between the first rise and the monument: long, open, quiet ground —
      // cypresses stand apart, framing air, not filling it.
      b.prop('cypress', 31).prop('cypress', 35);

      // AYAH 2 — at the monument's very foot. The One Light rises here
      // (drawn by drawLandmark); the Wise Tree stands in front of it, and the
      // gem rests at the base of the light on flat ground.
      b.gem(2, 40, 11);
      b.prop('olive', 40, { v: 1 }); // the Wise Tree, life before the light

      // The resting place and the way onward BOTH sit at the monument's base:
      // the destination is the One Light. (Brief asked campfire x44 / door x38,
      // but the checker requires the door to stand a few tiles PAST the
      // campfire — law wins — so they are flipped: campfire x42, door x46,
      // still flanking the center, both flat with clear headroom.)
      b.campfire(42);
      b.door(46);
      b.prop('lantern', 45);

      // AYAH 3 — the far turn. A quiet stone crescent arcs up out of the
      // ground: reaching it says, wordlessly, "now come home." Its gem crowns
      // the arc's center.
      b.stoneBlock(61, 62, 12, 12);
      b.stoneBlock(63, 64, 11, 12);
      b.stoneBlock(65, 67, 10, 12);
      b.stoneBlock(68, 69, 11, 12);
      b.stoneBlock(70, 71, 12, 12);
      b.gem(3, 66, 8);
      b.prop('cypress', 56).prop('cypress', 60) // framing the far turn
       .prop('flowers', 66, { v: 1 });

      // AYAH 4 — gathered WALKING BACK LEFT. Placed fourth in wake order, its
      // gem waits on the return road between the crescent and the center, so
      // the child meets it only after touching the turn and heading home.
      b.gem(4, 50, 11);
      b.prop('flowers', 50, { v: 2 });

      // THE SECRET — just past the far crescent, the reward for touching the
      // turn: a bounce pad with the one hidden blossom straight above it.
      b.bounce(73);
      b.blossom(73, 7);

      // A single unbroken thread of singing light traces the road out and,
      // being the same road, home again.
      b.seedArc(3, 12, 13, 12, 6, 0.6);      // the opening flat
      b.seedArc(14, 11, 20, 7, 5, 1.4);      // up the two steps to ayah 1
      b.seed(23, 10).seed(25, 11).seed(27, 12).seed(29, 12); // back down
      b.seedRun(31, 41, 2);                  // across to the monument's foot
      b.seedRun(43, 59, 2);                  // out past the center to the turn
      b.seedArc(59, 11, 66, 9, 6, 1.2);      // up the stone crescent to ayah 3
      b.seed(69, 10).seed(71, 11).seed(72, 12); // down the crescent's far side
      b.seed(73, 11).seed(73, 8);            // marking the bounce and its blossom

      // The only life here: two butterflies. No tortoise, no birdsong —
      // silence is the luxury this world keeps.
      b.creature('butterfly', 24, 7).creature('butterfly', 54, 7);
    }
  });
})();
