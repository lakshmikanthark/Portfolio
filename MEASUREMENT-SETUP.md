# Learn analytics on your own portfolio

Use Google Search Console to understand discovery in Google. Use Google Analytics 4 (GA4) to understand what visitors do. Keep these accounts under your own control. The website currently has no connected GA4 property and collects no Google Analytics data.

## 1. Verify your website in Search Console

1. Open https://search.google.com/search-console/ using your Google account.
2. Add the URL-prefix property `https://lakshmikantha.in/`.
3. Choose HTML-file verification if you want to avoid editing DNS. Download the verification file Google provides and publish that exact file at your website's root. Return to Google and verify it. Keep the file there afterward.
4. Alternatively, choose a Domain property and follow Google's DNS TXT verification instructions if you control the domain's DNS. Never remove unrelated DNS records.
5. After the new portfolio is published, submit `https://lakshmikantha.in/sitemap.xml` under Sitemaps.
6. Inspect `https://lakshmikantha.in/` in URL Inspection, test its live URL, and request indexing when it is eligible.
7. Check the Performance report for impressions, clicks and queries containing your name. These reports take time to accumulate data. Site changes do not guarantee indexing or a particular rank.

Your LinkedIn already links to the portfolio. Keep the same full name and website link on your professional profiles, résumé and GitHub profile. No new social accounts are needed for this launch.

## 2. Create your GA4 property

1. Open https://analytics.google.com/ and create an Analytics account if needed.
2. Create a property named `LK Portfolio`. Set the reporting timezone to India.
3. Add a Web data stream for `https://lakshmikantha.in/`.
4. Copy its Measurement ID, which begins with `G-`.
5. In the website package, edit only `assets/js/settings.js` and set `ga4MeasurementId` to that ID. Keep the surrounding quotes. The public Measurement ID is not a password or a private API key.
6. Publish the updated settings file with the website. The consent prompt appears only when a valid ID has been configured, and Google Analytics loads only after the visitor allows it. Browser Do Not Track and Global Privacy Control preferences disable this integration.
7. In the Web stream's Enhanced measurement settings, keep page views and disable automatic form interactions, outbound clicks, file downloads and history-based page changes for this portfolio. The site has controlled custom events, and a draft is not a completed lead. Automatic form tracking must not be used to claim enquiries were received.
8. Open the actual live website, allow analytics, and test a résumé click, a project details button and a service quote link.
9. Inspect your own property's Realtime report. Use DebugView/Tag Assistant when needed. A script loading is not proof that your property received an event. Do not announce analytics as working until you can see the expected events there.
10. Return to Privacy → Analytics preferences to test declining and allowing analytics again.

No GA4 ID, Search Console verification token, Google login or real receiving-property access has been supplied yet. Those account steps remain pending.

## 3. What the events mean

| Event | Meaning | Useful breakdown |
| --- | --- | --- |
| `page_view` | A page load, sent by the Google tag | Source, device, country |
| `section_view` | A chapter was entered while analytics was active | `section` |
| `project_open` | A project/demo/source link was selected | `project_id` |
| `project_details` | A project details dialog was opened | `project_id` |
| `resume_click` | A résumé download was requested | `placement` |
| `quote_click` | A service email link was selected | `service` |
| `contact_click` | Another email link was selected | `placement` |
| `enquiry_draft` | The form prepared an email draft | `placement` |
| `motion_toggle` | Motion was paused or resumed | `placement`: paused/playing |
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
- Enhanced measurement: https://support.google.com/analytics/answer/9216061
- Web Vitals: https://web.dev/articles/vitals

References checked for this review on 29 October 2026. Google interface labels may change; follow the instructions shown in your own property.
