# Learn analytics on your own portfolio

Use Google Search Console to understand discovery in Google. Use Google Analytics 4 (GA4) to understand what visitors do. Keep these accounts under your own control. The owner supplied GA4 Measurement ID `G-WLY0TDLXQG`. This build is configured to use it after visitor consent; receipt in the Analytics property has not been independently verified.

## Release scope: measurement is separate from publication

All eleven canonical pages share `assets/js/settings.js` and the consent-controlled analytics integration. Google tracking loads only over HTTPS on `lakshmikantha.in` or `www.lakshmikantha.in`; local and Sites preview visits are excluded. The consent choice persists across pages, and changes also apply to other open tabs. The homepage offers Privacy → Analytics preferences; supporting pages offer Analytics preferences in the footer. Declining prevents Google downloads, and withdrawal disables measurement and removes GA cookies. Browser Do Not Track and Global Privacy Control also prevent tracking. Preferences still open, identify the exact browser signal and explain how the owner can change their browser setting before reloading. Do not bypass visitor opt-outs. The panel has a close button, Escape recovery and a visible native pointer. A blocked or failed Google script is reported separately from an opt-out, with a manual retry. Advertising storage, user data and personalization remain denied. The 404 page and embedded standalone project demos are outside this canonical-page measurement scope.

The website can launch without analytics. Use Search Console and a private enquiry ledger first. Never invent a Measurement ID, treat an email-draft open as a completed lead, or announce working analytics before the receiving property has been checked.

## 1. Verify your website in Search Console

1. Open https://search.google.com/search-console/ using your Google account.
2. Select the existing property for `https://lakshmikantha.in/` when present. The owner has already supplied a URL Inspection live-test and indexing-request screenshot. Do not create a duplicate property just to repeat that request.
3. Check the existing ownership-verification method and preserve it. If verification is actually required and Google offers HTML-file verification, publish the exact file it provides at the website root and keep it there.
4. Alternatively, choose a Domain property and follow Google's DNS TXT verification instructions if you control the domain's DNS. Never remove unrelated DNS records.
5. After the new portfolio is published, submit `https://lakshmikantha.in/sitemap.xml` under Sitemaps.
6. Inspect the eleven canonical routes in sitemap.xml. Compare indexed state and live testing; request indexing when appropriate. An accepted request does not establish indexing, and repeated requests do not advance the queue.
7. Check the Performance report for impressions, clicks and queries containing your name. These reports take time to accumulate data. Site changes do not guarantee indexing or a particular rank.

Your LinkedIn already links to the portfolio. Keep the same full name and website link on your professional profiles, résumé and GitHub profile. No new social accounts are needed for this launch.

## Search and AI discovery checks after publishing

- In the existing Google Search Console property, inspect Settings → Search generative AI. Keep the site included and check any inherited parent-property choice. The dedicated Generative AI performance report may need sufficient impressions before it is visible.
- Reuse or verify Bing Webmaster Tools, submit the canonical sitemap, inspect the important pages and check its AI Performance report. Citations are not ranking positions.
- This release includes a public IndexNow ownership file. Notify participating engines only after the matching pages and that file are live, and record the response separately from actual indexing.
- The robots policy already permits public search crawlers. Crawl permission, indexing, citations and qualified enquiries are separate states.

## 2. Activate and verify the supplied GA4 tag

1. The supplied ID `G-WLY0TDLXQG` is already in `assets/js/settings.js`. Do not paste an additional copy of the Google snippet into the HTML; that would bypass the consent controls or duplicate page views.
2. Upload the updated package contents to the existing Portfolio repository, preserving folders. Wait for the Pages deployment to finish, then open `https://lakshmikantha.in/`.
3. Choose **Allow analytics**. No Google requests are made before consent, after an initial decline, on preview/local hosts, or when the browser's Do Not Track/Global Privacy Control preference blocks this integration.
4. In your existing Analytics Web stream, confirm the ID is `G-WLY0TDLXQG` and the site URL is `https://lakshmikantha.in/`. Keep the reporting timezone set to India if that is the timezone you want in reports. No property settings have been changed in this session.
5. In the Web stream's Enhanced measurement settings, use the table below. The shared controller disables the config command's automatic page view, then explicitly requests one `page_view` when the Google script is ready and consent is allowed. Repeated consent changes do not request another view for the same document. History-based page views must stay off: homepage chapter links use `replaceState`, and those chapters have their own `section_view` events. A form submission here prepares an email draft, so automatic `form_submit` is not a received lead.
6. Open **Reports → Realtime** in that property, then visit the homepage, About and a service page, and try a résumé link or project details button. Google Tag Assistant can also verify tag and event delivery. A script or a queued event alone does not prove that the receiving property recorded it.
7. Test declining or withdrawing through **Analytics preferences**. Use a fresh private browser session for the initial-consent check; an earlier allowed choice is remembered. Advertising consent remains denied even when visitor analytics is allowed.

The measurement ID is configured and the code/consent tests pass. The actual domain has not been updated by this review build, and signed-in Analytics/Realtime or Search Console state has not been inspected. Preserve existing ownership verification. Google Analytics measures visits and interactions; it does not establish indexing, rankings or AI citations.

## Enhanced measurement settings

| Setting | Value for this portfolio | Reason |
| --- | --- | --- |
| Page views | On | The controller requests a single consented view per document. |
| Browser-history page changes | Off | Chapter navigation is measured with `section_view`; a chapter is not another page. |
| Outbound clicks | On if wanted | Generic `click` provides link detail; `project_open` is the controlled project-intent event. Do not sum them as separate leads. |
| File downloads | On if wanted | Generic `file_download` complements `resume_click`; neither proves a completed download or a job enquiry. |
| Scrolls | On if wanted | Google's threshold is a rough page-depth measure on this long animated homepage. Chapter events provide more useful detail. |
| Form interactions | Off | This form prepares a draft; it does not submit a received enquiry to a server. |
| Site search | Off | This portfolio has no site-search results. |
| Video engagement | Optional | Google's built-in option targets supported YouTube embeds, rather than these decorative HTML5 recordings. |

These account-side settings have not been read or changed in your Analytics property. Check them there after uploading. Contact details and free-text enquiries are never custom analytics parameters; page URLs sent by this controller exclude query strings and fragments. New consenting chapter visits are counted without consuming views before consent. Clearing the saved choice in another tab revokes measurement. Service-page quote links and supporting-page project links use the same controlled IDs as the homepage.

## 3. What the events mean

| Event | Meaning | Useful breakdown |
| --- | --- | --- |
| `page_view` | One page view requested after consent and a successful Google-tag connection | Source, device, country |
| `section_view` | A chapter was entered while analytics was active | `section` |
| `project_open` | A project/demo/source link was selected | `project_id` |
| `project_details` | A project details dialog was opened | `project_id` |
| `resume_click` | A résumé download was requested | `placement` |
| `quote_click` | A service email link was selected | `service` |
| `contact_click` | Another email link was selected | `placement` |
| `enquiry_draft` | The form prepared an email draft | `placement` |
| `web_vital` | An eligible LCP, CLS or INP observation from Google's web-vitals library | `metric_name`, `metric_rating`, `metric_value` |

An email click or draft is an intent signal. The website cannot tell whether the visitor pressed Send in their email app or whether you received the email. Check your inbox for real enquiries. Decorative video autoplay is not counted as a visitor conversion.

Register event-scoped custom dimensions for `project_id`, `section`, `service`, `placement`, `metric_name` and `metric_rating` if you want them in explorations. Register `metric_value` as a custom metric to inspect Web Vitals values. Interpret its unit with `metric_name`: LCP/INP are milliseconds; CLS is a unitless score.

Choose `resume_click` and an enquiry-intent event as your initial key events. Keep job-search interest and freelance interest separate in your reporting. Never count every animation, video frame or scroll event as a conversion.

## 4. A simple weekly review

| Question | Where to look |
| --- | --- |
| Are people finding my name? | Search Console → Performance: impressions, clicks, queries |
| Where did visitors come from? | GA4 acquisition reports |
| Which projects get attention? | GA4 events/explorations filtered by `project_id` |
| Are recruiters interested? | Résumé clicks and relevant project interactions |
| Are potential clients interested? | Quote clicks by service, email/draft intent, actual inbox enquiries |
| Is the experience responsive? | LCP/INP/CLS events and PageSpeed Insights after publishing |

Compare consistent date ranges. Small samples are noisy. Analytics here covers consenting visitors, not every visitor. Local automated test timings are not real-user Core Web Vitals. INP needs eligible interactions, and useful trends need enough real observations.

## 5. Reuse the learning with clients

Let each client own their Analytics and Search Console properties and grant you appropriate access. Use separate client properties and correct domains. Define that client's real outcomes first, then map events to those outcomes. Verify actual event receipt, do not copy your portfolio's Measurement ID into a client's site, and never send contact-form contents or personal information as analytics parameters.

## Official references

- SEO basics: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Ownership verification: https://support.google.com/webmasters/answer/9008080
- GA4 events: https://developers.google.com/analytics/devguides/collection/ga4/events
- Consent controls: https://developers.google.com/tag-platform/security/guides/consent
- Verify the Google tag: https://support.google.com/analytics/answer/15756111
- Enhanced measurement: https://support.google.com/analytics/answer/9216061
- Web Vitals: https://web.dev/articles/vitals

Tag installation and consent references checked on 4 November 2026. Google interface labels may change; follow the instructions shown in your own property.
