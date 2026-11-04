# LK portfolio — business and search discovery update

Prepared 4 November 2026 for the existing lakshmikanthark/Portfolio repository and lakshmikantha.in deployment.

This revision makes the dual portfolio easier to enter: the main menu and footer offer business and career routes, and the supporting pages describe website development, practical automation and business operations work in Bengaluru. The consistent public identity is Lakshmikantha R K, with LK, Lakshmikantha RK and LKRK as supported name variants. Other close spellings are explained once on About rather than turned into duplicate pages.

## Publish through the existing repository

Review the private website preview first. When ready, extract Lakshmikantha-Discovery-Update.zip and upload its contents into the existing repository root, preserving directory paths. The ZIP contains only changed or new files and requires the existing site assets. Upload the extracted files, not the ZIP itself. Preserve newer repository changes and all ownership-verification material. Keep the current Pages publishing source and CNAME; this release requires no hosting or DNS change.

The original renderer, project-video code, knight assets, media, fonts and résumé are unchanged. The startup counter measures actual required loading work, with the displayed number easing toward completed work without running ahead. Amber particles start in the loader and a small loading-only sentence reads, “A different perspective is taking shape.” Reduced-motion mode also waits for actual completion. The homepage keeps its clean knight-and-type composition: the added introductory sentence and two hero actions remain removed, with business and career routes in the five-link menu and footer. No measured client, ranking, traffic or revenue result is invented.

“Immerse” becomes eligible 800 ms after the opening handoff and returns after 650 ms of inactivity. Menu/footer and other distant section links use a 260 ms fade to black, reposition under that cover, then reveal the destination over 460 ms. Keyboard skip links and reduced-motion navigation remain immediate. Original manual wheel/touch easing, camera paths, hero formation and chapter timing remain protected; only the requested loading, hint and link-navigation handoffs change. Contact text is larger. The After Hours heading and sentence use the requested #990000 red.

## Public routes

- /
- /about/
- /services/
- /services/business-websites/
- /services/ai-workflow-automation/
- /work/maison-solenne/
- /work/yodha/
- /work/enquiry-workflow/
- /notes/
- /notes/business-website-launch-checklist/
- /notes/email-drafts-and-enquiries/

All eleven canonical routes are included in sitemap.xml. Supporting pages use the existing reading layout, visible breadcrumbs and a consistent Person identity. The enquiry workflow is a fictional, rule-based browser demonstration: it sends no messages, makes no network request and stores no customer data. Its automation service explains how a real implementation would need agreed tools, ownership and review.

## Verification

The release passes 40 JavaScript checks/groups and seven Python site-check groups covering all eleven routes. A regression baseline protects 47 assets, styles, domain and crawl-policy files, with normalized comparisons protecting original UI/motion outside the authorized changes. The enquiry controls reject whitespace-only names and messages, recover after correction and keep a native form available without JavaScript. Optional Google measurement and web-vitals wait for consent. See REVIEW-RESULTS.md for coverage. Browser review includes desktop section navigation, keyboard focus, 390 × 844 and 320 × 568 CSS-pixel layouts, and short-screen menu access. Earlier supporting-page, contact, workflow and dialog checks are retained.

Developer checks:

```sh
node --test tests/animation-performance.test.cjs tests/navigation.test.cjs tests/loading.test.cjs tests/contact-copy.test.cjs tests/enquiry.test.cjs tests/optional-analytics.test.cjs tests/workflow-demo.test.cjs
python3 -B tests/site.test.py
```

The Node animation checks exercise simulated behaviour; they do not measure physical-phone FPS. This cloud browser lacks WebGL2 and used the original poster fallback, so full 3D rendering and actual-device smoothness still need a real-device check. All original renderer code is preserved. Test the site over HTTP or HTTPS, rather than opening index.html directly from the filesystem.

## After deployment

Open the eleven routes on the actual domain, check the résumé and enquiry controls, and confirm the deployed sitemap and IndexNow ownership file. Refresh the sitemap in the existing Google Search Console and Bing Webmaster Tools properties. Inspect the important URLs and the available search/AI performance reports. Submit IndexNow only after the ownership file and changed URLs are live; a submission response does not prove indexing or a citation.

GA4 Measurement ID G-WLY0TDLXQG is configured across all eleven canonical pages. Google tracking runs only over HTTPS on lakshmikantha.in or www.lakshmikantha.in, after consent; preview and local visits are excluded. The same choice applies across pages, with preferences available in the footer or homepage Privacy dialog. Enquiry details are excluded and advertising consent stays denied. Receiving-property data has not been verified; after uploading, allow analytics on the real domain and check your property's Realtime report. Email links open a draft; a click is not proof of delivery. See MEASUREMENT-SETUP.md. Crawl access, indexing, rankings, AI citations and qualified enquiries are separate outcomes.

## Maintenance and rollback

Keep the same full name, public profiles and website link across the website and professional profiles. Add only genuine projects, outcomes and client feedback. Update assets/resume.pdf when the résumé changes. Keep both knight.json.gz and knight.json for the original scene. Retain the existing font and web-vitals licences.

If deployment introduces a critical regression, revert the release through a new commit while preserving unrelated work, then verify the previous site is live. Do not delete the repository or change DNS as routine rollback. Private research, previews, QA harnesses and working scripts are excluded from the upload package.
