// Viewport lifecycle contract. iOS may change visualViewport without updating
// window.innerHeight or delivering a final resize event; the canvas must use
// the visible viewport and self-heal during the render loop.
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const V3 = join(dirname(fileURLToPath(import.meta.url)), '..');
const boot = readFileSync(join(V3, 'js', 'boot.js'), 'utf8');
const failures = [];

if (!/function viewportSize\(\)[\s\S]{0,500}visualViewport[\s\S]{0,500}vv\.height/.test(boot)) {
  failures.push('canvas sizing does not prefer the visible visualViewport');
}
if (!/function frame\(now\)[\s\S]{0,320}syncViewport\(\)/.test(boot)) {
  failures.push('render loop does not repair a missed viewport resize');
}
if (!/visibilitychange[\s\S]{0,220}resize\(\)[\s\S]{0,220}restartFrameLoop/.test(boot)) {
  failures.push('foreground resume does not refresh the canvas before restarting');
}
if (!/pageshow['"], resize\)/.test(boot)) {
  failures.push('page-cache restore does not refresh the canvas');
}

if (failures.length) {
  console.log('\u2717 viewport lifecycle contract');
  failures.forEach((failure) => console.log('   - ' + failure));
  process.exit(1);
}

console.log('\u2713 canvas follows and rechecks the visible iOS viewport');
