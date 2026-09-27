import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) => {
  if (import.meta.env.SITE_TARGET !== 'cutover') return new Response('User-agent: *\nDisallow: /\n');
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml', site).href}\n`);
};
