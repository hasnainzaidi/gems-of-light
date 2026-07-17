// Render-loop lifecycle contract. A suspended installed PWA may retain its
// pending animation frame while timers resume; every restart must replace the
// owned request, never add another self-scheduling chain beside it.
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const V3 = join(dirname(fileURLToPath(import.meta.url)), '..');
const boot = readFileSync(join(V3, 'js', 'boot.js'), 'utf8');
const failures = [];

if (!boot.includes('let frameRequest = null;')) failures.push('render loop does not own its pending rAF request');
if (!boot.includes('if (epoch !== frameEpoch) return;')) failures.push('late canceled callbacks are not made inert');
if (!boot.includes('cancelAnimationFrame(frameRequest)')) failures.push('restart does not cancel the surviving request');
if (!/visibilitychange[\s\S]{0,180}restartFrameLoop\(performance\.now\(\)\)/.test(boot)) {
  failures.push('foreground resume does not restart the single owned loop');
}
if (!/render loop stalled[\s\S]{0,180}restartFrameLoop\(now\)/.test(boot)) {
  failures.push('stalled-loop watchdog does not replace the owned request');
}
if (/render loop stalled[\s\S]{0,180}requestAnimationFrame\(frame\)/.test(boot)) {
  failures.push('stalled-loop watchdog can add an unowned parallel rAF chain');
}

if (failures.length) {
  console.log('\u2717 render-loop lifecycle contract');
  failures.forEach((failure) => console.log('   - ' + failure));
  process.exit(1);
}

console.log('\u2713 suspended PWA resumes with one owned render loop');
