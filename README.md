# LK Portfolio — production candidate

This package contains the reviewed website files for lakshmikantha.in. It has not been uploaded to your repository or published from this session. Analytics and Google ownership verification still need your own account setup. See MEASUREMENT-SETUP.md.

## Publish

1. Keep a backup of the current repository revision so you can revert the release.
2. Extract this ZIP. Upload index.html, 404.html, robots.txt, sitemap.xml, CNAME, .nojekyll and the complete assets directory to the top level of the existing portfolio deployment.
3. Preserve any unrelated existing deployment or domain configuration. CNAME in this package contains lakshmikantha.in.
4. Wait for deployment success, then verify the live homepage, all project links, the résumé PDF, quote email links, enquiry draft form, motion controls and mobile layout.
5. Check https://lakshmikantha.in/robots.txt, https://lakshmikantha.in/sitemap.xml and https://lakshmikantha.in/assets/share.png. Complete Google setup and inspect events in your own property before calling measurement active.

If a critical journey fails, revert to the previous known-working repository revision and verify that it is live. Do not delete the entire repository as a troubleshooting step.

## Replace the résumé

Replace only assets/resume.pdf with your latest PDF, keeping the filename. Every résumé button uses this file. The included PDF is the previous existing résumé; its content has not been rewritten. Hosting/browser caches may take time to refresh after replacement.

## Contact

Service quote buttons open an email to lakshmikanthark20@gmail.com directly, without scrolling to Contact. The enquiry form prepares a draft in the visitor's email app; they review it and press Send. Copy enquiry provides a fallback. A draft or mailto click is not proof that an email was sent or received. No website enquiry backend is included or needed for this flow.

## Experience

The portfolio is silent, with no sound control or audio code. After Hours uses the owner's original dark red (#990000). Reduced-motion visitors receive a readable still version without downloading the 3D mesh. Videos remain muted and begin as the cards enter view. If the scene fails to load, the site falls back to readable content.

The compressed 3D asset is fetched by assets/js/loader.js, with a JSON fallback for older browsers. Keep both knight.json.gz and knight.json. A plain file:// opening is not a reliable way to test the production package's fetches; serve it with a local HTTP server or use the separate self-contained HTML review copy.

## Local preview

From the extracted folder, run `python3 -m http.server 4173`, then open http://localhost:4173/. The deployable website has no build step or package installation requirement.

## Scope

Briefspindle and SEONY remain labelled demos. No live scans, paid access or payment gateway are promised. The original cinematic design, scene sequence, early video playback, gold handwriting and approved navigation proportions are retained. Metadata now emphasizes Business Analyst/Operations opportunities and freelance websites/AI workflows.

Font and web-vitals licenses are included in assets/licenses. The detailed internal audit is supplied separately and is not part of the public website payload.
