# Venumadhav Pandit site

Astro static portfolio for venumadhavpandit.com. Content is in `src/content/builds/*.md`; add a file there for each new build. Run `npm ci && npm run build` to generate `dist/`.

## Deployment status

This repository is a draft. Do not enable the custom domain or modify GoDaddy DNS before Venumadhav approves the preview. The preview uses the GitHub Pages project path `/venumadhavpandit-site-preview/`. Review About career dates/status and external project links. The Actions workflow is manually triggered for the project-path preview. Confirm the deployment target, repository visibility, and account before running it.

At approved cutover, set the custom domain in GitHub Pages settings first (GitHub Actions deploy ignores CNAME files), then update only website DNS records at GoDaddy. Preserve MX/TXT and other services; test both apex and www, HTTPS and old URLs. The old MFan policy is reproduced at `/mfan-2026/` and is not silently rewritten.
