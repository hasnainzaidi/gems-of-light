// Gems of Light — engine.js
// Input, physics, camera, particles, creatures. The physics is deliberately
// generous: floaty jumps, coyote time, jump buffering, corner forgiveness.
// There is no way to fail — water lifts you gently back to the bank.
(function () {
  const GOL = window.GOL;
  const TILE = GOL.TILE;
  const { alpha } = GOL.color;

  // ---------------------------------------------------------------- input --
  const Input = {
    left: false, right: false, jumpHeld: false,
    _jumpQueued: false,
    taps: [],            // {x,y} taps this frame (for UI)
    pointers: new Map(), // active pointers
    drag: null,          // {id,x,y,startX,startY} first active pointer drag
    touchMode: false,
    _keys: {},
    zones: null,         // set by level scene: {btnL:{x,y,r}, btnR:{...}, jumpX} in CSS px
    canvas: null,

    init(canvas) {
      this.canvas = canvas;
      addEventListener('keydown', (e) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'a', 'd', 'w', 'A', 'D', 'W'].includes(e.key)) e.preventDefault();
        if (e.repeat) return;
        this._keys[e.key] = true;
        if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') this.queueJump();
        this._syncKeys();
      });
      addEventListener('keyup', (e) => {
        this._keys[e.key] = false;
        this._syncKeys();
      });
      const pos = (e) => {
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      canvas.addEventListener('pointerdown', (e) => {
        canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
        const p = pos(e);
        p.sx = p.x; p.sy = p.y; // remember where this touch began (for the thumbstick)
        this.touchMode = e.pointerType !== 'mouse';
        this.pointers.set(e.pointerId, p);
        if (!this.drag) this.drag = { id: e.pointerId, x: p.x, y: p.y, startX: p.x, startY: p.y };
        this.taps.push({ x: p.x, y: p.y, id: e.pointerId });
        e.preventDefault();
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!this.pointers.has(e.pointerId)) return;
        const p = pos(e);
        const prev = this.pointers.get(e.pointerId);
        p.sx = prev.sx; p.sy = prev.sy; // carry the touch's origin forward
        this.pointers.set(e.pointerId, p);
        if (this.drag && this.drag.id === e.pointerId) { this.drag.x = p.x; this.drag.y = p.y; }
      });
      const up = (e) => {
        this.pointers.delete(e.pointerId);
        if (this.drag && this.drag.id === e.pointerId) {
          this.releases.push({ x: this.drag.x, y: this.drag.y });
          this.drag = null;
        }
      };
      canvas.addEventListener('pointerup', up);
      canvas.addEventListener('pointercancel', up);
      // iOS can drop a pointerup entirely (edge swipes, notification banners,
      // a finger sliding off-screen), leaving a zombie pointer that steers
      // the thumbstick forever. Mirror the release on window, and clear
      // everything whenever the page loses the user's attention.
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
      const clearAll = () => {
        this.pointers.clear();
        this.drag = null;
        this._jumpQueued = false;
        this._keys = {};
        this._syncKeys();
      };
      window.addEventListener('blur', clearAll);
      window.addEventListener('pagehide', clearAll);
      document.addEventListener('visibilitychange', () => { if (document.hidden) clearAll(); });
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    },
    releases: [],
    _syncKeys() {
      const k = this._keys;
      this._kbLeft = !!(k['ArrowLeft'] || k['a'] || k['A']);
      this._kbRight = !!(k['ArrowRight'] || k['d'] || k['D']);
      this._kbJump = !!(k['ArrowUp'] || k[' '] || k['w'] || k['W']);
    },
    queueJump() { this._jumpQueued = true; },
    consumeJump() { const j = this._jumpQueued; this._jumpQueued = false; return j; },
    // Per-frame: resolve movement state from keys + touch zones.
    // zones = { stick:{x,y,r}, jump:{x,y,r} }. The thumbstick reads horizontal
    // lean; a touch that began on the pad keeps steering even if it slides off.
    poll(W, H) {
      let left = this._kbLeft || false, right = this._kbRight || false, jumpHeld = this._kbJump || false;
      this.stickDX = 0;
      const z = this.zones;
      if (z && z.stick) {
        for (const [, p] of this.pointers) {
          if (dist(p.sx != null ? p.sx : p.x, p.sy != null ? p.sy : p.y, z.stick.x, z.stick.y) < z.stick.r * 1.5) {
            const dx = Math.max(-1, Math.min(1, (p.x - z.stick.x) / (z.stick.r - 12)));
            this.stickDX = dx;
            if (dx < -0.24) left = true;
            else if (dx > 0.24) right = true;
          } else if (z.jump && dist(p.x, p.y, z.jump.x, z.jump.y) < z.jump.r) {
            jumpHeld = true; // holding the jump button sustains the rise
          }
        }
      }
      this.left = left; this.right = right; this.jumpHeld = jumpHeld;
    },
    // A tap that begins on the jump button queues a jump (edge-trigger).
    routeTapsToJump() {
      const z = this.zones;
      if (!z || !z.jump) return;
      for (const t of this.taps) {
        if (!t.ui && dist(t.x, t.y, z.jump.x, z.jump.y) < z.jump.r) { t.ui = true; this.queueJump(); }
      }
    },
    endFrame() { this.taps.length = 0; this.releases.length = 0; }
  };
  function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
  GOL.Input = Input;
  GOL.dist = dist;

  // -------------------------------------------------------------- physics --
  // Tile codes: 0 air, 1 earth, 2 one-way slab, 3 water, 4 carved stone.
  const SOLID = (t) => t === 1 || t === 4;
  GOL.isSolid = SOLID;
  const P = {
    WALK: 205, ACCEL: 1250, DECEL: 1500,
    G_RISE_HELD: 900, G_RISE: 1500, G_APEX: 620, G_FALL: 1450,
    JUMP_V: -562, MAX_FALL: 600,
    COYOTE: 0.13, BUFFER: 0.18,
    W: 11, H: 32 // half-width, height (feet-anchored box)
  };
  GOL.PHYS = P;

  function makePlayer(x, y) {
    return {
      x, y, vx: 0, vy: 0,
      grounded: true, coyote: 0, buffer: 0,
      facing: 1, t: 0, idleT: 0,
      blink: false, blinkT: 2 + Math.random() * 3,
      squashX: 1, squashY: 1, sqVX: 0, sqVY: 0,
      lastSafe: { x, y },
      rescue: null, // water rescue tween
      moving: false,
      gallopBoosted: false
    };
  }
  GOL.makePlayer = makePlayer;

  function tileAt(level, px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (tx < 0 || tx >= level.w) return 1;   // walls beyond edges
    if (ty < 0) return 0;
    if (ty >= level.h) return 3;             // below the world: treated as water (soft rescue)
    return level.tiles[ty * level.w + tx];
  }
  GOL.tileAt = tileAt;

  function inGallop(level, x) {
    return !!(level.gallops && level.gallops.some((z) => x >= z.x0 && x <= z.x1));
  }
  function stopGallop(pl) {
    if (!pl.gallopBoosted) return;
    pl.gallopBoosted = false;
    pl.vx = Math.max(-P.WALK, Math.min(P.WALK, pl.vx));
  }

  function updatePlayer(pl, level, input, dt, fx) {
    pl.t += dt;

    // blink bookkeeping
    pl.blinkT -= dt;
    if (pl.blinkT < 0) { pl.blink = !pl.blink; pl.blinkT = pl.blink ? 0.12 : 2.2 + Math.random() * 3; }

    // water rescue tween: being carried back to the bank
    if (pl.rescue) {
      stopGallop(pl);
      const r = pl.rescue;
      r.t += dt / r.dur;
      const e = easeInOut(Math.min(1, r.t));
      pl.x = r.fromX + (r.toX - r.fromX) * e;
      pl.y = r.fromY + (r.toY - r.fromY) * e - Math.sin(Math.PI * Math.min(1, r.t)) * 70;
      if (fx && Math.random() < 0.35) fx.spawn('sparkle', pl.x + rnd(-10, 10), pl.y - 14, { color: '#BFE8DC' });
      if (r.t >= 1) { pl.rescue = null; pl.vx = 0; pl.vy = 0; pl.grounded = true; }
      squashSpring(pl, dt);
      return;
    }

    // horizontal intent
    let ax = 0;
    if (input.left && !input.right) { ax = -P.ACCEL; pl.facing = -1; }
    else if (input.right && !input.left) { ax = P.ACCEL; pl.facing = 1; }
    const galloping = ax > 0 && pl.grounded && inGallop(level, pl.x);
    if (pl.gallopBoosted && !galloping) stopGallop(pl);
    else pl.gallopBoosted = galloping;
    const gallopK = pl.gallopBoosted ? 1.5 : 1;
    if (ax !== 0) {
      pl.vx += ax * gallopK * dt;
      pl.vx = Math.max(-P.WALK * gallopK, Math.min(P.WALK * gallopK, pl.vx));
    } else {
      const s = Math.sign(pl.vx);
      pl.vx -= s * P.DECEL * dt;
      if (Math.sign(pl.vx) !== s) pl.vx = 0;
    }
    pl.moving = Math.abs(pl.vx) > 20;
    pl.idleT = pl.moving || !pl.grounded ? 0 : pl.idleT + dt;

    // jumping: buffer + coyote
    if (input.consumeJump()) pl.buffer = P.BUFFER;
    else pl.buffer = Math.max(0, pl.buffer - dt);
    pl.coyote = pl.grounded ? P.COYOTE : Math.max(0, pl.coyote - dt);
    if (pl.buffer > 0 && pl.coyote > 0) {
      pl.vy = P.JUMP_V;
      pl.grounded = false; pl.coyote = 0; pl.buffer = 0;
      pl.sqVX = -3.2; pl.sqVY = 3.2; // stretch
      if (fx) {
        fx.spawn('ring', pl.x, pl.y, { color: '#FFF3C4', size: 14 });
        for (let i = 0; i < 5; i++) fx.spawn('dust', pl.x + rnd(-8, 8), pl.y - 2, {});
      }
      if (GOL.audio) GOL.audio.sfx('jump');
    }

    // gravity: floaty and generous at the apex
    let g;
    if (pl.vy < -40) g = input.jumpHeld ? P.G_RISE_HELD : P.G_RISE;
    else if (pl.vy < 60) g = P.G_APEX;
    else g = P.G_FALL;
    pl.vy = Math.min(P.MAX_FALL, pl.vy + g * dt);

    // integrate + collide, x then y
    moveX(pl, level, pl.vx * dt);
    const wasAir = !pl.grounded;
    const prevFeet = pl.y;
    moveY(pl, level, pl.vy * dt, input);

    // drifting leaf platforms: one-way, and they carry you
    if (level.movers && level.movers.length) {
      let onLeaf = null;
      for (const m of level.movers) {
        const top = m.y;
        if (pl.x < m.x - m.hw - P.W || pl.x > m.x + m.hw + P.W) continue;
        if (pl.vy >= 0 && prevFeet <= top + 7 && pl.y >= top - 3 && pl.y <= top + 22) {
          pl.y = top;
          pl.vy = 0;
          pl.grounded = true;
          onLeaf = m;
          break;
        }
      }
      if (onLeaf) {
        pl.x += onLeaf.dx || 0;
        pl.carrier = onLeaf;
        onLeaf.dip = Math.min(1, (onLeaf.dip || 0) + dt * 5);
      } else {
        pl.carrier = null;
      }
    }

    if (pl.grounded && wasAir) {
      // landing: squash + dust
      const imp = Math.min(1, pl.vyLand / P.MAX_FALL || 0);
      pl.sqVX = 3.4 * (0.5 + imp); pl.sqVY = -3.4 * (0.5 + imp);
      if (fx) for (let i = 0; i < 6; i++) fx.spawn('dust', pl.x + rnd(-10, 10), pl.y - 2, {});
      if (GOL.audio) GOL.audio.sfx('land');
    }
    if (pl.grounded) {
      const t = tileAt(level, pl.x, pl.y + 4);
      if (SOLID(t) || t === 2) pl.lastSafe = { x: pl.x, y: pl.y };
    }

    // water: begin the gentle lift home
    const feetTile = tileAt(level, pl.x, pl.y - 6);
    if (feetTile === 3 || pl.y > level.h * TILE + 40) {
      if (fx) {
        for (let i = 0; i < 10; i++) fx.spawn('splash', pl.x + rnd(-14, 14), pl.y - 6, {});
        fx.spawn('ring', pl.x, pl.y - 6, { color: '#BFE8DC', size: 20 });
      }
      if (GOL.audio) GOL.audio.sfx('splash');
      pl.rescue = { t: 0, dur: 1.1, fromX: pl.x, fromY: pl.y, toX: pl.lastSafe.x, toY: pl.lastSafe.y };
    }

    // Integration can cross the strip edge, launch the child, or enter water.
    // Gallop is a grounded in-zone feeling, so normalize it in this same tick.
    if (pl.gallopBoosted && (!pl.grounded || pl.rescue || ax <= 0 || !inGallop(level, pl.x))) {
      stopGallop(pl);
    }

    squashSpring(pl, dt);
  }
  function squashSpring(pl, dt) {
    // springy squash & stretch, always recovering to 1
    const k = 90, d = 11;
    pl.sqVX += (1 - pl.squashX) * k * dt - pl.sqVX * d * dt;
    pl.sqVY += (1 - pl.squashY) * k * dt - pl.sqVY * d * dt;
    pl.squashX += pl.sqVX * dt;
    pl.squashY += pl.sqVY * dt;
  }
  function solidAt(level, px, py, falling, feetY) {
    const t = tileAt(level, px, py);
    if (SOLID(t)) return true;
    if (t === 2 && falling) {
      // one-way: only from above
      const top = Math.floor(py / TILE) * TILE + 6;
      if (feetY - top < 14) return true;
    }
    return false;
  }
  function moveX(pl, level, dx) {
    if (dx === 0) return;
    const dir = Math.sign(dx);
    let nx = pl.x + dx;
    const edge = nx + dir * P.W;
    for (const yy of [pl.y - 4, pl.y - P.H / 2, pl.y - P.H + 6]) {
      if (SOLID(tileAt(level, edge, yy))) {
        // step-up assist: a knee-high lip won't stop a small explorer
        const liftedClear = !SOLID(tileAt(level, edge, pl.y - 13)) &&
          !SOLID(tileAt(level, edge, pl.y - P.H + 2)) &&
          !SOLID(tileAt(level, pl.x, pl.y - 14));
        const feetHit = yy === pl.y - 4;
        if (feetHit && pl.grounded && liftedClear) { pl.y -= 10; continue; }
        nx = (dir > 0 ? Math.floor(edge / TILE) * TILE - P.W - 0.01 : (Math.floor(edge / TILE) + 1) * TILE + P.W + 0.01);
        pl.vx = 0;
        break;
      }
    }
    pl.x = Math.max(P.W + 2, Math.min(level.w * TILE - P.W - 2, nx));
  }
  function moveY(pl, level, dy, input) {
    let ny = pl.y + dy;
    pl.vyLand = 0;
    if (dy < 0) {
      // rising: check head, with corner forgiveness
      const head = ny - P.H;
      const hits = [-P.W + 3, 0, P.W - 3].filter((ox) => SOLID(tileAt(level, pl.x + ox, head)));
      if (hits.length) {
        if (hits.length === 1 && hits[0] !== 0) {
          // clipped a corner — nudge sideways and keep the jump
          pl.x -= Math.sign(hits[0]) * 7;
        } else {
          ny = Math.floor(head / TILE + 1) * TILE + P.H + 0.01;
          pl.vy = Math.max(pl.vy, -30);
        }
      }
      pl.grounded = false;
    } else {
      // falling / standing: generous landings (feet corners widened)
      const falling = pl.vy >= 0;
      let landed = false;
      for (const ox of [-P.W - 4, 0, P.W + 4]) {
        if (solidAt(level, pl.x + ox, ny + 1, falling, pl.y)) { landed = true; break; }
      }
      if (landed) {
        pl.vyLand = pl.vy;
        ny = Math.floor((ny + 1) / TILE) * TILE - 0.01;
        pl.vy = 0;
        pl.grounded = true;
      } else {
        pl.grounded = false;
      }
    }
    pl.y = ny;
  }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  GOL.updatePlayer = updatePlayer;
  GOL.ease = { inOut: easeInOut, out: (t) => 1 - Math.pow(1 - t, 3), in: (t) => t * t * t };
  GOL.rnd = rnd;

  // --------------------------------------------------------------- camera --
  function makeCamera(level, viewW, viewH) {
    return { x: 0, y: 0, level, viewW, viewH, lookX: 0 };
  }
  function updateCamera(cam, pl, dt) {
    cam.lookX += ((pl.facing * 74) - cam.lookX) * Math.min(1, dt * 1.6);
    const tx = pl.x + cam.lookX - cam.viewW / 2;
    const ty = pl.y - cam.viewH * 0.62;
    cam.x += (tx - cam.x) * Math.min(1, dt * 5.2);
    cam.y += (ty - cam.y) * Math.min(1, dt * 4);
    cam.x = Math.max(0, Math.min(cam.level.w * TILE - cam.viewW, cam.x));
    cam.y = Math.max(-140, Math.min(cam.level.h * TILE - cam.viewH, cam.y));
  }
  GOL.makeCamera = makeCamera;
  GOL.updateCamera = updateCamera;

  // ------------------------------------------------------------ particles --
  function makeFx() {
    return {
      list: [],
      spawn(type, x, y, o) {
        o = o || {};
        const p = { type, x, y, age: 0 };
        switch (type) {
          case 'dust':
            Object.assign(p, { vx: rnd(-30, 30), vy: rnd(-46, -8), life: rnd(0.35, 0.6), size: rnd(3, 6.5), color: o.color || '#EFE6C8', grav: 40 });
            for (const k of ['vx', 'vy', 'life', 'size', 'grav', 'alpha']) if (o[k] != null) p[k] = o[k];
            break;
          case 'sparkle':
            Object.assign(p, { vx: rnd(-26, 26), vy: rnd(-48, -6), life: rnd(0.5, 1), size: rnd(1.5, 3.4), color: o.color || '#FFF3C4', grav: -12, star: true });
            for (const k of ['vx', 'vy', 'life', 'size', 'grav', 'alpha']) if (o[k] != null) p[k] = o[k];
            break;
          case 'descentLight':
            Object.assign(p, { vx: 0, vy: o.vy || 90, life: o.life || 4, size: rnd(3, 5), color: o.color || '#FFE9A8', grav: 0, sway: rnd(0.35, 0.7), swayA: rnd(8, 18), soft: true });
            break;
          case 'mote': // ambient pollen, drifts in the light
            Object.assign(p, { vx: rnd(-9, 9), vy: rnd(-7, -2), life: rnd(4, 8), size: rnd(1.2, 2.6), color: o.color || '#FFF6DC', grav: 0, sway: rnd(0.6, 1.6), swayA: rnd(2, 7) });
            break;
          case 'leaf':
            Object.assign(p, { vx: rnd(-16, 6), vy: rnd(8, 22), life: rnd(3.5, 6), size: rnd(3, 5), color: o.color || '#A3D488', grav: 3, sway: rnd(1, 2), swayA: rnd(10, 22), spin: rnd(-2, 2) });
            break;
          case 'splash':
            Object.assign(p, { vx: rnd(-70, 70), vy: rnd(-190, -60), life: rnd(0.4, 0.7), size: rnd(2, 4.5), color: o.color || '#BFE8DC', grav: 420 });
            break;
          case 'trail':
            Object.assign(p, { vx: rnd(-9, 9), vy: rnd(-9, 9), life: rnd(0.4, 0.75), size: rnd(2.5, 5), color: o.color || '#96E2B4', grav: -26, star: Math.random() < 0.4 });
            break;
          case 'ring':
            Object.assign(p, { vx: 0, vy: 0, life: 0.55, size: o.size || 16, color: o.color || '#FFF3C4', ring: true });
            break;
          case 'burst': // gem collect firework, gentle
            Object.assign(p, { vx: Math.cos(o.a) * o.sp, vy: Math.sin(o.a) * o.sp, life: rnd(0.6, 1.1), size: rnd(2, 4.5), color: o.color, grav: 30, star: Math.random() < 0.5 });
            break;
          case 'petal': // celebration petals, falling like soft rain
            Object.assign(p, { vx: rnd(-26, 26), vy: rnd(10, 46), life: rnd(2.2, 4), size: rnd(3, 5.5), color: o.color || '#F5B8C4', grav: 8, sway: rnd(0.8, 1.8), swayA: rnd(14, 30), petal: true, spin: rnd(1, 3) });
            break;
          case 'rain': // gentle rain — thin streaks, never a storm's anger
            Object.assign(p, { vx: rnd(-24, -12), vy: rnd(360, 460), life: rnd(0.9, 1.4), size: rnd(7, 12), color: o.color || '#BFD4DC', grav: 0, line: true });
            break;
        }
        this.list.push(p);
      },
      burst(x, y, color, n) {
        for (let i = 0; i < (n || 18); i++) {
          this.spawn('burst', x, y, { a: (i / (n || 18)) * Math.PI * 2 + rnd(-0.2, 0.2), sp: rnd(40, 150), color });
        }
      },
      update(dt) {
        for (let i = this.list.length - 1; i >= 0; i--) {
          const p = this.list[i];
          p.age += dt;
          if (p.age >= p.life) { this.list.splice(i, 1); continue; }
          p.vy += (p.grav || 0) * dt;
          p.x += p.vx * dt + (p.sway ? Math.sin(p.age * p.sway * 2) * p.swayA * dt : 0);
          p.y += p.vy * dt;
        }
      },
      draw(ctx) {
        for (const p of this.list) {
          const k = 1 - p.age / p.life;
          if (p.ring) {
            ctx.strokeStyle = alpha(p.color, 0.6 * k);
            ctx.lineWidth = 2.4 * k + 0.6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size + (1 - k) * 46, 0, Math.PI * 2);
            ctx.stroke();
            continue;
          }
          ctx.globalAlpha = Math.min(1, k * 1.6) * (p.alpha == null ? 0.9 : p.alpha);
          if (p.soft) {
            const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
            glow.addColorStop(0, p.color); glow.addColorStop(1, alpha(p.color, 0));
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
            continue;
          }
          if (p.line) {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1.2; ctx.lineCap = 'round';
            ctx.globalAlpha = Math.min(1, k * 1.6) * 0.45;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
            ctx.stroke();
            ctx.globalAlpha = 1;
            continue;
          }
          if (p.petal) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.age * p.spin);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            ctx.globalAlpha = 1;
            continue;
          }
          if (p.star) {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1.3; ctx.lineCap = 'round';
            const s = p.size * (0.5 + k * 0.5);
            ctx.beginPath();
            ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x + s, p.y);
            ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x, p.y + s);
            ctx.stroke();
          } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.type === 'dust' ? 0.6 + (1 - k) * 0.7 : k), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
      }
    };
  }
  GOL.makeFx = makeFx;

  // ------------------------------------------------------------ creatures --
  function updateCreatures(level, pl, dt, t) {
    for (const c of level.creatures) {
      c.t = (c.t || 0) + dt;
      if (c.type === 'bird') {
        if (!c.fleeing && Math.abs(pl.x - c.x) < 86 && Math.abs(pl.y - c.y) < 70) {
          c.fleeing = true; c.fleeT = 0;
          c.fleeDir = pl.x < c.x ? 1 : -1;
          if (GOL.audio) GOL.audio.sfx('flutter');
        }
        if (c.fleeing) {
          c.fleeT += dt;
          c.x += c.fleeDir * 150 * dt;
          c.y -= (200 - c.fleeT * 120) * dt;
          c.facing = c.fleeDir;
          if (c.fleeT > 2.6) { // settle back home a while later
            c.fleeing = false;
            c.x = c.homeX; c.y = c.homeY;
          }
        } else {
          c.pecking = Math.sin(c.t * 0.7 + c.phase) > 0.3;
          c.facing = Math.sin(c.t * 0.23 + c.phase) > 0 ? 1 : -1;
        }
      } else if (c.type === 'butterfly') {
        c.x = c.homeX + Math.sin(c.t * 0.6 + c.phase) * 46 + Math.sin(c.t * 1.7 + c.phase * 2) * 12;
        c.y = c.homeY + Math.sin(c.t * 0.9 + c.phase * 1.3) * 26 - Math.abs(Math.sin(c.t * 2.3)) * 8;
      } else if (c.type === 'tortoise') {
        c.x += c.dir * 12 * dt;
        if (c.x > c.homeX + c.range) c.dir = -1;
        if (c.x < c.homeX - c.range) c.dir = 1;
      } else if (c.type === 'chargers') {
        if (c.sweep == null && c.rest == null) {
          c.sweep = 0;
          c.count = 3 + (c.phase > 3.5 ? 1 : 0);
        } else if (c.sweep != null) {
          c.sweep += dt / 8;
          if (c.sweep >= 1) { c.sweep = null; c.rest = rnd(15, 25); }
        } else {
          c.rest -= dt;
          if (c.rest <= 0) { c.rest = null; c.sweep = 0; }
        }
      }
    }
  }
  GOL.updateCreatures = updateCreatures;

  // --------------------------------------------------------------- saving --
  const KEY = 'gemsOfLight.v3';
  GOL.store = {
    data: null,
    load() {
      try { this.data = JSON.parse(localStorage.getItem(KEY)) || {}; }
      catch (e) { this.data = {}; }
      this.data.levels = this.data.levels || {};
      this.data.settings = this.data.settings || { muted: false };
      if (this.data.unlocked == null) this.data.unlocked = 0;
      this.data.opened = this.data.opened || []; // parent-opened level indices
      return this.data;
    },
    // a level is playable if reached in sequence or opened by a parent
    isOpen(i) {
      return i <= this.data.unlocked || this.data.opened.includes(i);
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* private mode: play on */ }
    },
    level(id) {
      const L = this.data.levels;
      if (!L[id]) L[id] = { completed: false, replays: 0, sortAttempts: 0, hintsUsed: 0, misorders: {}, heardFull: 0 };
      const st = L[id];
      if (st.seeds == null) st.seeds = 0;          // best noor-seed gathering
      if (st.blossom == null) st.blossom = false;  // hidden Rahma blossom found
      if (st.lastPlayed == null) st.lastPlayed = 0;
      if (st.echoes == null) st.echoes = 0;        // "say it out loud" moments completed
      if (st.starWalks == null) st.starWalks = 0;  // in-order recall walks completed
      if (st.trialAsked == null) st.trialAsked = 0;    // moon trial questions asked
      if (st.trialFirstTry == null) st.trialFirstTry = 0; // answered right first listen
      if (st.moon == null) st.moon = 0;            // the moon a child has seen (never wanes)
      if (st.meanings == null) st.meanings = 0;    // meaning-match completions
      if (st.storyRead == null) st.storyRead = 0;  // surah story pages read to the end
      return st;
    },
    reset() { this.data = { levels: {}, settings: { muted: false }, unlocked: 0, opened: [] }; this.save(); }
  };

  // Quiet engagement stamps — which modes get played, and when. Local only;
  // surfaces on the grown-ups page (and helps pilot-testing with older kids).
  GOL.stamp = function (kind) {
    const d = GOL.store.data;
    d.stats = d.stats || {};
    const arr = (d.stats[kind] = d.stats[kind] || []);
    arr.push(Date.now());
    if (arr.length > 200) arr.splice(0, arr.length - 200);
    GOL.store.save();
  };
  GOL.stampCount = function (kind, sinceMs) {
    const d = GOL.store.data;
    const arr = (d.stats && d.stats[kind]) || [];
    if (sinceMs == null) return arr.length;
    const cut = Date.now() - sinceMs;
    return arr.filter((t) => t >= cut).length;
  };
})();
