# Complete website release review — 4 November 2026

This release repairs preview fitting, selection controls and popup access, and restores the requested all-capital headline. It includes the earlier preferences, loading, navigation, Menu and Connect work. The downloadable website is complete, rather than a patch that depends on an older upload.

## Search and measurement audit

See `SEARCH-READINESS.md` for the latest source/HTTP checks. The added regressions reproduce missing post-consent chapter views, failure to revoke after another tab clears preferences, missing project attribution on supporting pages and interrupted page-view loading. The controller now explicitly requests one consented `page_view` per document after the tag loads. All 59 JavaScript checks and twelve Python groups pass. Discovery checks include actual social-image dimensions, canonical/social agreement, resolved schema references, real author/provider IDs, initial-HTML reachability, consent-controller/CSP coverage and sitemap/llms/robots/ownership agreement. Pillow is a developer QA dependency only.

The live custom domain was checked and still serves the earlier ga4/polish revision. All eleven canonical routes returned 200; HTTP and www resolved to the HTTPS apex; robots, sitemap and ownership returned 200; a missing route returned 404. The complete ZIP and review copy contain the newer repairs. Preview HTML uses noindex while the production ZIP remains indexable. Google’s public consumer test additionally accepted About’s ProfilePage/breadcrumb and the launch checklist’s Article/breadcrumb. The article has one optional missing-image warning. Candidate/live JSON-LD parity was verified across all eleven routes. No account-side analytics or indexing state is implied by those results.

## Reproduced issues and repairs

| Issue | Evidence and resulting behaviour |
| --- | --- |
| Black gutters around recordings | All eight recordings are 16:10, while the card frames have other proportions. `object-fit: contain` created internal bars. Inline recordings now use cover with a top-centred position. Popups retain natural proportions with automatic width/height and bounded maximum dimensions; a browser check measured a 960×600 recording rendered at 390×243.75. |
| Selectors pass through unrelated clickable projects | Browser review showed an intermediate project after selecting a later one. Explicit selectors now reposition immediately and synchronize the scene sample. Four new regressions cover all seven selectors, rapid changes, missing smoothing controller and reduced motion. Manual scrolling remains unchanged. |
| Small popup links and inconvenient closing | Project and experiment links have 44px touch targets. The popup close row stays available while scrolling. Native video controls, Escape and focus return remain supported. |
| Phone hint crosses the project action row | The 320×568 review exposed the overlap. On phone project/service chapters the cue now occupies the lower centre, below the actions and selector row. It remains noninteractive. |
| Requested headline style | The initial-capital override was removed. The original uppercase rule again applies to DIRECTION, DETAILS and GROWTH and their animated spans. Menu remains handwritten with a capital M. |

## Automated verification

- 59 JavaScript checks/groups pass: loading tasks/progress, stall/failure recovery, reduced motion, navigation transitions, repeated and interrupted navigation, idle hints and footer entry, seven card selections and rapid changes, enquiry validation/recovery, clipboard failures, workflow states and optional analytics.
- Twelve Python groups pass across eleven canonical routes and the 404 page: unique headings/IDs and metadata, consistent identity, JSON and executable-script CSP hashes, local assets/links/fragments, native form access, confirmed biography and project counts, protected source/media and original SVG geometry/paint order.
- All ten application JavaScript files pass syntax checks; whitespace checks pass.
- Comparison with the previous accepted source confirms six identical phone/wide touch traces and identical sampled animation styles. Graphics-limit queries remain two over 60 simulated frames; tracked steady-frame layout reads remain zero. The optional comparison test now uses a commit present in this repository rather than an unavailable historical commit. These are simulated counts, not FPS measurements.

```sh
node --test tests/*.test.cjs
python3 -B tests/site.test.py
python3 -B tests/discovery.test.py
```

The regression baseline retains 47 protected asset/style/domain/crawl files. Original UI outside the previously authorized enquiry/navigation/utility work remains protected. The new motion exclusion covers only `step()` for the requested selector repair. Before changing its fingerprint, the previous accepted source was verified against the old protected hash and its selector was confirmed identical to the original `c9ff464` source. The renderer, video controller, recordings, mesh, fonts, manual input module and camera/chapter sampling remain unchanged. The floor's 480 polygons retain exact geometry, colours and order. No production dependency was added.

## Browser coverage

Desktop rendering was checked for all ten supporting pages and the 404 page, with one main heading each, no horizontal overflow and no failed rendered images. All ten supporting pages were also checked in a 320×568 CSS-pixel frame with no horizontal overflow. This is responsive-layout testing in a desktop browser, not a claim of physical phone testing.

Homepage review covered a 320×568 phone frame, a 667×375 landscape frame and a 390×844 phone frame, plus the full desktop viewport. The four project selectors and all four project-detail dialogs were exercised; their titles and destinations matched. Popup native video controls, natural media proportions, 44px links, close/Escape and focus recovery were inspected. Service selection, gallery controls, responsive hint separation, uppercase presentation and footer suppression were checked in the final browser pass.

The five linked live destinations—Maison Solenne, SEONY, Yodha, NextMove and Thirty Mornings—loaded successfully, as did their five public repositories and the Council Lens repository. This establishes working portfolio destinations; it does not certify every feature of those separate applications. The local Briefspindle demonstration remains an original, labelled product demo; full software and paid access are still in development.

On the 320×568 supporting-page layout, Analytics preferences opened within the viewport without internal horizontal overflow, explained that measurement was off in the preview and loaded no Google tag. The fictional enquiry workflow produced a review plan, stopped a missing-contact case and recovered when contact availability was restored. Earlier and automated checks cover mail-draft encoding, whitespace-only input, clipboard denial and correction. No test sent email.

## Analytics, accessibility and release limits

The owner-provided `G-WLY0TDLXQG` is configured once across all eleven canonical pages. Production consent, DNT/GPC, download failure/retry, cookie cleanup, revocation, cross-tab changes and excluded enquiry details are covered. Local/preview visits cannot initialize Google tracking. A click on Connect measures intent only after consent; it is not evidence of a delivered message. Receiving-property receipt remains a post-upload check in GA4 Realtime/Tag Assistant.

Keyboard focus, visible native popup pointers, readable/static fallback, native email links, semantic landmarks/headings, image alternatives and reduced-motion behaviour were reviewed through source, behaviour checks and representative browser interactions. This is not a formal WCAG certification or a complete assistive-technology/device matrix.

The cloud browser uses the original poster/2D fallback where WebGL2 is unavailable. No measured Lighthouse, field Core Web Vitals or physical-device FPS score is claimed. Full 3D appearance and sustained animation smoothness need the user's actual GPU/device. The earlier independent-review agent could not run because its usage quota was exhausted; no independent certification is claimed.

The review preview is updated without changing its audience. The public GitHub repository and custom-domain deployment are not modified by preparing this ZIP. After uploading, verify the real-domain routes and receiving analytics property. The original CNAME, crawl policy and ownership material remain included; deployment requires no DNS change.

## Implementation references

- [MDN: object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/object-fit), accessed 4 November 2026: contain retains the entire image and can letterbox; cover fills a fixed box and can crop.
- [MDN: inert](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert), accessed 4 November 2026: inactive content is excluded from interaction and focus.
- [MDN: HTMLMediaElement.play](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play), accessed 4 November 2026: playback promises can reject, so the original image fallback and rejection handling are retained.

## Favicon consistency — 5 November 2026

The original gold knight now has stable root ICO/PNG/Apple-touch URLs and a root manifest on all eleven canonical pages and the 404 page. Original pixels and the homepage favicon animation remain unchanged. The 59 JavaScript, 7 site and 6 discovery checks pass. Browser review verified the 96px PNG loads and nested pages declare the same icons. Google search display remains dependent on recrawling and is not guaranteed.

## Footer navigation hardening — 5 November 2026

Footer chapter links and Back to top bypass the transition curtain and jump immediately. A regression check reproduces the former dependency on animation completion and passes after the repair. The UI version is footer-nav-20261105. Native mouse clicks from the visible footer verified Work, Freelance, Journey and Archive destinations and an actual résumé download in the updated preview. All 60 JavaScript, 7 site and 6 discovery groups pass. The reported live-browser failure was not independently reproduced; the live domain requires this updated package before the direct-navigation behavior applies.

## Full-desktop footer overlap — 5 November 2026

Reproduced the actual click blocker using a 1920×1080 CSS viewport, scaled only for inspection: elementFromPoint returned the decorative `p.footer-lk` over Work, Freelance, Journey, Archive, Résumé and Email. A native mouse click on Work did not navigate. Decorative footer text now has pointer-events:none and footer-nav has position:relative with z-index:1. Afterward all ten link centers resolved to their anchors. A native Work click changed the destination to #work; Freelance, Journey and Archive navigated correctly and Résumé produced a browser download. All 73 existing automated checks still pass. Original design and animation code remain unchanged. The new stylesheet URL is site.css?v=footer-layer-20261105.
