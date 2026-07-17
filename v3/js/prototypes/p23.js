// Quraysh learning-loop lab · P23 — the night watch (STUB — room build pending)
// Spec: v3/QURAYSH-PROTOTYPE-ROOMS.md · shared plumbing: quraysh-rooms.js
// Direct: ?lab=23
(function () {
  const GOL = window.GOL;
  const lab = {
    enter() { this.t = 0; },
    update(dt) {
      this.t += dt;
      for (const tap of GOL.Input.taps) { tap.ui = true; GOL.go('title'); }
    },
    draw(ctx, W, H) {
      ctx.fillStyle = '#2E4032';
      ctx.fillRect(0, 0, W, H);
      GOL.star8(ctx, W / 2, H * 0.4, 22, this.t / 3, 'rgba(240,200,120,0.85)');
      GOL.text(ctx, 'the night watch — coming soon', W / 2, H * 0.58, { size: 18, weight: '800', color: '#F5EDD4' });
    }
  };
  GOL.PROTOTYPES[23] = { key: 'night-watch', name: 'the night watch', scene: 'nightWatchLab' };
  GOL.registerScene('nightWatchLab', lab);
})();
