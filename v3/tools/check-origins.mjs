// Third-party-origin gate — run from the repo root:
//   node v3/tools/check-origins.mjs
// The App Store Kids rules (and plain good sense for a children's app)
// forbid the game reaching any third-party origin at load. This asserts the
// HTML entry points (root index.html and /v3/index.html) load NO external
// resource: every <link>/<script> href/src must be same-origin/relative, and
// no preconnect/dns-prefetch to another host may remain. Fonts are bundled in
// fonts/, so the old Google-Fonts CDN links must never come back. Runtime
// audio streaming (everyayah.com) is a separate, code-gated concern —
// GOL.OFFLINE_ONLY disables it in the native build (see APP-STORE-PLAN.md).
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ENTRIES = ['index.html', 'v3/index.html'];

let failures = 0;
for (const rel of ENTRIES) {
  const html = readFileSync(join(ROOT, rel), 'utf8');
  const offenders = [];

  // any <link>/<script> whose href/src points at an absolute http(s) URL
  const tagRe = /<(link|script)\b[^>]*\b(?:href|src)\s*=\s*["'](https?:\/\/[^"']+)["'][^>]*>/gi;
  let m;
  while ((m = tagRe.exec(html))) offenders.push(`<${m[1]}> loads ${m[2]}`);

  // preconnect / dns-prefetch to another host (network hint = third party)
  const hintRe = /<link\b[^>]*\brel\s*=\s*["'](?:preconnect|dns-prefetch)["'][^>]*>/gi;
  while ((m = hintRe.exec(html))) offenders.push(`network hint: ${m[0].trim()}`);

  // @import url(http...) inside inline <style>
  const importRe = /@import\s+(?:url\()?["']?(https?:\/\/[^"')]+)/gi;
  while ((m = importRe.exec(html))) offenders.push(`@import ${m[1]}`);

  if (offenders.length) {
    failures++;
    console.log(`✗ ${rel} — reaches a third-party origin at load:`);
    offenders.forEach((o) => console.log('   - ' + o));
  } else {
    console.log(`✓ ${rel} — no third-party origin at load`);
  }
}

process.exit(failures ? 1 : 0);
