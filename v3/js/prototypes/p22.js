// Quraysh learning-loop lab · P22 — the hungry little camel (STUB — room build pending)
// Spec: v3/QURAYSH-PROTOTYPE-ROOMS.md · shared plumbing: quraysh-rooms.js
// Direct: ?lab=22
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
      GOL.text(ctx, 'the hungry little camel — coming soon', W / 2, H * 0.58, { size: 18, weight: '800', color: '#F5EDD4' });
    }
  };
  GOL.PROTOTYPES[22] = { key: 'hungry-camel', name: 'the hungry little camel', scene: 'hungryCamelLab' };
  GOL.registerScene('hungryCamelLab', lab);
})();
