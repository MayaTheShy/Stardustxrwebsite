#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docsDir = path.join(__dirname, '..', 'docs');
const outFile = path.join(docsDir, 'commit-info.json');

function walk(dir) {
  const results = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) results.push(full);
  });
  return results;
}

function getCommitInfo(filePath) {
  try {
    // format: sha\nauthor name\nauthor email\ndate (iso)\nmessage
    const cmd = `git log -1 --date=iso-strict --format=%H%n%an%n%ae%n%ad%n%s -- ${JSON.stringify(filePath)}`;
    const out = execSync(cmd, { encoding: 'utf8' }).trim();
    if (!out) return null;
    const [sha, author, email, date, message] = out.split('\n');
    return { sha, author, date, message };
  } catch (e) {
    // If git isn't available or file isn't tracked, ignore
    return null;
  }
}

function build() {
  if (!fs.existsSync(docsDir)) {
    console.error('docs directory not found');
    process.exit(2);
  }
  const mdFiles = walk(docsDir);
  const map = {};
  mdFiles.forEach((f) => {
    const info = getCommitInfo(f);
    // Key use relative path with forward slashes to match fetch path
    const rel = path.relative(path.join(__dirname, '..'), f).replace(/\\/g, '/');
    if (info) map[rel] = info;
  });
  // Also add origin repo URL if present so the client can make a link to commits
  try {
    const origin = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    // convert git@ or https urls to https web urls we can link to
    let web = origin;
    if (web.startsWith('git@')) {
      // git@github.com:owner/repo.git -> https://github.com/owner/repo
      web = web.replace(':', '/').replace('git@', 'https://');
    }
    web = web.replace(/\.git$/, '');
    map['__repo__'] = web;
  } catch (e) { /* ignore */ }
  fs.writeFileSync(outFile, JSON.stringify(map, null, 2), 'utf8');
  console.log(`Wrote ${Object.keys(map).length} entries to ${outFile}`);
}

build();
