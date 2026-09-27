import { defineConfig } from 'astro/config';

// Preview remains at the GitHub project path; cutover builds target the approved domain.
const cutover = process.env.SITE_TARGET === 'cutover';
export default defineConfig({
  site: cutover ? 'https://www.venumadhavpandit.com' : 'https://7uvenucme.github.io',
  base: cutover ? '/' : '/venumadhavpandit-site-preview',
  output: 'static',
  trailingSlash: 'always',
});
