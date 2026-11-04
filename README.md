# Lakshmikantha portfolio — complete website

Prepared 4 November 2026 for the existing `lakshmikanthark/Portfolio` repository and `lakshmikantha.in`.

## Publish the complete website

`Lakshmikantha-Portfolio-Complete.zip` contains the complete static website, all original assets and recordings, the résumé, ownership files and the regression checks. `index.html` is at the ZIP root. This replaces the earlier change-only delivery; no previous ZIP is needed.

Extract the ZIP and upload the extracted contents into the repository root, preserving folder paths. Do not upload the ZIP as the website. Review changes on a branch and merge into `main`, using the repository's existing GitHub Pages publishing source. Preserve any newer unrelated repository changes and ownership files. Keep the current CNAME and DNS. No dependency installation or build step is required for hosting.

## This revision

- DIRECTION, DETAILS and GROWTH use the original all-capital handwriting presentation, including animated letter spans.
- Menu keeps its handwritten Ruthie label, capital M and flowing gold text and bars. Connect retains the original utility sizing and opens `lakshmikanthark20@gmail.com`.
- All eight inline recordings fill their frames without letterboxing. The top of the recording is retained; edges may crop to fill the frame. Details popups display the complete recording at its natural proportions, with native playback controls and an image fallback.
- Project and service selectors land directly on the requested card. Manual wheel/touch easing, chapter timings and camera paths remain unchanged.
- Popup links have 44px touch targets, the details close control remains available while scrolling, and the phone Immerse cue sits below project/service actions and selectors.
- Immerse returns after one idle second in all thirteen homepage chapters before the footer. It disappears as soon as any footer enters the viewport, during loading or open dialogs, and for reduced motion.

## Search and measurement audit

The final audit also repairs missed chapter measurement around consent, page-view timing during interrupted tag downloads, and cross-tab clearing of consent. Every canonical page permits the same documented non-advertising GA4 endpoints. Supporting-page project and service actions now carry controlled attribution. All share cards include their real image dimensions, MIME types, HTTPS image URLs and descriptive alternatives.

`llms.txt` is a short navigation file generated from the eleven canonical pages, with no new claims or private data. Google Search does not use it as a ranking signal. Structured-data references, author/provider identity, breadcrumbs, initial-HTML link reachability and discovery-file agreement are checked. Existing visible questions and truthful concept/demo labels remain. Read `SEARCH-READINESS.md` for the audit and the owner-account checks.

The review copy uses `noindex,follow` to avoid competing with the main domain. The production ZIP retains indexable metadata on all eleven canonical pages; this is the only deliberate HTML policy difference between the preview and production copy.

## Favicon consistency — 5 November 2026

All eleven portfolio pages and the 404 page use the original gold knight through stable root icon URLs. `/favicon.ico`, 96/32/16px PNGs, the 180px Apple touch icon and `/site.webmanifest` cover search, tabs, bookmarks and home-screen shortcuts. Original image bytes and the animated homepage tab icon are preserved. External platforms decide when to refresh their caches; Google may need days or weeks to recrawl, and display is not guaranteed. After publication, request the homepage in the existing Search Console property.

## Footer navigation — 5 November 2026

The full-desktop issue was reproduced at a 1920×1080 CSS viewport: the decorative LK paragraph intercepted clicks intended for the central footer links. Decorative LK/signature text now ignores pointer events and the footer navigation has its own positioned layer. The original layout and typography are unchanged. The stylesheet uses `footer-layer-20261105` to refresh cached CSS. All ten link centers pass browser hit testing, and Work, Freelance, Journey, Archive and the résumé download were verified in that layout.

Footer chapter links and Back to top now navigate immediately, without waiting for the transition curtain. Menu transitions and manual scrolling retain their existing behavior. The UI script uses `footer-nav-20261105` so a cached older controller is refreshed. Résumé remains a native PDF download.

## Pages and measurement

The eleven canonical routes are `/`, `/about/`, `/services/`, `/services/business-websites/`, `/services/ai-workflow-automation/`, `/work/maison-solenne/`, `/work/yodha/`, `/work/enquiry-workflow/`, `/notes/`, `/notes/business-website-launch-checklist/` and `/notes/email-drafts-and-enquiries/`. The sitemap, 404 page, crawl policy and verification material are included.

GA4 `G-WLY0TDLXQG` is installed once through the shared consent controller on every canonical page. Measurement starts only after consent on HTTPS `lakshmikantha.in` or `www.lakshmikantha.in`. Preview/local visits cannot download Google's tracking script. Do Not Track and Global Privacy Control remain respected and explained. Preferences support retry, Escape, focus return and cross-tab withdrawal. Enquiry details are excluded; advertising consent stays denied. See `MEASUREMENT-SETUP.md` for the remaining receiving-property check.

The enquiry form prepares a draft in the visitor's email app; the visitor reviews and sends it. Copying is available with a manual recovery message if clipboard access fails. The workflow demonstration uses fictional examples and sends no messages. Concepts and demonstrations remain labelled truthfully. Hiland Realty is January–September 2026; Posterwa is 2023–ongoing freelance work.

## Verification

Run from the extracted website root:

```sh
node --test tests/*.test.cjs
python3 -B tests/site.test.py
python3 -B tests/discovery.test.py
```

The image-dimension discovery check uses Pillow, already installed in the review environment; install it in a separate developer environment when running that optional QA suite. It is not a website hosting dependency.

The current release passes 60 JavaScript checks/groups and thirteen Python groups. They cover loading and recovery, navigation, requested card selection, enquiry validation, clipboard recovery, analytics/privacy states, the fictional workflow, metadata/identity, local links/fragments, CSP and preservation of original media and animation code outside the authorized repairs. See `REVIEW-RESULTS.md` for browser coverage and limits.

Use HTTP/HTTPS when testing; opening the HTML directly from the filesystem does not reproduce hosting. The cloud browser uses the original poster/2D fallback when WebGL2 is unavailable. Automated behaviour checks do not establish physical-device FPS, full GPU appearance or event receipt in GA4. These require a check on the actual device and receiving property after upload.

## Maintenance and rollback

Keep both `assets/knight.json.gz` and `assets/knight.json`, all original fonts and licences, and replace `assets/resume.pdf` when the résumé changes. Preserve the same public identity and accurate project labels. No production dependency was added.

After GitHub Pages publishes, check the real-domain routes, résumé, email links and preferences; allow analytics and confirm a visit in GA4 Realtime. Refresh the existing sitemap in Search Console and Bing Webmaster Tools. An accepted sitemap or IndexNow submission is not proof of indexing, ranking or AI citation.

For rollback, revert the release through a new commit while preserving unrelated work. Do not delete the repository or change DNS as routine rollback. Credentials, private research, QA harnesses and working helpers are excluded from the package.
