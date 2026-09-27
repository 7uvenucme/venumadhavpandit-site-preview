import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// Fail the build before Pages deploys if an editor save clears displayed content.
// The existing gh-pages publication remains online on a failed build.
const errors = [];
const read = file => matter(fs.readFileSync(file, 'utf8'));
const nonBlank = (value, at) => {
  if (typeof value !== 'string' || !value.trim()) errors.push(`${at} is blank`);
};
const list = (value, at, fields) => {
  if (!Array.isArray(value) || !value.length) { errors.push(`${at} has no rows`); return; }
  value.forEach((row, i) => fields.forEach(f => nonBlank(row?.[f], `${at}[${i + 1}].${f}`)));
};
const pages = 'src/content/pages';
for (const file of fs.readdirSync(pages).filter(f => f.endsWith('.md'))) {
  const { data, content } = read(path.join(pages, file));
  const at = `${pages}/${file}`;
  for (const f of ['title', 'description']) nonBlank(data[f], `${at}:${f}`);
  if (['about.md','contact.md','builds-index.md','mfan-2026.md'].includes(file)) {
    for (const f of ['eyebrow','pageTitle','lede']) nonBlank(data[f], `${at}:${f}`);
  }
  if (['about.md','mfan-terms.md','mfan-privacy.md'].includes(file)) nonBlank(content, `${at}:body`);
  if (file === 'about.md') {
    for (const f of ['figureImage','figureAlt','figureCaption','experienceHeading','educationHeading']) nonBlank(data[f], `${at}:${f}`);
    list(data.experience, `${at}:experience`, ['years','org','role']);
    list(data.education, `${at}:education`, ['years','org','role']);
  }
  if (file === 'contact.md') for (const f of ['email','linkedinUrl','linkedinLabel']) nonBlank(data[f], `${at}:${f}`);
  if (file === 'mfan-2026.md') {
    for (const f of ['storyLinkLabel','releasesHeading','termsHeading','privacyHeading']) nonBlank(data[f], `${at}:${f}`);
    list(data.releases, `${at}:releases`, ['heading','body']);
  }
  if (file === 'home.md') {
    for (const f of ['heroEyebrow','heroTitle','heroIntro','heroButtonLabel','heroImage','heroImageAlt','heroImageCaption','sectionEyebrow','sectionTitle','sectionLinkLabel','artworkTitle','readingTitle','bookTitle','bookCover','bookCoverAlt','bookQuote','hobbiesTitle','playlistTitle','playlistUrl','toolsTitle']) nonBlank(data[f], `${at}:${f}`);
    list(data.artworks, `${at}:artworks`, ['image','alt']);
    list(data.hobbies, `${at}:hobbies`, ['name','detail','icon']);
    list(data.tools, `${at}:tools`, ['category','tool']);
    try { if (!/^\/playlist\/[A-Za-z0-9]+$/.test(new URL(data.playlistUrl).pathname)) errors.push(`${at}:playlistUrl must be a Spotify playlist`); }
    catch { errors.push(`${at}:playlistUrl is not a valid URL`); }
  }
}
const builds = 'src/content/builds';
for (const file of fs.readdirSync(builds).filter(f => f.endsWith('.md'))) {
  const { data, content } = read(path.join(builds, file));
  for (const f of ['title','eyebrow','summary']) nonBlank(data[f], `${builds}/${file}:${f}`);
  nonBlank(content, `${builds}/${file}:body`);
}
if (errors.length) { console.error('Site content validation failed:\n' + errors.map(x => `- ${x}`).join('\n')); process.exit(1); }
console.log('Site content validation passed.');
