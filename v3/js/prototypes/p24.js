// Quraysh learning-loop lab · P24 — the feast of the house (STUB — room build pending)
// Spec: v3/QURAYSH-PROTOTYPE-ROOMS.md · shared plumbing: quraysh-rooms.js
// Direct: ?lab=24
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
      GOL.text(ctx, 'the feast of the house — coming soon', W / 2, H * 0.58, { size: 18, weight: '800', color: '#F5EDD4' });
    }
  };
  GOL.PROTOTYPES[24] = { key: 'feast-house', name: 'the feast of the house', scene: 'feastHouseLab' };
  GOL.registerScene('feastHouseLab', lab);
})();
