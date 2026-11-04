# Loading and navigation review — 4 November 2026

This review copy includes the requested earlier navigation cue, calmer section changes and smooth real-loading display. It is prepared for review before GitHub upload. No live-domain, DNS or indexing change is included.

## Current result

- “Immerse” becomes eligible 800 ms after the opening handoff, instead of five seconds, and returns after 650 ms of inactivity. It stays hidden during active scrolling, dialogs, reduced motion, flame covers and the contact pose.
- Menu/footer section links fade to black over 260 ms, reposition under the cover, synchronize the scene and reveal the destination over 460 ms. Other distant hash links use the same transition. They no longer race through intervening scenes. Original wheel/touch scrolling remains unchanged.
- The destination receives keyboard focus without an extra scroll. Repeated navigation clicks cannot overlap transitions. Interrupted fades release the cover. Reduced motion and keyboard skip links navigate immediately; modified clicks retain native behaviour.
- The number measures required startup work: model transfer/parsing, renderer, scene readiness, fonts, motion and preview controller. Its display eases toward measured progress and never exceeds it. A usable Content-Length permits partial model-transfer progress; unknown sizes wait for completion.
- 100 requires completion of all startup tasks. The original hero handoff then waits for 100 to be painted. Reduced-motion mode now also waits for actual completion, fixing an early-cover-dismissal bug. Failure/stall recovery reveals readable content without claiming success.
- Original amber particles now start in the loader at progress zero. A subtle amber bloom is available from the first HTML/CSS paint. Reduced motion keeps the bloom static and skips particles.
- The loading-only sentence is “A different perspective is taking shape.” It disappears with the cover.
- The previously removed hero sentence and business/career buttons remain removed. Both routes remain in the menu and footer.

The percentage represents required startup tasks, with partial model transfer contributing to its task. It does not mean that every byte on every linked page is downloaded. Project recordings remain lazy-loaded.

## Preserved behaviour and code scope

The original renderer, mesh, textures, fonts, project media, video controller and first wheel/touch easing module are unchanged. Camera paths, hero formation, particle phases, scroll gains and chapter timing remain protected. Normalized source comparisons exclude only authorized enquiry, link-navigation, loading and hint changes. Expected fingerprints were derived from the previously delivered source, rather than resetting protection to arbitrary new code. Exact SVG geometry, colours and paint order remain checked.

Ember rendering moved from motion to the loader rather than adding a second renderer. The fade uses the browser's Web Animations API. No new production dependency was added. The earlier optional-script reduction and lossless SVG simplification remain; file size alone is not a load-time or FPS measurement.

## Regression checks

```sh
node --test tests/animation-performance.test.cjs tests/navigation.test.cjs tests/loading.test.cjs tests/contact-copy.test.cjs tests/enquiry.test.cjs tests/optional-analytics.test.cjs tests/workflow-demo.test.cjs
python3 -B tests/site.test.py
```

All 40 reported JavaScript checks/groups and all seven Python groups pass. All ten application JavaScript files pass syntax checks; whitespace validation passes.

The new navigation/hint suite initially failed six of seven checks against the previous implementation. The three added smooth-loading, initial-amber and handoff checks also failed before their fixes. A separate reduced-motion regression reproduced early dismissal of the cover and now passes.

The fourteen loading checks cover the clean hero, absence of timed fake percentages, partial and unknown-size transfers, pending tasks, failures/stalls, reduced motion, gzip/transparent responses, font failure, bounded display changes, initial particles and both handoff guards. Navigation checks cover covered repositioning, repeated clicks, interruption, focus, modified clicks, reduced motion, skip links and hint timing/suppression. Existing animation, enquiry, clipboard, privacy and workflow checks remain.

Python checks cover eleven canonical routes, metadata/identity, JSON/CSP, local references/fragments, 404 links, confirmed biography, native form fallback, protected files and SVG parity.

## Browser review

Desktop review verified the clean hero and visible Immerse cue, menu Work/Contact, footer Journey and Back to top. The destination chapter/hash/focus matched, the menu closed, and the transition cover released pointer input. Phone-sized review at 390 × 844 and 320 × 568 CSS pixels showed no horizontal overflow. All five menu links fit the short viewport; Contact navigation also landed correctly there. Startup DOM inspection showed a real intermediate count and the amber background with the loading sentence inside the viewport.

The cloud environment uses the original poster fallback when WebGL2 is unavailable. These checks are not physical-phone FPS measurements or full 3D-rendering proof. The original renderer and visual assets are preserved; full GPU rendering and perceived smoothness still require review on the user's device.

## GA4 configuration

The owner-supplied ID G-WLY0TDLXQG is configured across all eleven canonical pages. Each page uses the same deferred settings/controller and consent choice; supporting-page privacy text and controls were updated together. Local and Sites preview hosts cannot initialize Google tracking. Google and Web Vitals load only after consent on the HTTPS production host. Consent withdrawal/regrant, duplicate prevention, parent-domain GA-cookie cleanup, controlled event parameters and the motion-checkbox event are covered by tests. Advertising consent remains denied.

The new tests first detected missing page coverage, relative nested-page script paths, absent consent updates and preview tracking. They pass after the shared integration fixes. Receiving-property event receipt is pending upload and an owner check in Realtime/Tag Assistant; the review build does not establish live-domain collection.

## Confirmed identity and business

Lakshmikantha R K; variants LK, Lakshmikantha RK and LKRK. Bengaluru business websites, practical AI workflows and operations support, with career and freelance routes. Email-only contact: lakshmikanthark20@gmail.com. TEA is an independent freelance practice; truthful concept/demo labels remain. Hiland Realty is January–September 2026; Posterwa is 2023–ongoing.
