#!/usr/bin/env node
// Root and /v3/ are two doorways into the same game. Cache-busting versions
// must stay identical or a warm /v3/ cache can silently run an older build.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const v3Dir = path.resolve(here, '..');
const repoDir = path.resolve(v3Dir, '..');

function scripts(file) {
  const html = fs.readFileSync(file, 'utf8');
  const found = new Map();
  for (const match of html.matchAll(/<script\s+[^>]*src="([^"]+)"/g)) {
    const url = new URL(match[1], 'https://playgemsoflight.test/');
    const key = url.pathname.replace(/^\/(?:v3\/)?/, '').replace(/^\.\.\//, '');
    found.set(key, url.searchParams.get('v'));
  }
  return found;
}

const root = scripts(path.join(repoDir, 'index.html'));
const nested = scripts(path.join(v3Dir, 'index.html'));
const errors = [];

for (const key of new Set([...root.keys(), ...nested.keys()])) {
  if (!root.has(key)) errors.push(`${key}: missing from root index.html`);
  else if (!nested.has(key)) errors.push(`${key}: missing from v3/index.html`);
  else if (root.get(key) !== nested.get(key)) {
    errors.push(`${key}: root v=${root.get(key)} but /v3/ v=${nested.get(key)}`);
  }
}

if (errors.length) {
  console.error('Entry-point cache versions differ:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`✓ root and /v3/ load the same ${root.size}-script build`);
