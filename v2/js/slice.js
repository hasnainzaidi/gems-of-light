// Gems of Light — slice.js
// Painterly vertical slice: generated gouache assets composited by code,
// with code keeping only the living parts — motion, light, particles.
// Used by slice.html (playable) and tools/render-slice.mjs (headless).
(function () {
  const SLICE = (window.SLICE = {});

  // ------------------------------------------------------------- assets ---
  const FILES = {
    bgFar: 'assets/paint/proc/bg-far.png',
    bgMid: 'assets/paint/proc/bg-mid.png',
    groundTop: 'assets/paint/proc/ground-top.png',
    groundFill: 'assets/paint/proc/ground-fill.png',
    platform: 'assets/paint/proc/platform.png',
    tree: 'assets/paint/proc/tree-olive.png',
    plant0: 'assets/paint/proc/plant-0.png',
    plant1: 'assets/paint/proc/plant-1.png',
    plant2: 'assets/paint/proc/plant-2.png',
    gem: 'assets/paint/proc/gem.png',
    llIdle: 'assets/paint/proc/ll-idle.png',
    llWalkA: 'assets/paint/proc/ll-walk-a.png',
    llWalkB: 'assets/paint/proc/ll-walk-b.png',
    llJump: 'assets/paint/proc/ll-jump.png',
    llCollect: 'assets/paint/proc/ll-collect.png',
    fringe: 'assets/paint/proc/grass-fringe.png'
  };
  SLICE.FILES = FILES;

  // ------------------------------------------------------------- world ----
  const GROUND_Y = 560;            // world y of the walkable surface
  const WORLD_W = 3400;
  const PLATFORM = { x: 2080, y: GROUND_Y - 190, w: 470 };  // top surface
  const GEM = { x: PLATFORM.x + PLATFORM.w / 2, y: PLATFORM.y - 130 };
  const SPRITE_H = 118;            // Lightling's on-screen height (idle)

  const S = {
    img: null, W: 1180, H: 720,
    t: 0, px: 260, py: GROUND_Y, vx: 0, vy: 0,
    grounded: true, facing: 1, moving: false, stepT: 0,
    camX: 0, collected: false, ceremony: 0, // ceremony: seconds remaining
    fx: [], input: { left: false, right: false, jump: false },
    demo: false
  };
  SLICE.state = S;

  SLICE.init = function (images, W, H) {
    S.img = images; S.W = W; S.H = H;
    S.camX = 0;
  };

  // --------------------------------------------------------------- fx -----
  function spawn(type, x, y, o) {
    o = o || {};
    const p = { type, x, y, age: 0, ...o };
    if (type === 'mote') Object.assign(p, { vx: rnd(-8, 8), vy: rnd(-6, -2), life: rnd(4, 7), size: rnd(1.4, 3) });
    if (type === 'leaf') Object.assign(p, { vx: rnd(-18, 4), vy: rnd(10, 24), life: rnd(4, 7), size: rnd(4, 7), spin: rnd(1, 3), ph: rnd(0, 7) });
    if (type === 'sparkle') Object.assign(p, { vx: rnd(-24, 24), vy: rnd(-40, -6), life: rnd(0.5, 1.1), size: rnd(2, 4) });
    if (type === 'burst') Object.assign(p, { life: rnd(0.7, 1.2), size: rnd(2.5, 5) });
    S.fx.push(p);
  }
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ------------------------------------------------------------- update ---
  SLICE.tick = function (dt) {
    S.t += dt;
    // demo pilot: walk, hop onto the platform, collect, walk on
    if (S.demo) {
      const inp = S.input;
      inp.left = inp.right = false; inp.jump = false;
      if (S.ceremony <= 0) {
        if (!S.collected) {
          if (S.px < PLATFORM.x + 90) inp.right = true;
          if (!S.grounded) { /* keep drifting */ inp.right = true; }
          if (S.grounded && S.px > PLATFORM.x - 170 && S.px < PLATFORM.x - 60 && S.py >= GROUND_Y - 1) inp.jump = true;
          if (S.py <= PLATFORM.y + 1 && S.px < GEM.x) inp.right = true;
        } else {
          if (S.px < WORLD_W - 700) inp.right = true;
        }
      }
    }

    if (S.ceremony > 0) {
      S.ceremony -= dt;
      S.vx = 0; S.moving = false;
      if (Math.random() < dt * 30) spawn('sparkle', S.px + rnd(-40, 40), S.py - 60 + rnd(-50, 50));
    } else {
      // movement
      const acc = 900, max = 230;
      if (S.input.left) { S.vx = Math.max(S.vx - acc * dt, -max); S.facing = -1; }
      else if (S.input.right) { S.vx = Math.min(S.vx + acc * dt, max); S.facing = 1; }
      else S.vx *= Math.pow(0.0001, dt);
      S.moving = Math.abs(S.vx) > 20;
      if (S.input.jump && S.grounded) { S.vy = -790; S.grounded = false; }
      S.vy += 1400 * dt;
      S.px = Math.max(80, Math.min(WORLD_W - 80, S.px + S.vx * dt));
      S.py += S.vy * dt;
      // land on ground or platform
      S.grounded = false;
      const overPlat = S.px > PLATFORM.x - 10 && S.px < PLATFORM.x + PLATFORM.w + 10;
      const floorY = overPlat && S.py <= PLATFORM.y + 40 ? PLATFORM.y : GROUND_Y;
      if (S.py >= floorY && S.vy >= 0) { S.py = floorY; S.vy = 0; S.grounded = true; }
      if (S.moving && S.grounded) S.stepT += dt; else S.stepT = 0;
      // collect
      if (!S.collected && Math.hypot(S.px - GEM.x, (S.py - 70) - GEM.y) < 70) {
        S.collected = true; S.ceremony = 2.4;
        for (let i = 0; i < 22; i++) {
          const a = (i / 22) * Math.PI * 2;
          spawn('burst', GEM.x, GEM.y, { vx: Math.cos(a) * rnd(40, 150), vy: Math.sin(a) * rnd(40, 150) });
        }
      }
    }

    // camera
    const target = S.px + S.facing * 90 - S.W / 2;
    S.camX += (Math.max(0, Math.min(WORLD_W - S.W, target)) - S.camX) * Math.min(1, dt * 4);

    // ambient fx
    if (Math.random() < dt * 3) spawn('mote', S.camX + Math.random() * S.W, rnd(S.H * 0.15, S.H * 0.8));
    if (Math.random() < dt * 0.5) spawn('leaf', S.camX + Math.random() * S.W, -10);
    for (let i = S.fx.length - 1; i >= 0; i--) {
      const p = S.fx[i];
      p.age += dt;
      if (p.age >= p.life) { S.fx.splice(i, 1); continue; }
      p.vy = (p.vy || 0) + (p.type === 'sparkle' ? -14 : p.type === 'burst' ? 26 : 0) * dt;
      p.x += (p.vx || 0) * dt + (p.type === 'leaf' ? Math.sin(p.age * p.spin * 2 + p.ph) * 26 * dt : 0);
      p.y += (p.vy || 0) * dt;
    }
  };

  // -------------------------------------------------------------- draw ----
  let grain = null;
  function grainTile(mk) {
    if (grain) return grain;
    grain = mk(256, 256);
    const x = grain.getContext('2d');
    let s = 4242;
    const r = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let i = 0; i < 420; i++) {
      x.fillStyle = r() < 0.5 ? 'rgba(120,100,60,' + (0.02 + r() * 0.035) + ')' : 'rgba(255,252,238,' + (0.02 + r() * 0.04) + ')';
      x.beginPath();
      x.ellipse(r() * 256, r() * 256, 0.6 + r() * 1.6, 0.5 + r() * 1.2, r() * Math.PI, 0, Math.PI * 2);
      x.fill();
    }
    return grain;
  }

  SLICE.draw = function (ctx, makeCanvas) {
    const { img } = S, W = S.W, H = S.H, t = S.t, cam = S.camX;

    // --- sky + far hills: the painting, cover-fit, slow parallax
    {
      const im = img.bgFar;
      const sc = Math.max(W / im.width, H / im.height) * 1.06;
      const dx = -cam * 0.04 - (im.width * sc - W) * 0.3;
      ctx.drawImage(im, dx, H - im.height * sc, im.width * sc, im.height * sc);
    }
    // --- god rays from the painted sun (upper right)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const sx = W * 0.86, sy = H * 0.14;
    for (let i = 0; i < 4; i++) {
      const a = Math.PI * 0.6 + i * 0.1 + Math.sin(t * 0.13 + i * 1.7) * 0.012;
      const len = H * 1.4;
      const g = ctx.createLinearGradient(sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len);
      g.addColorStop(0, 'rgba(255,243,196,' + (0.05 + 0.025 * Math.sin(t * 0.4 + i * 2.1)) + ')');
      g.addColorStop(1, 'rgba(255,243,196,0)');
      ctx.fillStyle = g;
      const wid = 0.05 + 0.02 * Math.sin(t * 0.21 + i);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(a - wid) * len, sy + Math.sin(a - wid) * len);
      ctx.lineTo(sx + Math.cos(a + wid) * len, sy + Math.sin(a + wid) * len);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // --- mid hills: painted cutout, two instances
    {
      const im = img.bgMid;
      const sc = 0.68;
      for (const ox of [-140, 1500, 3140]) {
        const dx = ox - cam * 0.2;
        // sit low enough that the faded base dissolves into the meadow haze
        if (dx > -im.width * sc && dx < W + 40) ctx.drawImage(im, dx, GROUND_Y - 118 - im.height * sc * 0.62, im.width * sc, im.height * sc);
      }
    }

    // ================= world space =================
    ctx.save();
    ctx.translate(-cam, 0);

    // --- ground: painted wall strip, tiled; fill below
    {
      // smaller brick scale so the masonry reads finely against the character
      const im = img.groundTop, sc = 300 / im.height;
      const tw = im.width * sc;
      const x0 = Math.floor(cam / tw) * tw;
      for (let x = x0; x < cam + W; x += tw) {
        ctx.drawImage(im, x, GROUND_Y, tw, im.height * sc);
        // deep fill below the strip if the view reaches that far
        if (H > GROUND_Y + 300) {
          const f = img.groundFill, fs = 300 / f.height;
          for (let fx = x; fx < x + tw; fx += f.width * fs) {
            ctx.drawImage(f, fx, GROUND_Y + 300, f.width * fs, f.height * fs);
          }
        }
      }
      // painted grass fringe draped over the wall's top edge — kills the hard cut
      const fr = img.fringe, fsc = 44 / fr.height;
      const fw = fr.width * fsc * 0.86; // overlap so the faded ends blend
      const fx0 = Math.floor(cam / fw) * fw;
      let k = Math.floor(cam / fw);
      for (let x = fx0; x < cam + W + fw; x += fw, k++) {
        ctx.save();
        if (k % 2) { // mirror every other tile to hide repetition
          ctx.translate(x + fr.width * fsc / 2, 0); ctx.scale(-1, 1); ctx.translate(-(x + fr.width * fsc / 2), 0);
        }
        ctx.drawImage(fr, x, GROUND_Y - 26, fr.width * fsc, fr.height * fsc);
        ctx.restore();
      }
    }

    // --- props (painted cutouts), back to front
    const prop = (im, x, baseY, h, flip) => {
      const sc = h / im.height, w = im.width * sc;
      ctx.save();
      ctx.translate(x, baseY);
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(im, -w / 2, -h, w, h);
      ctx.restore();
    };
    // settled shadows first
    const shadow = (x, y, w) => {
      const sg = ctx.createRadialGradient(x, y + 4, 2, x, y + 4, w);
      sg.addColorStop(0, 'rgba(52,72,50,0.16)');
      sg.addColorStop(1, 'rgba(52,72,50,0)');
      ctx.save();
      ctx.translate(x, y + 4); ctx.scale(1, 0.14); ctx.translate(-x, -(y + 4));
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(x, y + 4, w, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };
    shadow(1290, GROUND_Y + 6, 170);
    prop(img.tree, 1290, GROUND_Y + 34, 560); // roots settle into the meadow line
    shadow(560, GROUND_Y, 80);  prop(img.plant1, 560, GROUND_Y + 6, 150);
    shadow(880, GROUND_Y, 95);  prop(img.plant0, 880, GROUND_Y + 6, 140);
    shadow(1660, GROUND_Y, 70); prop(img.plant2, 1660, GROUND_Y + 6, 135, true);
    shadow(2480, GROUND_Y, 80); prop(img.plant1, 2480, GROUND_Y + 6, 145, true);
    shadow(2900, GROUND_Y, 90); prop(img.plant2, 2900, GROUND_Y + 6, 140);
    shadow(3180, GROUND_Y, 95); prop(img.plant0, 3180, GROUND_Y + 6, 150, true);

    // --- floating platform
    {
      const im = img.platform;
      const sc = PLATFORM.w / (im.width * 0.94); // walkable span ≈ art minus fern overhang
      const w = im.width * sc, h = im.height * sc;
      // top surface in the art sits ~150/384 down
      const topInArt = 150 * sc;
      ctx.drawImage(im, PLATFORM.x + PLATFORM.w / 2 - w / 2, PLATFORM.y - topInArt, w, h);
      // soft cast shadow on the ground below
      ctx.fillStyle = 'rgba(52,72,50,0.13)';
      ctx.beginPath(); ctx.ellipse(PLATFORM.x + PLATFORM.w / 2, GROUND_Y + 8, PLATFORM.w * 0.42, 14, 0, 0, Math.PI * 2); ctx.fill();
    }

    // --- the gem: painted crystal + living light
    if (!S.collected || S.ceremony > 0) {
      const rise = S.ceremony > 0 ? Math.min(1, (2.4 - S.ceremony) / 1.1) : 0;
      const gy = GEM.y + Math.sin(t * 1.4) * 9 - rise * rise * 260;
      const fade = S.ceremony > 0 ? Math.max(0, 1 - rise * 1.05) : 1;
      const pulse = 0.8 + 0.2 * Math.sin(t * 2.1);
      ctx.save();
      ctx.globalAlpha = Math.max(0, fade);
      // halo
      const halo = ctx.createRadialGradient(GEM.x, gy, 6, GEM.x, gy, 130);
      halo.addColorStop(0, 'rgba(190,240,190,' + 0.4 * pulse + ')');
      halo.addColorStop(0.5, 'rgba(190,240,190,' + 0.13 * pulse + ')');
      halo.addColorStop(1, 'rgba(190,240,190,0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(GEM.x, gy, 130, 0, Math.PI * 2); ctx.fill();
      const gw = 62 * (1 + 0.03 * Math.sin(t * 2.1));
      ctx.drawImage(img.gem, GEM.x - gw / 2, gy - gw, gw, gw * 2);
      // sparkle cross
      if (Math.sin(t * 3.2) > 0.6) {
        const a = (Math.sin(t * 3.2) - 0.6) / 0.4;
        ctx.strokeStyle = 'rgba(255,255,255,' + 0.9 * a + ')';
        ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        const tx = GEM.x + 16, ty = gy - 30, r2 = 9 * a;
        ctx.beginPath();
        ctx.moveTo(tx - r2, ty); ctx.lineTo(tx + r2, ty);
        ctx.moveTo(tx, ty - r2); ctx.lineTo(tx, ty + r2);
        ctx.stroke();
      }
      ctx.restore();
      if (Math.random() < 0.12) spawn('sparkle', GEM.x + rnd(-24, 24), gy + rnd(-30, 30));
    }

    // --- Lightling: painted frames, animated by code
    {
      const inAir = !S.grounded;
      let im = img.llIdle;
      if (S.ceremony > 0) im = img.llCollect;
      else if (inAir) im = img.llJump;
      else if (S.moving) im = Math.floor(S.stepT / 0.14) % 2 ? img.llWalkB : img.llWalkA;
      const h = SPRITE_H * (im === img.llJump ? 1.02 : 1);
      const sc = h / 403; // idle frame height as reference
      const w = im.width * sc, hh = im.height * sc;
      // breathing + step bob (gentle squash so the painting stays intact)
      const bob = S.moving && S.grounded ? Math.abs(Math.sin(t * 9)) * -3 : Math.sin(t * 1.6) * -1.5;
      const squash = S.grounded && !S.moving ? 1 + Math.sin(t * 1.8) * 0.012 : 1;
      // shadow
      const gd = Math.max(0, Math.min(1, 1 - (GROUND_Y - S.py) / 260));
      ctx.fillStyle = 'rgba(52,72,50,' + 0.22 * gd + ')';
      const shY = S.px > PLATFORM.x - 10 && S.px < PLATFORM.x + PLATFORM.w + 10 && S.py <= PLATFORM.y + 4 ? PLATFORM.y : GROUND_Y;
      ctx.beginPath(); ctx.ellipse(S.px, (S.grounded ? S.py : shY) + 6, 34 * gd + 14, 7 * gd + 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.translate(S.px, S.py + bob);
      ctx.rotate(S.vx / 230 * 0.06);
      const walkFrame = im === img.llWalkA || im === img.llWalkB;
      ctx.scale(walkFrame ? -S.facing : S.facing, 1);
      ctx.scale(1 / squash, squash);
      // warmth during the ceremony — light blooming through the painting
      if (S.ceremony > 0) {
        const k = Math.min(1, (2.4 - S.ceremony) / 0.5) * Math.min(1, S.ceremony / 0.5);
        const wg = ctx.createRadialGradient(0, -hh * 0.45, 4, 0, -hh * 0.45, hh);
        wg.addColorStop(0, 'rgba(255,236,170,' + 0.45 * k + ')');
        wg.addColorStop(1, 'rgba(255,236,170,0)');
        ctx.fillStyle = wg;
        ctx.beginPath(); ctx.arc(0, -hh * 0.45, hh, 0, Math.PI * 2); ctx.fill();
      }
      ctx.drawImage(im, -w / 2, -hh, w, hh);
      ctx.restore();
    }

    // --- particles
    for (const p of S.fx) {
      const k = 1 - p.age / p.life;
      ctx.globalAlpha = Math.min(1, k * 1.6) * 0.85;
      if (p.type === 'leaf') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.sin(p.age * p.spin + p.ph) * 0.9);
        ctx.fillStyle = '#9CBF7E';
        ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.45, 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (p.type === 'sparkle' || p.type === 'burst') {
        ctx.strokeStyle = p.type === 'burst' ? '#BDEBb8'.replace('b8', 'B8') : '#FFF3C4';
        ctx.lineWidth = 1.4; ctx.lineCap = 'round';
        const s2 = p.size * (0.5 + k * 0.5);
        ctx.beginPath();
        ctx.moveTo(p.x - s2, p.y); ctx.lineTo(p.x + s2, p.y);
        ctx.moveTo(p.x, p.y - s2); ctx.lineTo(p.x, p.y + s2);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FFF6DC';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * k, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // ================= end world space =================

    // --- ceremony veil
    if (S.ceremony > 0) {
      const k = Math.min(1, (2.4 - S.ceremony) / 0.5) * Math.min(1, S.ceremony / 0.6);
      ctx.fillStyle = 'rgba(34,53,42,' + 0.32 * k + ')';
      ctx.fillRect(0, 0, W, H);
    }
    // --- collected gem resting in the corner band
    if (S.collected && S.ceremony < 1.3) {
      const k = Math.min(1, (1.3 - Math.max(0, S.ceremony)) / 0.5);
      ctx.save();
      ctx.globalAlpha = k;
      ctx.fillStyle = 'rgba(250,244,224,0.85)';
      ctx.strokeStyle = 'rgba(200,155,85,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(W / 2, 44, 30, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.drawImage(img.gem, W / 2 - 12, 22, 24, 48);
      ctx.restore();
    }
    // --- paper grain + vignette
    const gt = grainTile(makeCanvas);
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let x = 0; x < W; x += 256) for (let y = 0; y < H; y += 256) ctx.drawImage(gt, x, y);
    ctx.restore();
    const v = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(30,43,34,0)');
    v.addColorStop(1, 'rgba(30,43,34,0.18)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  };
})();
