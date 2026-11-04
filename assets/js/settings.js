// Public GA4 ID supplied by the site owner. Preview visits are never measured.
window.LK_SETTINGS={ga4MeasurementId:'G-WLY0TDLXQG',debug:false};
if(/^G-[A-Z0-9]+$/.test(window.LK_SETTINGS.ga4MeasurementId)&&location.protocol==='https:'&&['lakshmikantha.in','www.lakshmikantha.in'].includes(location.hostname)){
  const script=document.createElement('script');
  script.src='/assets/js/analytics.js?v=ga4-20261104';
  document.head.append(script);
}
