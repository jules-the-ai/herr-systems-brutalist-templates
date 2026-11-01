import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const profiles = JSON.parse(readFileSync(resolve(root, 'src/data/staff.json'), 'utf8'));
let shell = readFileSync(resolve(root, 'public/about/index.html'), 'utf8');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const seen = new Set();
for (const profile of profiles) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profile.slug)) throw new Error('Invalid profile slug');
  if (seen.has(profile.slug)) throw new Error('Duplicate profile slug');
  seen.add(profile.slug);
  if (!/^headshot-[1-3]\.svg$/.test(profile.portrait)) throw new Error('Invalid demo portrait');
  if (!profile.service.startsWith('/services/')) throw new Error('Profile service must be a local service URL');
}
const cards = profiles.map(profile => `<article data-interactive-card class="staff-card"><div class="staff-photo"><img src="/assets/about/${escape(profile.portrait)}" alt="Illustrated demo portrait of ${escape(profile.name)}" width="480" height="560" loading="lazy"><span class="staff-photo-label">DEMO PROFILE</span></div><div class="staff-info"><p class="detail-label">${escape(profile.role)}</p><h3>${escape(profile.name)}</h3><p>${escape(profile.short)}</p><p class="staff-specialty">${escape(profile.specialty)}</p><a data-card-link class="staff-link" href="/about/team/${escape(profile.slug)}/">View profile →</a></div></article>`).join('');
const updatedShell = shell.replace(/<div class="staff-grid">[\s\S]*?<\/section>/, `<div class="staff-grid">${cards}</div></section>`);
if (updatedShell === shell && !shell.includes(cards)) throw new Error('Staff card insertion point not found');
if (updatedShell !== shell) writeFileSync(resolve(root, 'public/about/index.html'), updatedShell);
shell = updatedShell;
for (const profile of profiles) {
  const p = Object.fromEntries(Object.entries(profile).map(([key, value]) => [key, typeof value === 'string' ? escape(value) : value]));
  let head = shell.slice(0, shell.indexOf('<div class="billboard-stage'));
  head = head.replace('<title>About // Herr Systems</title>', `<title>${p.name} — ${p.role} // Herr Systems</title>`)
    .replace('Meet the people and principles behind Herr Systems: thoughtful design, dependable development, and useful technology.', `Demo staff profile for ${p.name}: ${p.role}. Explore their bio, skills, and approach.`)
    .replace('service-detail-page about-page', 'service-detail-page staff-profile-page')
    .replace('/about.css?v=about-1', '/staff-profile.css?v=staff-header-2')
    .replaceAll(' aria-current="page"', '');
  const footer = shell.slice(shell.indexOf('</main>')).replaceAll(' aria-current="page"', '');
  const paragraphs = profile.about.map(text => `<p>${escape(text)}</p>`).join('');
  const skills = profile.skills.map(text => `<li>${escape(text)}</li>`).join('');
  const steps = profile.approach.map(([title,text], index) => `<li><span aria-hidden="true">0${index + 1}</span><div><h3>${escape(title)}</h3><p>${escape(text)}</p></div></li>`).join('');
  const examples = profile.contributions.map(([title,text]) => `<div><h3>${escape(title)}</h3><p>${escape(text)}</p></div>`).join('');
  const otherProfiles = profiles.filter(other => other.slug !== profile.slug).map(other => `<a href="/about/team/${escape(other.slug)}/"><span>${escape(other.name)}</span><small>${escape(other.role)}</small><b aria-hidden="true">→</b></a>`).join('');
  const hero = `<div class="billboard-stage services-directory"><section class="directory-intro profile-billboard" aria-labelledby="profile-name"><div class="profile-hero-copy"><nav class="detail-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/about/">About</a><span aria-hidden="true">/</span><span aria-current="page">${p.name}</span></nav><h1 id="profile-name">${p.name}</h1><p class="profile-role">${p.role}</p><div class="profile-hero-actions"><a class="button" href="/contact/">Talk with our team <b aria-hidden="true">»</b></a><a href="#profile-skills">Explore skills ↓</a></div></div><figure class="profile-portrait"><img src="/assets/about/${p.portrait}" alt="Illustrated demo portrait of ${p.name}, not a photograph of a real team member" width="480" height="560"><figcaption>${p.specialty}</figcaption></figure></section></div>`;
  const main = `<div class="site-shell"><main id="main" class="profile-main"><div class="profile-layout"><div class="profile-story"><section class="profile-section" id="profile-about" aria-labelledby="profile-about-title"><p class="profile-label">ABOUT ${p.name.split(' ')[0].toUpperCase()}</p><h2 id="profile-about-title">A little about ${p.name.split(' ')[0]}.</h2><p class="profile-intro">${p.intro}</p>${paragraphs}</section><section class="profile-section" aria-labelledby="profile-approach-title"><h2 id="profile-approach-title">How I work</h2><ol class="profile-approach">${steps}</ol></section><section class="profile-section" aria-labelledby="profile-contributions-title"><h2 id="profile-contributions-title">What I bring to a project</h2><p class="profile-section-note">Illustrative responsibilities for this demo role—not completed client work.</p><div class="profile-contributions">${examples}</div><a class="profile-text-link" href="${p.service}">${p.serviceLabel} →</a></section><section class="profile-section profile-interests" aria-labelledby="profile-interests-title"><h2 id="profile-interests-title">Beyond the brief</h2><p>${p.interests}</p></section></div><aside class="profile-sidebar" aria-label="Skills and role details"><section class="profile-skill-panel" id="profile-skills" aria-labelledby="profile-skills-title"><p class="profile-label">THE TOOLKIT</p><h2 id="profile-skills-title">Skills &amp; strengths</h2><ul class="profile-skills">${skills}</ul></section><section class="profile-facts" aria-labelledby="profile-facts-title"><h2 id="profile-facts-title">At a glance</h2><dl><dt>Focus</dt><dd>${p.focus}</dd><dt>Works with</dt><dd>${p.collaboration}</dd><dt>A useful handoff</dt><dd>${p.handoff}</dd></dl></section><p class="profile-sidebar-note">This page demonstrates the profile layout. Names, biographies, role details, and portraits are sample content.</p></aside></div><section class="profile-connect" aria-labelledby="profile-connect-title"><div><h2 id="profile-connect-title">Good projects start with a conversation.</h2><p>Tell us what you’re trying to make easier. We’ll work out the scope and who can help.</p></div><a class="button" href="/contact/">Start a conversation <b aria-hidden="true">»</b></a></section><nav class="profile-other-people" aria-labelledby="profile-others-title"><div class="profile-others-heading"><h2 id="profile-others-title">Meet the rest of the demo team</h2><a href="/about/#team">Back to the team →</a></div><div>${otherProfiles}</div></nav>`;
  const destination = resolve(root, `public/about/team/${profile.slug}`); mkdirSync(destination, { recursive: true });
  writeFileSync(resolve(destination, 'index.html'), head + hero + main + footer);
}
console.log(`Generated ${profiles.length} staff profiles from src/data/staff.json using the current About shell.`);
