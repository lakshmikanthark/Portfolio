# LK portfolio — complete search release

Prepared 31 October 2026. This is the full existing static portfolio plus seven supporting pages, with the original touch-scroll code restored. No change has been published to lakshmikantha.in from this session.

## Publish through the existing repository

Use the existing `lakshmikanthark/Portfolio` repository and its actual Pages publishing source. Extract `LK-Final-SEO-Original-Scroll-Update.zip` over the existing site, or use `LK-Final-SEO-Original-Scroll-Complete.zip` for the complete source. Its `index.html`, assets and page folders belong at the existing website root. Do not upload the ZIP itself as a web page or nest the site inside an extra folder. Preserve any newer repository changes and Google verification material. These packages replace the earlier animation candidate; previous update ZIPs are not needed. The update explicitly includes the restored `assets/js/ui.js`, so it also corrects an installation of that earlier candidate.

The package retains the cinematic homepage composition, knight assets, styles, silent experience, original After Hours red, domain file and current résumé. The homepage adds an About footer link and uses neutral Technofly project wording where its earlier internship label conflicted with the résumé. Supporting pages use their own stylesheet and require no build, installation or new hosting service.

The complete original `assets/js/ui.js` is restored byte-for-byte, including touch easing, swipe gain, release momentum, bounded queued travel, reversals and the slower dispersing/brand-fade passages. Desktop wheel and anchor glides, native controls, pinch zoom and reduced-motion behaviour are retained. Stable layout dimensions are still cached between layout changes, and WebGL size limits are queried once per context. The original animation timeline, mesh, shaders, particle counts and render resolution remain unchanged. Updated script-version URLs request the restored release. These implementation checks do not establish smoothness or resolve the reported hanging on a physical phone. Full WebGL2 visual verification and actual-phone testing remain outstanding.

## Public routes

- `/`
- `/about/`
- `/services/business-websites/`
- `/work/maison-solenne/`
- `/work/yodha/`
- `/notes/`
- `/notes/business-website-launch-checklist/`
- `/notes/email-drafts-and-enquiries/`

These eight canonical URLs are in sitemap.xml. Each page has its own metadata and a consistent Person identity. Concepts and demos remain labelled. No sales, traffic, commissioning or ranking result is invented.

## After deployment

Open all eight routes on the actual domain. Check the homepage experience, navigation, project destinations, résumé and enquiry draft/copy controls. Check a real phone and the missing-page response. Validate the deployed structured data, refresh the sitemap in the existing Search Console property and inspect important URLs. Preserve the working domain and ownership-verification method.

Analytics is optional and currently unconfigured. See `MEASUREMENT-SETUP.md`. The seven supporting pages have no visitor analytics. Email links open a draft; a click is not proof of delivery. A blank GA4 ID does not prevent the website from being published or indexed.

## Maintenance and rollback

Replace `assets/resume.pdf` to update the résumé. Keep both knight.json.gz and knight.json for the original scene. Use the existing publishing process for content changes. Test this fetched-asset site over HTTP rather than opening index.html directly from the filesystem.

Before merging, retain the existing production revision. If the release causes a critical regression, revert the release through a new commit while preserving unrelated changes, then verify the previous experience is live. Do not delete the repository or change DNS as a routine rollback.

Font and web-vitals licenses remain in assets/licenses. Review-only HTML, research, launch drafts, screenshots and private working files are excluded from the website archive.

## Audit improvements in this revision

The About introduction now offers website services and the résumé directly. All seven supporting pages expose the public email address with a progressive Copy email control and manual fallback. Copying uses only the public address, without tracking or storing enquiry contents. The readable address remains available without JavaScript. The 404 page gives accurate recovery links instead of claiming every missing page moved.

Optional developer check: run `node tests/contact-copy.test.cjs`. This uses Node's standard library to exercise successful copying, an unavailable Clipboard API and denied permission. It is not a real-device test. Check copying on the actual HTTPS site after deployment; the HTTP preview exercises the manual fallback.

Run `node tests/animation-performance.test.cjs` for restored swipe gain/momentum, phase speed limits, bounded queued travel and reversals, native input, pinch cancellation, wheel/anchor/reduced-motion behaviour, layout-cache invalidation and graphics-context checks. In a Git checkout containing the earlier search revision, add `--compare` to compare the original and restored gesture traces and the original and cached animation styles under the same simulated inputs. These are Node VM behaviour checks, not physical-phone FPS measurements or a full GPU rendering test.
