import { defineConfig } from 'astro/config';

// GitHub Pages project-site preview. Remove base only at the approved domain cutover.
export default defineConfig({
  site: 'https://7uvenucme.github.io',
  base: '/venumadhavpandit-site-preview',
  output: 'static',
  trailingSlash: 'always',
});
