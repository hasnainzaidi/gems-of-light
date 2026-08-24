// World Twenty — At-Tin · The Fig and the Olive
// The surah opens like a little journey — a fig, an olive, Mount Sinai, the
// safe city — then says its heart: every person is made in the finest shape,
// and the reward of faith and good deeds never runs out. The world walks that
// same journey wordlessly: an orchard of figs and olives, a first stone rise,
// the safe city warm on the far horizon (its little windows kindle as the
// ayat are gathered), the orchard's high crown, one soft sheltered hollow
// with a spring (never a punishment — a dip the path simply rises out of),
// a mound of blossoming abundance, and at last the small holy mount, climbed
// in easy stone steps to a summit where the campfire and the shrine door
// wait in the late golden light (the palette drifts warm as gems are found).
(function () {
  const GOL = window.GOL;
  const TILE = GOL.TILE;

  GOL.registerWorld(20, {
    id: 30, key: 'tin', name: 'the fig and the olive',
    surahId: 95,
    palette: 'tin', endPalette: 'tinEnd', // orchard light → honeyed mount-light
    w: 92, h: 16,
    density: 0.14,

    // ── The safe city (ayah 3) ─────────────────────────────────────────────
    // A SMALL walled skyline high in the sky band over the third beat: two
    // domed houses, a slender minaret, a low wall — hazed far-grey like the
    // distant hills and seated into their own small horizon shoulder, safely
    // behind the walkable ground. Its tiny golden windows kindle with `prog`:
    // the city rests safe and lit as the ayat are gathered.
    drawLandmark(ctx, t, P, L, prog) {
      const C = GOL.color;
      const cx = 31.5 * TILE;        // over the city beat, mid-sky
      const baseY = 7.9 * TILE;      // foot of the distant skyline
      const haze = C.shade(P.hillFar, 0.12);
      const edge = C.shade(haze, 0.12);
      ctx.save();

      // A distinct far-hill shoulder keeps the city attached to its horizon.
      // It is wider than the wall and fades at its lower edge, so it reads as
      // atmospheric distance rather than another traversable terrace.
      const shoulderY = 9.35 * TILE;
      ctx.fillStyle = C.alpha(C.shade(P.hillFar, 0.05), 0.52);
      ctx.beginPath();
      ctx.moveTo(cx - 2.35 * TILE, shoulderY);
      ctx.quadraticCurveTo(cx - 1.75 * TILE, 8.42 * TILE, cx - 1.45 * TILE, baseY);
      ctx.lineTo(cx + 1.45 * TILE, baseY);
      ctx.quadraticCurveTo(cx + 1.8 * TILE, 8.4 * TILE, cx + 2.4 * TILE, shoulderY);
      ctx.closePath();
      ctx.fill();

      // the low wall, one soft run with a gate dip at its center
      ctx.fillStyle = C.alpha(haze, 0.78);
      ctx.strokeStyle = C.alpha(edge, 0.46);
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(cx - 1.5 * TILE, baseY);
      ctx.lineTo(cx - 1.5 * TILE, baseY - 0.32 * TILE);
      ctx.lineTo(cx - 0.34 * TILE, baseY - 0.32 * TILE);
      ctx.quadraticCurveTo(cx, baseY - 0.56 * TILE, cx + 0.34 * TILE, baseY - 0.32 * TILE);
      ctx.lineTo(cx + 1.5 * TILE, baseY - 0.32 * TILE);
      ctx.lineTo(cx + 1.5 * TILE, baseY);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // two domed houses rising behind the wall
      const dome = (dx, r) => {
        ctx.beginPath();
        ctx.moveTo(cx + dx - r, baseY - 0.26 * TILE);
        ctx.arc(cx + dx, baseY - 0.26 * TILE, r, Math.PI, 0);
        ctx.closePath(); ctx.fill();
      };
      ctx.fillStyle = C.alpha(haze, 0.82);
      dome(-0.85 * TILE, 0.4 * TILE);
      dome(0.6 * TILE, 0.5 * TILE);
      // a slender minaret with its own small cap
      ctx.fillStyle = C.alpha(haze, 0.88);
      ctx.fillRect(cx - 0.09 * TILE, baseY - 0.95 * TILE, 0.18 * TILE, 0.7 * TILE);
      ctx.beginPath();
      ctx.moveTo(cx - 0.15 * TILE, baseY - 0.95 * TILE);
      ctx.arc(cx, baseY - 0.95 * TILE, 0.15 * TILE, Math.PI, 0);
      ctx.closePath(); ctx.fill();
      // the windows kindle as the ayat are gathered — the city safe and lit
      if (prog > 0.02) {
        ctx.fillStyle = C.alpha('#FFE9A8', 0.34 + 0.56 * prog);
        for (const [wx, wy] of [[-0.95, 0.4], [-0.72, 0.4], [0.48, 0.48], [0.74, 0.48], [0, 0.72]]) {
          ctx.beginPath();
          ctx.arc(cx + wx * TILE, baseY - wy * TILE, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // A faint lower-edge wash seats the shoulder without veiling the city.
      const mist = ctx.createLinearGradient(0, baseY, 0, shoulderY);
      mist.addColorStop(0, C.alpha(P.mist, 0));
      mist.addColorStop(1, C.alpha(P.mist, 0.28));
      ctx.fillStyle = mist;
      ctx.fillRect(cx - 2.4 * TILE, baseY, 4.8 * TILE, shoulderY - baseY);
      ctx.restore();
    },

    build(b) {
      b.ground(0, 91, 13);
      b.start(3);
      b.seedRun(4, 8, 2);

      // ── BEAT 1 · THE FIG AND THE OLIVE (ayah 1) ──────────────────────────
      // The orchard gate: a fig and an olive frame the path, the first gem
      // resting over a low flowered mound between them.
      b.prop('fig', 7);
      b.block(10, 13, 12, 12);
      b.gem(1, 11, 10);
      b.prop('flowers', 9, { v: 0 });
      b.prop('olive', 15, { v: 1 });
      b.creature('bird', 8);
      b.seed(10, 11).seed(12, 10);
      b.seedRun(14, 17, 2);

      // ── BEAT 2 · THE FIRST STONE RISE (ayah 2) ───────────────────────────
      // Mount Sinai's quiet nod: two carved-stone terrace steps, the first
      // stone underfoot on the way to the holy mount at the journey's end.
      b.stoneBlock(20, 22, 12, 12);
      b.stoneBlock(23, 26, 10, 12);
      b.gem(2, 25, 8);
      b.prop('cypress', 19);
      b.seed(19, 12).seed(21, 11).seed(23, 9).seed(25, 7);

      // ── BEAT 3 · THE SAFE CITY (ayah 3) ──────────────────────────────────
      // Down onto the garden road: a low wall and a lantern — the city's
      // language in miniature — while the skyline itself rests far overhead,
      // its windows kindling gem by gem.
      b.prop('wall', 29, { n: 3 });
      b.gem(3, 32, 11);
      b.prop('lantern', 34);
      b.creature('tortoise', 31, null, { range: 40 });
      b.seedRun(27, 33, 2);

      // ── BEAT 4 · THE FINEST SHAPE (ayah 4) ───────────────────────────────
      // The orchard's crown: the garden's own highest terrace, fruit on the
      // bough, the fourth gem at the top of the rise.
      b.block(38, 41, 11, 12);
      b.block(42, 46, 9, 12);
      b.prop('fig', 39, { v: 1 });
      b.prop('flowers', 43, { v: 1 });
      b.prop('fruit', 45, { v: 0 });
      b.gem(4, 44, 7);
      b.seed(38, 10).seed(40, 10).seed(42, 8).seed(44, 6);

      // ── BEAT 5 · THE SOFT HOLLOW (ayah 5) ────────────────────────────────
      // The path dips — one gentle row — into a sheltered dell with a spring
      // pool, crossed on a single stepping stone. Never a punishment: shade,
      // still water, and the way simply rises out the other side.
      b.carve(50, 56, 13, 13);
      b.water(52, 54, 14);
      b.stone(53, 14);
      b.gem(5, 53, 12);
      b.prop('bush', 50, { v: 1 });
      b.prop('fig', 57);
      b.seedArc(49, 12, 57, 12, 6, 0.8);

      // ── THE SECRET · past the hollow ─────────────────────────────────────
      // A bounce blossom on the open flat; the hidden Rahma blossom straight
      // above it in clear sky — the reward that never runs out, tucked right
      // beside the ayah that promises it.
      b.bounce(59);
      b.blossom(59, 7);
      b.seed(59, 11);

      // ── BEAT 6 · THE UNENDING REWARD (ayah 6) ────────────────────────────
      // A mound in full blossom — flowers on every side, an olive beyond it,
      // the sixth gem over the crest of the abundance.
      b.prop('bush', 61, { v: 2 });
      b.prop('flowers', 62, { v: 2 });
      b.block(63, 66, 12, 12);
      b.gem(6, 64, 10);
      b.prop('flowers', 67, { v: 0 });
      b.prop('olive', 68, { v: 2 });
      b.creature('bird', 65);
      b.seedRun(61, 67, 2);

      // ── BEAT 7 · THE MOUNT'S FOOT (ayah 7) ───────────────────────────────
      // The holy mount begins: carved stone steps out of the orchard, the
      // seventh gem on the first shoulder.
      b.prop('cypress', 70);
      b.stoneBlock(71, 74, 11, 12);
      b.stoneBlock(75, 78, 9, 12);
      b.gem(7, 73, 9);
      b.seed(70, 12).seed(72, 10).seed(76, 8);

      // ── BEAT 8 + SUMMIT · THE MOST JUST OF JUDGES (ayah 8) ───────────────
      // The broad summit cap under open sky: the last gem on the first rise,
      // then the earned campfire and the shrine door in the gold of the
      // drifted palette. Nothing floats above either column.
      b.stoneBlock(79, 91, 7, 12);
      b.gem(8, 81, 5);
      b.campfire(84);
      b.prop('flowers', 86, { v: 1 });
      b.door(89);
      b.seed(80, 6).seed(82, 5);
      b.seedRun(85, 88, 2);

      // ambient life through the orchard
      b.creature('butterfly', 17, 8).creature('butterfly', 47, 6)
       .creature('butterfly', 63, 8).creature('butterfly', 83, 3);
    }
  });
})();
