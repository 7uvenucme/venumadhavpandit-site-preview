# Venumadhav Pandit site

Astro static portfolio for venumadhavpandit.com. Content is in `src/content/builds/*.md`; add a file there for each new build. Run `npm ci && npm run build` to generate `dist/`.

## Deployment status

This repository is a draft. Do not enable the custom domain or modify GoDaddy DNS before Venumadhav approves the preview. The preview uses the GitHub Pages project path `/venumadhavpandit-site-preview/`. Review About career dates/status and external project links. The Actions workflow is manually triggered for the project-path preview. Confirm the deployment target, repository visibility, and account before running it.

At approved cutover, set the custom domain in GitHub Pages settings first (GitHub Actions deploy ignores CNAME files), then update only website DNS records at GoDaddy. Preserve MX/TXT and other services; test both apex and www, HTTPS and old URLs. The old MFan policy is reproduced at `/mfan-2026/` and is not silently rewritten.

## Editing the site (TinaCMS)

Visit `/admin` on the live site and log in with GitHub to edit text, projects and images visually. Saving commits to `main`; the `Build and deploy site` GitHub Action rebuilds and publishes to `gh-pages` automatically (live in ~1-2 minutes).

Local editing: `npm run dev` starts TinaCMS + Astro together, editor at `http://localhost:4321/admin/index.html`.
