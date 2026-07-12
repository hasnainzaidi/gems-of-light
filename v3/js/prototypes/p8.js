// v3 Prototype 8 — Landmark World
// Hypothesis: can one memorable central landmark improve navigation and
// memory? A great lighthouse-minaret stands at the level's heart; the path
// orbits it, so the child passes the same beacon from low ground, from a
// high lane, and again at its very foot — always knowing where they are.
// Al-Falaq's five gems ring the tower. Emotion: orientation — "I know where
// I am." The ending rests at the minaret's foot.
(function () {
  const GOL = window.GOL;

  GOL.PROTOTYPES[8] = {
    id: 8, key: 'landmark', name: 'landmark world',
    surahId: 113,
    palette: 'fatiha', // radiant morning — cream stone catches the fullest light
    w: 100, h: 16,
    build(b) {
      b.ground(0, 99, 13);

      // --- the western shore: the first gem on a flowered mound, in sight
      //     of the beacon downfield
      b.block(8, 11, 12, 12);
      b.gem(1, 9, 10);
      b.prop('olive', 5).prop('flowers', 12, { v: 1 }).prop('bush', 15);

      // --- garden stairs lift the second gem a little into the air
      b.slab(16, 18, 11);
      b.slab(20, 22, 10);
      b.gem(2, 21, 8);
      b.prop('cypress', 24);
      b.creature('tortoise', 14, null, { range: 60 });

      // --- a hidden Rahma blossom, straight up off a bounce pad
      b.bounce(28);
      b.blossom(28, 6);
      b.prop('lantern', 32);

      // --- the mid meadow: two more gems on low rises, the tower filling the
      //     sky ahead the whole way
      b.block(33, 35, 12, 12);
      b.gem(3, 34, 10);
      b.block(40, 42, 12, 12);
      b.gem(5, 41, 10);
      b.prop('flowers', 37, { v: 2 }).prop('fruit', 46, { v: 1 });

      // --- the landmark's foot: flat open ground so the beacon reads clearly.
      //     The resting place and the shrine door stand at its base.
      b.campfire(44);
      b.door(50); // dead centre — the shrine door set into the minaret's foot
      b.prop('lantern', 48);

      // --- the high lane on the tower's eastern flank: the player climbs past
      //     the beacon, walks back at its shoulder-height (the second pass),
      //     then drops to the foot for the ending (the third pass)
      b.slab(52, 66, 7);
      b.gem(4, 58, 5);
      b.slab(60, 62, 10); // the step that boards the high lane

      // --- the eastern approach and the way up
      b.prop('olive', 70).prop('bush', 74, { v: 1 });
      b.creature('bird', 20).creature('bird', 62).creature('bird', 72)
       .creature('butterfly', 28, 6).creature('butterfly', 41, 8)
       .creature('butterfly', 58, 4);

      b.start(3);

      // noor seeds thread the whole orbit so the trail always sings
      b.seedRun(4, 12);
      b.seed(21, 7);
      b.seedRun(24, 42, 2);
      b.seedArc(52, 6, 66, 6, 4, 1);
      b.seed(56, 5).seed(60, 5);
    },

    // The signature: a great lighthouse-minaret of cream stone, based on
    // row 13 at x=50 (w=100 → world centre 50*48 = 2400 px). It rises ~13
    // tiles, poking above the phone's view, with a warm lantern glow pulsing
    // at its crown. Painterly: no outlines — edges are darker tones of the
    // stone hue; light falls from the upper-right; the whole tower breathes.
    drawLandmark(ctx, t, P, L) {
      const cx = 50 * GOL.TILE, groundY = 13 * GOL.TILE; // 2400, 624
      const C = GOL.color;
      const stone = P.stone, sh = P.stoneShade;
      const warm = P.sunGlow || '#FFE9A8', warmDeep = P.gold || '#F0C878';

      // half-width of the tapering shaft at a height `up` above the base
      const shaftTop = 452;
      const wAt = (up) => {
        const k = Math.min(1, Math.max(0, up / shaftTop));
        return 66 - 26 * k + Math.sin(k * Math.PI) * 4; // slight entasis bulge
      };

      ctx.save();
      ctx.translate(cx, groundY);
      ctx.rotate(Math.sin(t * 0.5) * 0.005); // a slow breath from the base

      const pulse = 0.72 + 0.28 * Math.sin(t * 1.5);
      const chH = 74, chW = 40;
      const galleryY = -shaftTop, chTop = galleryY - 20;
      const chMid = chTop - chH * 0.5;

      // soft shadow pooling at the foot
      ctx.fillStyle = C.alpha(C.shade(stone, 0.6), 0.18);
      ctx.beginPath();
      ctx.ellipse(10, 6, 108, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // the lantern halo, behind the stone so it blooms out around the crown
      const crownY = chMid - 20;
      const halo = ctx.createRadialGradient(0, crownY, 12, 0, crownY, 300);
      halo.addColorStop(0, C.alpha(warm, 0.42 * pulse));
      halo.addColorStop(0.45, C.alpha(warm, 0.16 * pulse));
      halo.addColorStop(1, C.alpha(warm, 0));
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(0, crownY, 300, 0, Math.PI * 2); ctx.fill();

      // base plinth — a broad stone footing
      const plinth = ctx.createLinearGradient(-84, 0, 84, 0);
      plinth.addColorStop(0, C.shade(stone, 0.34));
      plinth.addColorStop(0.5, sh);
      plinth.addColorStop(1, C.tint(stone, 0.1));
      ctx.fillStyle = plinth;
      ctx.beginPath();
      ctx.moveTo(-82, 0); ctx.lineTo(-74, -46);
      ctx.lineTo(74, -46); ctx.lineTo(82, 0);
      ctx.closePath(); ctx.fill();

      // the shaft — one tall gouache column, lit from the upper-right
      const shaft = ctx.createLinearGradient(-70, 0, 70, 0);
      shaft.addColorStop(0, C.shade(stone, 0.30));
      shaft.addColorStop(0.42, stone);
      shaft.addColorStop(0.66, C.tint(stone, 0.16));
      shaft.addColorStop(1, C.shade(stone, 0.24));
      ctx.fillStyle = shaft;
      ctx.beginPath();
      ctx.moveTo(-wAt(0), -40);
      for (let up = 40; up <= shaftTop; up += 40) ctx.lineTo(-wAt(up), -up);
      ctx.lineTo(wAt(shaftTop), -shaftTop);
      for (let up = shaftTop; up >= 40; up -= 40) ctx.lineTo(wAt(up), -up);
      ctx.lineTo(wAt(0), -40);
      ctx.closePath(); ctx.fill();

      // masonry courses — soft darker bands across the shaft
      ctx.strokeStyle = C.alpha(C.shade(stone, 0.5), 0.22);
      ctx.lineWidth = 3;
      for (let up = 70; up < shaftTop; up += 58) {
        const w = wAt(up) - 3;
        ctx.beginPath();
        ctx.moveTo(-w, -up);
        ctx.quadraticCurveTo(0, -up + 3, w, -up);
        ctx.stroke();
      }

      // a slim lancet window, warm within
      const winY = -shaftTop * 0.5;
      ctx.fillStyle = C.alpha(warmDeep, 0.5);
      ctx.beginPath();
      ctx.moveTo(-9, winY); ctx.lineTo(-9, winY - 40);
      ctx.quadraticCurveTo(0, winY - 58, 9, winY - 40);
      ctx.lineTo(9, winY); ctx.closePath(); ctx.fill();

      // gallery — an overhanging ring beneath the lantern
      ctx.fillStyle = C.shade(sh, 0.12);
      ctx.beginPath();
      ctx.moveTo(-wAt(shaftTop) - 14, galleryY);
      ctx.lineTo(-wAt(shaftTop) - 8, galleryY - 20);
      ctx.lineTo(wAt(shaftTop) + 8, galleryY - 20);
      ctx.lineTo(wAt(shaftTop) + 14, galleryY);
      ctx.closePath(); ctx.fill();

      // the lantern chamber — cream posts around a pulsing warm heart
      const lantern = ctx.createRadialGradient(0, chMid, 4, 0, chMid, 64);
      lantern.addColorStop(0, C.alpha(C.tint(warm, 0.4), 0.95 * pulse));
      lantern.addColorStop(0.5, C.alpha(warm, 0.7 * pulse));
      lantern.addColorStop(1, C.alpha(warmDeep, 0));
      ctx.fillStyle = lantern;
      ctx.fillRect(-chW, chTop - chH, chW * 2, chH);
      ctx.fillStyle = C.tint(stone, 0.14);
      for (const px of [-chW + 2, -3, chW - 8]) ctx.fillRect(px, chTop - chH, 6, chH);
      ctx.fillStyle = sh;
      ctx.fillRect(-chW, chTop - chH - 6, chW * 2, 6); // lintel

      // domed cap and its little finial-flame
      const domeY = chTop - chH - 6;
      const cap = ctx.createLinearGradient(-chW, domeY, chW, domeY);
      cap.addColorStop(0, C.shade(stone, 0.22));
      cap.addColorStop(0.5, C.tint(stone, 0.2));
      cap.addColorStop(1, C.shade(stone, 0.14));
      ctx.fillStyle = cap;
      ctx.beginPath();
      ctx.moveTo(-chW - 4, domeY);
      ctx.quadraticCurveTo(0, domeY - 66, chW + 4, domeY);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = warmDeep;
      ctx.beginPath(); ctx.arc(0, domeY - 66, 6 + pulse * 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.alpha(warm, 0.5 * pulse);
      ctx.beginPath(); ctx.arc(0, domeY - 66, 16 + pulse * 4, 0, Math.PI * 2); ctx.fill();

      // two long soft beams sweeping from the lantern — the beacon reaching out
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 2; i++) {
        const dir = i ? 1 : -1;
        const g = ctx.createLinearGradient(0, chMid, dir * 300, chMid - 60);
        g.addColorStop(0, C.alpha(warm, 0.10 * pulse));
        g.addColorStop(1, C.alpha(warm, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, chMid - 8);
        ctx.lineTo(dir * 300, chMid - 70);
        ctx.lineTo(dir * 300, chMid + 30);
        ctx.closePath(); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      ctx.restore();
    }
  };
})();
