# Search and analytics readiness — 4 November 2026

Research as of 2026-11-04, Asia/Calcutta. This is an implementation and release audit of Lakshmikantha R K's complete portfolio, preserving the existing design, animations and confirmed facts.

## Fixed in this release

- **Consent and chapter accuracy:** chapters entered before consent no longer consume the later consenting view. The current chapter is requested once when measurement becomes available. Repeated entries stay deduplicated within that document.
- **Page-view timing:** the Google config runs once with automatic page views disabled. The controller requests exactly one `page_view` after both consent and the tag download are ready. Decline/regrant during a download, retry and repeated preference changes are covered. This describes the commands requested by the site, not verified receipt in the Analytics property.
- **Withdrawal:** clearing saved preferences in another tab now revokes analytics, as changing the saved choice already did. Advertising consent remains denied; DNT/GPC and preview-host exclusions remain enforced.
- **Coverage:** all eleven canonical pages use the same `G-WLY0TDLXQG` controller and documented non-advertising connection permissions. Supporting project links and service quote actions use controlled IDs. Form contents, email URLs and arbitrary query strings are excluded from custom event parameters.
- **Share metadata:** all eleven routes have canonical/social URL agreement, distinct descriptions, descriptive image alternatives, HTTPS image URLs, image types and actual image dimensions. The portfolio cover is 1200×630; Maison Solenne's project image is 1280×800; Yodha's is 970×600. No image pixels were altered.
- **Discovery:** all canonical pages are reachable through ordinary initial-HTML links. Sitemap, canonical URLs, crawler permissions, stable Person IDs, service providers, article authors and breadcrumb destinations agree. Existing error and embedded-demo pages retain noindex. A small `llms.txt` lists the same eleven public routes and their existing descriptions.
- **Preview isolation:** review pages use `noindex,follow`; production pages in this ZIP retain indexable metadata. Canonical URLs and discovery links continue to name the actual domain.

## Evidence and what it proves

| Check | Result | Practical limit |
| --- | --- | --- |
| JavaScript behaviour | 59 checks/groups passed | VM behaviour and controlled event commands, not receiving-property proof |
| Site and discovery checks | 7 existing plus 5 new Python groups passed | Source, metadata, real image dimensions and entity/link relationships; not a Google rich-result promise |
| Google Rich Results Test: About | ProfilePage and Breadcrumbs valid, 2 items | Public live test; candidate graph is identical |
| Google Rich Results Test: launch checklist | Article and Breadcrumbs valid, 2 items | One non-critical missing article-image warning remains |
| Desktop and phone browser review | Ten supporting routes plus consent panel checked | No horizontal overflow at 320×568; previews load no Google tag |
| Existing visual/animation protections | Passed | Original renderer/media, animation CSS prefix and normalized UI/motion remain protected |
| Actual domain's eleven canonical URLs | All returned HTTP 200 | It currently serves an earlier release; upload this complete ZIP to apply the repairs |
| HTTP and www variants | Ended at HTTPS lakshmikantha.in | Canonical consolidation verified by response, not ranking |
| Missing URL | Returned HTTP 404 | Correct error status rather than a soft 404 |
| robots, sitemap and IndexNow ownership | All returned 200; ownership key matches | Permission/notification readiness, not indexing |
| Live Google-tag configuration | Owner's ID is present; one loader path found | Signed-in stream settings and received events were not inspected |
| PageSpeed API attempt | HTTP 429, available quota was zero | No Lighthouse score, mobile three-run median or field CWV result is claimed |
| GA4, Search Console and Bing receiving reports | Unverified without owner-account access | Use the checks below after publication |

All pages include useful initial HTML and truthful labels. About identifies the person and public profiles, services describe actual scope, case studies distinguish concepts/demos from commissioned work, and notes provide readable answers. No hidden keyword lists, invented address, fake reviews, fabricated results or special AI-only schema were added. The source checks validate syntax and relationships. Google’s separate consumer tests accepted About’s ProfilePage and breadcrumb plus the launch checklist’s Article and breadcrumb. All eleven candidate JSON-LD graphs match the live graphs used for those tests. The article’s sole optional warning is a missing representative image; a generic brand logo is not substituted to manufacture a clean result. A relevant editorial image can be added later. These results do not guarantee display, indexing or a formal accessibility certification.

## Publish and finish the account checks

1. Extract `Lakshmikantha-Portfolio-Complete.zip` into the existing repository root, preserving paths. Review on a branch and merge into the existing Pages branch. Keep the current CNAME, DNS and ownership material.
2. On the real domain, confirm a supporting page loads `settings.js?v=search-audit-20261104`, and that the new preview controls, Menu, Connect and capitals are present. This prevents testing an older deployment by mistake.
3. In the existing GA4 Web stream, confirm `G-WLY0TDLXQG`. Use the Enhanced measurement table in `MEASUREMENT-SETUP.md`: keep history-based page changes and automatic form interactions off; outbound clicks and file downloads may remain on. They are separate generic events, not extra leads.
4. Allow analytics on the real domain in a fresh browser session, then check that a page visit and project/contact/résumé interaction arrive in that property's Realtime or Tag Assistant. Reopening consent must not add another view of the same document. Declining must stop measurement. Inspect the property rather than counting a downloaded script as success.
5. Reuse the verified Search Console property, submit the canonical sitemap and inspect important URLs. Check the available search and generative-AI controls/reports in that account. Existing ownership should be preserved; no duplicate property is required.
6. Reuse Bing Webmaster Tools, inspect the main routes and its available AI Performance report. Submit IndexNow only after the changed pages and matching ownership file are live. The submission response is separate from actual indexing or citations.
7. Run PageSpeed Insights on the deployed version and review real devices for 3D/GPU smoothness. This audit adds no production dependency and does not change motion, but field experience requires actual traffic/devices.

Rankings, AI recommendations/citations, search indexing, consenting visits and received enquiries are different outcomes. No account report, ranking gain, AI citation or actual enquiry is fabricated here.

## Current primary references

Accessed 4 November 2026. Exact publication/update dates were not established in this audit unless the provider states them in the linked page.

- [Google: page-view measurement](https://developers.google.com/analytics/devguides/collection/ga4/views) — disable the automatic view when sending a controlled manual view.
- [Google: consent setup](https://developers.google.com/tag-platform/security/guides/consent) — set defaults before measurement and update on the visitor's choice.
- [Google: non-advertising Analytics CSP](https://developers.google.com/tag-platform/security/guides/csp) — Google documents a narrower set of origins when Ads features are not used.
- [Google: Enhanced measurement](https://support.google.com/analytics/answer/9216061) — history, form, outbound, file and video options have different triggers and parameters.
- [Google: generative AI search](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) — useful original content and technical SEO remain the foundation; Google ignores llms.txt and offers no indexing or serving guarantee.
- [Google: structured-data policy](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) and [ProfilePage](https://developers.google.com/search/docs/appearance/structured-data/profile-page) — factual parity and type-specific requirements matter.
- [Google: sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) — canonical URLs and truthful modification dates, rather than manufactured freshness.
- [OpenAI: crawler purposes](https://developers.openai.com/api/docs/bots) — search discovery and model-training crawlers have separate roles; crawler permission does not prove a citation or training outcome.
