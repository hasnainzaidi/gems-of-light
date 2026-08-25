#!/usr/bin/env node
// The journey-map SVG is generated as flat paint. Verify that every island's
// top-level orchard trees are discoverable and that map.js normalizes their
// painter's order from back (small ground Y) to front (large ground Y).
import assert from 'node:assert/strict';
import fs from 'node:fs';

const mapSource = fs.readFileSync(new URL('../js/map.js', import.meta.url), 'utf8');
const svg = fs.readFileSync(new URL('../map-artist-pack/journey-map.svg', import.meta.url), 'utf8');

assert.match(mapSource, /function normalizeMapTreeDepth\(root, hearts\)/,
  'map loader must define the global island tree-depth normalization');
assert.match(mapSource, /sort\(\(a, b\) => a\.y - b\.y \|\| a\.x - b\.x\)/,
  'tree depth must be deterministic: ground Y first, X as the tie-breaker');
assert.match(mapSource, /normalizeMapTreeDepth\(root, hearts\);[\s\S]{0,120}const base = root\.cloneNode/,
  'tree order must be repaired before the base layer is rasterized');

// The shipped SVG has no tree ids. Mirror the runtime's intentionally narrow
// signature: a top-level group with a trunk rect, circular canopy, and ground
// ellipse. Nested decoration groups are excluded by this top-level scan.
const groups = [...svg.matchAll(/<g([^>]*)>(.*?)<\/g>/gs)];
const trees = groups.flatMap(([, attributes, body]) => {
  const circles = [...body.matchAll(/<circle\b[^>]*>/g)];
  const ground = body.match(/<ellipse\b[^>]*cx="([0-9.]+)"[^>]*cy="([0-9.]+)"/);
  if (/\b(?:id|transform)=/.test(attributes) || !/<rect\b/.test(body) || circles.length < 3 || !ground) return [];
  return [{ x: Number(ground[1]), y: Number(ground[2]) }];
});

const hearts = [
  { x: 661.5, y: 828.5 },
  { x: 1099.2, y: 698.9 },
  { x: 1697.8, y: 418.3 },
  { x: 2132.8, y: 289.6 }
];
const islands = hearts.map(() => []);
for (const tree of trees) {
  let nearest = 0;
  for (let i = 1; i < hearts.length; i++) {
    const here = (tree.x - hearts[i].x) ** 2 + (tree.y - hearts[i].y) ** 2;
    const best = (tree.x - hearts[nearest].x) ** 2 + (tree.y - hearts[nearest].y) ** 2;
    if (here < best) nearest = i;
  }
  islands[nearest].push(tree);
}

assert.deepEqual(islands.map((row) => row.length), [7, 7, 6, 6],
  'all 26 shipped orchard trees must be covered across all four islands');
assert(islands[0].some((tree, i, row) => i && tree.y < row[i - 1].y),
  'fixture must retain the confirmed island-one depth inversion');
assert(islands[2].some((tree, i, row) => i && tree.y < row[i - 1].y),
  'fixture must retain the confirmed island-three depth inversion');

for (const [index, row] of islands.entries()) {
  const sorted = row.slice().sort((a, b) => a.y - b.y || a.x - b.x);
  for (let i = 1; i < sorted.length; i++) {
    assert(sorted[i - 1].y <= sorted[i].y,
      `island ${index + 1} trees must paint back-to-front by grounded Y`);
  }
}

console.log('✓ all four map islands normalize orchard trees back-to-front');
