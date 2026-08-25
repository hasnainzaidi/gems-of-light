#!/usr/bin/env node
// Regression: in-ground planters share orchard depth rather than painting on
// top merely because the flat SVG emits them after every tree.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const mapSource = fs.readFileSync(new URL('../js/map.js', import.meta.url), 'utf8');
const svg = fs.readFileSync(new URL('../map-artist-pack/journey-map.svg', import.meta.url), 'utf8');

assert.match(mapSource, /function normalizeMapPlanterDepth\(root, hearts\)/,
  'map loader must define planter-to-tree depth normalization');
assert.match(mapSource, /if \(frontTree\) frontTree\.node\.before\(planter\.node\)/,
  'a rear planter must be inserted before the first nearer tree');
assert.match(mapSource, /normalizeMapTreeDepth\(root, hearts\);\s*normalizeMapPlanterDepth\(root, hearts\);\s*\n\s*const base/,
  'planters must be placed after tree sorting and before base rasterization');

const groups = [...svg.matchAll(/<g(?:\s[^>]*)?>([\s\S]*?)<\/g>/g)].map((match, index) => ({
  index,
  body: match[1]
}));
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

const trees = groups.flatMap(({ index, body }) => {
  const rects = [...body.matchAll(/<rect\b[^>]*>/g)];
  const circles = [...body.matchAll(/<circle\b[^>]*>/g)];
  const ellipses = [...body.matchAll(/<ellipse\b[^>]*>/g)];
  if (!rects.length || circles.length < 3 || !ellipses.length) return [];
  const ground = attrs(ellipses[0][0]);
  return [{ index, x: Number(ground.cx), y: Number(ground.cy) }];
});
const planters = groups.flatMap(({ index, body }) => {
  const circles = [...body.matchAll(/<circle\b[^>]*>/g)];
  const ellipses = [...body.matchAll(/<ellipse\b[^>]*>/g)];
  const rects = [...body.matchAll(/<rect\b[^>]*>/g)];
  if (circles.length !== 5 || ellipses.length !== 8 || rects.length) return [];
  const ground = attrs(ellipses[0][0]);
  return [{ index, x: Number(ground.cx), y: Number(ground.cy) }];
});

const planter = planters.find((item) => Math.abs(item.x - 1282.1) < 0.1);
const tree = trees.find((item) => Math.abs(item.x - 1282.5) < 0.1);
assert(planter && tree, 'shipped island-two planter/tree overlap must remain covered by the fixture');
assert(planter.y < tree.y, 'the planter is behind the overlapping tree by grounded Y');
assert(planter.index > tree.index, 'fixture must retain the original flat-SVG paint inversion');

const originalTreeOrder = trees.map((item) => item.index);
const painted = [...trees, ...planters].sort((a, b) => a.index - b.index);
painted.splice(painted.indexOf(planter), 1);
painted.splice(painted.indexOf(tree), 0, planter);
assert(painted.indexOf(planter) < painted.indexOf(tree),
  'normalized planter must paint behind its overlapping front tree');
assert.deepEqual(painted.filter((item) => trees.includes(item)).map((item) => item.index), originalTreeOrder,
  'planter insertion must preserve the established tree order');

console.log('✓ island-two in-ground planter paints behind its overlapping tree');
