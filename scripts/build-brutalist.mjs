import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { renderPage } from './brutalist-shell.mjs';

// Source fragments are edited directly. Generated public HTML is never read as source.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'src/brutalist/pages');
const pages = JSON.parse(await readFile(path.join(source, 'manifest.json'), 'utf8'));
const seen = new Set();
for (const page of pages) {
  if (!/^\/[a-z0-9/-]+\/$/.test(page.route) || page.route.includes('..') || seen.has(page.route)) {
    throw new Error(`Invalid or duplicate internal route: ${page.route}`);
  }
  seen.add(page.route);
  const fragmentPath = path.resolve(source, page.fragment);
  if (!fragmentPath.startsWith(source + path.sep)) throw new Error(`Invalid fragment path: ${page.fragment}`);
  const body = await readFile(fragmentPath, 'utf8');
  if ((body.match(/<main\b/g) || []).length !== 1 || /<(?:html|head|body|script)\b/i.test(body)) {
    throw new Error(`Fragment must contain one main and no document shell/scripts: ${page.fragment}`);
  }
  if (/data-endpoint-enabled="true"|action="\/api\//i.test(body)) {
    throw new Error(`Live form endpoint found in demo fragment: ${page.fragment}`);
  }
  const destination = path.join(root, 'public', page.route.slice(1), 'index.html');
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, renderPage({
    title: page.title,
    description: page.description,
    body,
    bodyClass: page.bodyClass,
    scripts: page.scripts || [],
  }));
}
console.log(`Generated ${pages.length} brutalist internal sample pages from reusable source fragments.`);
