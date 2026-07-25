// World Eighteen — Al-Kafirun · Your Own Path
// "for you is your way, and for me is mine." The child walks a bright,
// lantern-lit road — the noor-lit way, gently raised on a low terrace bank.
// Beside it, in still water painted BEHIND the road, runs that road's dim
// reflection: a second way, visibly there and utterly unwalkable — upside-down
// lanterns, mirrored cypresses, a faint path line, cool-shifted and rippling.
// It is the other road, passed but never taken. There is deliberately NO
// endPalette here: the theology is steadfastness, and this road never becomes
// the other road. There is not one water tile in the whole world — the river
// is pure painting, so it cannot be stood upon by construction (the playtest
// law's approved form for two-ways imagery).
(function () {
  const GOL = window.GOL;
  const T = GOL.TILE;

  GOL.registerWorld(18, {
    id: 28, key: 'kafirun', name: 'your own path',
    surahId: 109,
    // The luminous dusk lane. NO endPalette — deliberately: steadfastness.
    // The lit road stays the lit road; it never warms into the other way.
    palette: 'bayyinah',
    w: 88, h: 16,
    density: 0.12,

    // ── THE STILL RIVER & ITS REFLECTION (constant, 4-arg) ──────────────────
    // A horizontal water band painted in the BACKGROUND, in world rows
    // ~8.5–10.5 — up-screen of the walk row (13), so it reads as "across the
    // water behind the road." In it hang the DIM, INVERTED mirrors of the
    // road's own features: upside-down lantern posts (their glow at the bottom
    // end), two mirrored cypress silhouettes (apex pointing down), and a faint
    // reflected path line, all cool-shifted, alpha ≈ 0.35, breathing on a slow
    // sine ripple so the eye reads water, not ground. A brighter near-bank line
    // caps the band and separates it from the playfield.
    //
    // Why no child can read it as a path: it floats 2.5+ tiles of open air
    // ABOVE the walkable ground, backs onto NO tiles at all (it is paint, not
    // terrain), is translucent and rippling (never solid), its imagery is
    // upside-down (unmistakably a reflection), and the bright shore line seals
    // it off. Nothing it draws ever touches the playfield rows.
    drawLandmark(ctx, t, P) {
      const C = GOL.color;
      const x0 = 5 * T, x1 = 83 * T;      // the river runs behind most of the road
      const top = 8.5 * T;                // the far waterline (far shore)
      const bot = 10.5 * T;               // the near shore / bank line
      const bandH = bot - top;

      // cool-shifted water tones, drawn FROM the palette (never hardcoded dark)
      const waterCool = C.mix(P.water, '#6E86B6', 0.45);
      const waterHiCool = C.mix(P.waterHi, '#9FB6DC', 0.42);
      const waterDeepCool = C.mix(P.waterDeep, '#3E567E', 0.50);
      const soilCool = C.mix(P.soil, '#8090B4', 0.45);
      const trunkCool = C.mix(P.trunk, '#6C86B6', 0.50);
      const leafCool = C.mix(P.leafDark, '#5A6EA0', 0.48);
      const glow = P.ray || '#FFF0BE';

      ctx.save();

      // 1) the still water band — a soft vertical wash, far-light to near-deep.
      const g = ctx.createLinearGradient(0, top, 0, bot);
      g.addColorStop(0, C.alpha(waterHiCool, 0.30));
      g.addColorStop(0.5, C.alpha(waterCool, 0.35));
      g.addColorStop(1, C.alpha(waterDeepCool, 0.33));
      ctx.fillStyle = g;
      ctx.fillRect(x0, top, x1 - x0, bandH);

      // clip everything that follows to the band, so no reflection spills out
      ctx.beginPath();
      ctx.rect(x0, top, x1 - x0, bandH);
      ctx.clip();

      // 2) the reflected road — a faint horizontal path line, gently rippling.
      ctx.strokeStyle = C.alpha(soilCool, 0.28);
      ctx.lineWidth = Math.max(2, T * 0.15);
      ctx.beginPath();
      for (let x = x0; x <= x1; x += 6) {
        const y = 9.5 * T + Math.sin(x * 0.03 + t * 0.6) * 1.3;
        if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 3) an upside-down lantern: post hanging down from the far shore, its
      //    warm glow inverted at the bottom end, all rippling and dim.
      const invLantern = (lx) => {
        const wob = Math.sin(lx * 0.05 + t * 0.6) * 1.6;
        const pTop = top + 0.10 * T;
        const pBot = top + 1.35 * T;
        ctx.strokeStyle = C.alpha(trunkCool, 0.34);
        ctx.lineWidth = Math.max(1.5, T * 0.08);
        ctx.beginPath();
        ctx.moveTo(lx + wob * 0.3, pTop);
        ctx.lineTo(lx + wob, pBot);
        ctx.stroke();
        const gy = pBot + 0.12 * T;
        const rg = ctx.createRadialGradient(lx + wob, gy, 0, lx + wob, gy, T * 0.55);
        rg.addColorStop(0, C.alpha(glow, 0.32));
        rg.addColorStop(1, C.alpha(glow, 0));
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(lx + wob, gy, T * 0.55, 0, Math.PI * 2);
        ctx.fill();
      };

      // 4) a mirrored cypress: a slender cone, apex pointing DOWN into water.
      const invCypress = (cx) => {
        const wob = Math.sin(cx * 0.04 + t * 0.6) * 1.5;
        const cw = 0.42 * T;
        const cyTop = top + 0.06 * T;
        const cyBot = top + 1.75 * T;
        ctx.fillStyle = C.alpha(leafCool, 0.30);
        ctx.beginPath();
        ctx.moveTo(cx - cw + wob * 0.3, cyTop);
        ctx.lineTo(cx + cw + wob * 0.3, cyTop);
        ctx.lineTo(cx + wob, cyBot);
        ctx.closePath();
        ctx.fill();
      };

      // Mirror the road's features across the water: lanterns opposite the lit
      // rises, cypresses opposite the flat-road (even) gems.
      invCypress(26 * T);
      invLantern(14 * T);
      invLantern(37 * T);
      invLantern(50 * T);
      invLantern(63 * T);
      invCypress(74 * T);

      // 5) ripple shimmer — a few pale streaks drifting slowly, selling water.
      ctx.strokeStyle = C.alpha(waterHiCool, 0.22);
      ctx.lineWidth = Math.max(1, T * 0.05);
      for (let i = 0; i < 4; i++) {
        const ry = top + (0.4 + i * 0.5) * T + Math.sin(t * 0.5 + i * 1.3) * 1.6;
        ctx.beginPath();
        ctx.moveTo(x0, ry);
        ctx.lineTo(x1, ry);
        ctx.stroke();
      }

      ctx.restore(); // end the band clip

      // 6) the brighter near-bank line — the shore that seals the water off
      //    from the road, so the eye never confuses the two.
      ctx.save();
      ctx.strokeStyle = C.alpha(C.tint(P.stone, 0.2), 0.7);
      ctx.lineWidth = Math.max(2, T * 0.14);
      ctx.beginPath();
      for (let x = x0; x <= x1; x += 6) {
        const y = bot + Math.sin(x * 0.025 + t * 0.5) * 0.8;
        if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    },

    build(b) {
      // One continuous, forgiving floor. The road rises only in gentle one-row
      // banks above it — a raised terrace rhythm, never a climb.
      b.ground(0, 87, 13);

      // ── THE ROAD SETS OUT ────────────────────────────────────────────────
      // Open on the surah's own image: the noor-lit lane, a lantern lighting
      // the way ahead. No flowered mound.
      b.start(2);
      b.prop('lantern', 4).prop('tuft', 6, { v: 1 }).prop('flowers', 8, { v: 2 });

      // ── AYAH 1 (odd · the lit way affirmed) ──────────────────────────────
      // A small lantern-pair rise — a one-row bank flanked by two lanterns.
      // The first gem rests on the lit road, lifted a step above the flat.
      b.block(10, 14, 12, 12);
      b.prop('lantern', 10).prop('lantern', 14, { v: 1 });
      b.gem(1, 12, 10);

      // ── AYAH 2 (even · the other way, passed) ────────────────────────────
      // Flat road, directly opposite a reflected cypress across the water. A
      // real cypress stands on the bank; its dim mirror hangs in the river.
      b.prop('cypress', 26).prop('flowers', 22, { v: 1 });
      b.gem(2, 24, 11);
      b.creature('bird', 28, 12, { range: 0 }); // one roosting bird on the road

      // ── AYAH 3 (odd · the lit way affirmed) ──────────────────────────────
      b.block(35, 39, 12, 12);
      b.prop('lantern', 35).prop('lantern', 39, { v: 1 });
      b.gem(3, 37, 10);

      // ── THE SECRET · mid-road ────────────────────────────────────────────
      // A bounce pad on the open road, the hidden blossom straight overhead.
      b.bounce(44);
      b.blossom(44, 7);
      b.prop('flowers', 42, { v: 2 });

      // ── AYAH 4 (even · the other way, passed) ────────────────────────────
      // Flat road opposite a reflected lantern in the still water.
      b.prop('cypress', 52, { v: 1 }).prop('flowers', 48, { v: 1 });
      b.gem(4, 50, 11);

      // ── AYAH 5 (odd · the lit way affirmed) ──────────────────────────────
      b.block(61, 65, 12, 12);
      b.prop('lantern', 61).prop('lantern', 65, { v: 1 });
      b.gem(5, 63, 10);

      // ── AYAH 6 (even · the other way, passed) ────────────────────────────
      // Flat road opposite the second mirrored cypress — the last time the
      // other way is seen before the road turns homeward to the rest.
      b.prop('cypress', 72).prop('flowers', 76, { v: 2 });
      b.gem(6, 74, 11);

      // ── THE REST ─────────────────────────────────────────────────────────
      // The earned campfire and the shrine door beyond it, flat and open,
      // nothing floating in either column. The lit road simply arrives home.
      b.campfire(80);
      b.door(84);
      b.prop('cypress', 86, { v: 1 }).prop('flowers', 82, { v: 1 });

      // ── THE SINGING TRAIL ────────────────────────────────────────────────
      // A thread of noor pacing the whole lit way, arcing up onto each bank.
      b.seedRun(4, 8, 2);
      b.seedArc(9, 11, 15, 10, 5, 0.9);   // up onto rise 1
      b.seedRun(17, 23, 2);
      b.seed(24, 10);                      // over gem 2
      b.seedRun(27, 33, 2);
      b.seedArc(34, 11, 40, 10, 5, 0.9);  // up onto rise 3
      b.seed(44, 11).seed(44, 9);         // the secret pad and its blossom line
      b.seedRun(46, 49, 2);
      b.seed(50, 10);                     // over gem 4
      b.seedRun(52, 59, 2);
      b.seedArc(60, 11, 66, 10, 5, 0.9);  // up onto rise 5
      b.seedRun(68, 78, 2);

      // ── FIREFLIES · warm noor glow drifting the road ahead ───────────────
      b.creature('butterfly', 18, 7, { colA: '#FFE9A8', colB: '#FFF6DA' })
       .creature('butterfly', 46, 6, { colA: '#FFE4A0', colB: '#FFF6DA' })
       .creature('butterfly', 70, 7, { colA: '#FFEDB4', colB: '#FFF6DA' });
    }
  });
})();
