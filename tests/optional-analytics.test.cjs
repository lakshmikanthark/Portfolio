const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('The portfolio keeps Google and web-vitals behind its consent controller', () => {
  const html = read('index.html');
  assert.equal(/<script\b[^>]*src="assets\/js\/(analytics|web-vitals)\.js"/.test(html), false, 'Optional scripts must not be eager HTML dependencies');
});

function settings(id, protocol = 'https:', hostname = 'lakshmikantha.in') {
  const scripts = [], context = { location: { protocol, hostname }, document: {
    createElement: () => ({}), head: { append: script => scripts.push(script) }
  } };
  context.window = context;
  vm.runInNewContext(read('assets/js/settings.js').replace(/ga4MeasurementId:'[^']*'/, `ga4MeasurementId:'${id}'`), context);
  return scripts;
}

test('Blank and invalid configurations schedule no consent controller', () => {
  assert.equal(settings('').length, 0);
  assert.equal(settings('invalid').length, 0);
  assert.equal(settings('G-EXAMPLE1', 'http:').length, 1);
});

test('A configured HTTPS site loads the existing consent controller once', () => {
  const scripts = settings('G-EXAMPLE1');
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, '/assets/js/analytics.js?v=search-audit-20261104');
});

test('The provided ID is configured and preview or local hosts can show the consent UI', () => {
  assert.match(read('assets/js/settings.js'), /ga4MeasurementId:'G-WLY0TDLXQG'/);
  for (const host of ['127.0.0.1', 'localhost', 'review.chatgpt.site', 'lakshmikantha.in.example.test']) {
    assert.equal(settings('G-WLY0TDLXQG', 'https:', host).length, 1);
  }
  assert.equal(settings('G-WLY0TDLXQG', 'https:', 'www.lakshmikantha.in').length, 1);
});

function analytics({ choice = null, blocked = false, dnt = null, hostname = 'lakshmikantha.in', supporting = false, storageDenied = false, chapter = null } = {}) {
  const scripts = [], handlers = {}, attributes = {}, clicks = {}, windowEvents = {};
  const button = name => ({ hidden: false, disabled: false, textContent: '', dataset: { analyticsChoice: name }, focus() { attributes.focus = name; }, addEventListener: (_, cb) => { handlers[name] = cb; } });
  const buttons = ['allow', 'decline'].map(button);
  const close = button('close');
  const status = { textContent: '' }, help = { textContent: '', hidden: true };
  const panel = { hidden: true, contains: () => true, querySelector: selector => selector.includes('allow') ? buttons[0] : selector.includes('decline') ? buttons[1] : close };
  const preferences = { hidden: true, focus() { attributes.focus = 'preferences'; }, addEventListener: (_, cb) => { handlers.preferences = cb; } };
  const context = { location: { protocol: 'https:', origin: 'https://' + hostname, pathname: supporting ? '/services/' : '/', hostname },
    navigator: { globalPrivacyControl: blocked, doNotTrack: dnt }, localStorage: { getItem: () => choice, setItem() { if (storageDenied) throw Error('Storage denied'); } },
    LK_SETTINGS: { ga4MeasurementId: 'G-EXAMPLE1' },
    document: { referrer: '', cookie: '', documentElement: { dataset: chapter ? { chapter } : {} },
      activeElement: preferences,
      querySelector: selector => ({ '#analytics-choice': panel, '#analytics-preferences': preferences, '#analytics-status': status, '#analytics-help': help, '#analytics-close': close, '#privacy-dialog': supporting ? null : { open: false, close() {} } })[selector],
      querySelectorAll: () => buttons, createElement: () => ({ remove() {} }), head: { append: el => scripts.push(el) }, addEventListener(type, handler) { clicks[type] = handler; }
    }, addEventListener(type, cb) { windowEvents[type] = cb; }, requestAnimationFrame: cb => cb(), URL
  };
  context.window = context;
  vm.runInNewContext(read('assets/js/analytics.js'), context);
  return { scripts, handlers, panel, context, attributes, clicks, status, help, buttons, windowEvents };
}

test('Chapters visited before consent remain measurable after consent, once per page', () => {
  const h = analytics({ chapter: 'services' });
  h.windowEvents['lk:chapter']({ detail: { section: 'services' } });
  assert.equal(h.scripts.length, 0);
  h.handlers.allow();
  h.scripts[0].onload();
  const events = () => h.context.dataLayer.filter(c => c[0] === 'event' && c[1] === 'section_view');
  assert.equal(events().length, 1);
  assert.equal(events()[0][2].section, 'services');
  h.windowEvents['lk:chapter']({ detail: { section: 'services' } });
  assert.equal(events().length, 1);
  h.handlers.decline();
  h.context.document.documentElement.dataset.chapter = 'work';
  h.windowEvents['lk:chapter']({ detail: { section: 'work' } });
  assert.equal(events().length, 1);
  h.handlers.allow();
  assert.equal(events().length, 2);
  assert.equal(events()[1][2].section, 'work');
  assert.equal(h.context.dataLayer.filter(c => c[0] === 'config').length, 1);
});

test('Clearing saved preferences in another tab revokes analytics', () => {
  const h = analytics({ choice: 'allow' });
  h.windowEvents.storage({ key: null, newValue: null });
  assert.equal(h.context.LKAnalytics.inspect().active, false);
  assert.equal(h.context['ga-disable-G-EXAMPLE1'], true);
});

test('A consent change during tag download cannot lose or duplicate the page view', () => {
  const h = analytics();
  h.handlers.allow();h.handlers.decline();h.scripts[0].onload();
  const views = () => h.context.dataLayer.filter(c => c[0] === 'event' && c[1] === 'page_view');
  assert.equal(views().length, 0);
  h.handlers.allow();
  assert.equal(views().length, 1);
  h.handlers.decline();h.handlers.allow();
  assert.equal(views().length, 1);
  const config = h.context.dataLayer.filter(c => c[0] === 'config');
  assert.equal(config.length, 1);
  assert.equal(config[0][2].send_page_view, false);
  assert.equal(h.scripts.filter(s => s.src.includes('googletagmanager.com')).length, 1);
});

test('Supporting-page project links use the same controlled project identifier', () => {
  const h = analytics({ choice: 'allow', supporting: true });
  const target = { dataset: { projectOpen: 'solenne' }, matches: selector => selector === '[data-project-open]', closest: () => null };
  h.clicks.click({ target: { closest: () => target } });
  const event = h.context.dataLayer.find(c => c[0] === 'event');
  assert.equal(event?.[1], 'project_open');
  assert.equal(event[2].project_id, 'solenne');
});

test('DNT preferences stay accessible and explain why analytics is off', () => {
  const h = analytics({ dnt: '1', supporting: true });
  h.handlers.preferences();
  assert.equal(h.panel.hidden, false);
  assert.match(h.status.textContent, /Do Not Track/);
  assert.equal(h.buttons[0].disabled, true);
  h.handlers.allow();
  assert.equal(h.scripts.length, 0);
});

test('GPC has its own explanation without needing the homepage toast', () => {
  const h = analytics({ blocked: true, choice: 'allow', supporting: true });
  h.handlers.preferences();
  assert.equal(h.panel.hidden, false);
  assert.match(h.status.textContent, /Global Privacy Control/);
  assert.equal(h.scripts.length, 0);
});

test('Preview preferences are reviewable but can never start Google tracking', () => {
  const h = analytics({ hostname: 'review.chatgpt.site' });
  h.handlers.preferences();
  assert.equal(h.panel.hidden, false);
  assert.match(h.status.textContent, /preview/i);
  h.handlers.allow();
  assert.equal(h.scripts.length, 0);
});

test('Analytics and performance measurement wait for consent', () => {
  const h = analytics(); assert.equal(h.scripts.length, 0); assert.equal(h.panel.hidden, false);
  h.handlers.allow();
  assert.equal(h.scripts.filter(x => x.src.includes('googletagmanager.com')).length, 1);
  assert.equal(h.scripts.filter(x => x.src.startsWith('/assets/js/web-vitals.js')).length, 0);
  h.scripts[0].onload();
  assert.equal(h.scripts.filter(x => x.src.startsWith('/assets/js/web-vitals.js')).length, 1);
});

test('Supporting pages can reopen preferences and withdraw or restore consent without duplicate tags', () => {
  const h = analytics({ supporting: true });
  h.handlers.allow();
  const commands = () => h.context.dataLayer.map(args => Array.from(args));
  assert.equal(commands().find(c => c[0] === 'config')[1], 'G-EXAMPLE1');
  const defaults = commands().find(c => c[0] === 'consent' && c[1] === 'default')[2];
  assert.equal(defaults.analytics_storage, 'denied');
  assert.equal(defaults.ad_storage, 'denied');
  assert.equal(defaults.ad_user_data, 'denied');
  assert.equal(defaults.ad_personalization, 'denied');
  h.handlers.preferences(); assert.equal(h.panel.hidden, false);
  h.handlers.decline(); assert.equal(h.context['ga-disable-G-EXAMPLE1'], true);
  h.context.LKAnalytics.track('contact_click', { placement: 'page' });
  assert.equal(commands().filter(c => c[0] === 'event').length, 0);
  h.handlers.allow();
  assert.equal(h.scripts.filter(s => s.src.includes('googletagmanager.com')).length, 1);
  assert.equal(commands().filter(c => c[0] === 'config').length, 1);
  assert.equal(commands().filter(c => c[0] === 'consent' && c[1] === 'update').at(-1)[2].analytics_storage, 'granted');
});

test('The analytics controller also refuses preview hosts with remembered consent', () => {
  const h = analytics({ hostname: 'review.chatgpt.site', choice: 'allow' });
  assert.equal(h.scripts.length, 0); assert.equal(h.panel.hidden, true);
});

test('Events strip arbitrary form fields and private values', () => {
  const h = analytics({ choice: 'allow' });
  h.context.LKAnalytics.track('contact_click', { placement: 'page', email: 'private@example.test', message: 'Private enquiry', service: 'mailto:private@example.test' });
  const event = h.context.dataLayer.map(args => Array.from(args)).find(c => c[0] === 'event');
  assert.deepEqual(Object.keys(event[2]), ['placement']);
  assert.equal(JSON.stringify(h.context.dataLayer).includes('private@example.test'), false);
});

test('Connect opens the public email and measures contact intent', () => {
  assert.match(read('index.html'), /id="quick-connect" class="utility" href="mailto:lakshmikanthark20@gmail.com"[^>]*>Connect<\/a>/);
  assert.doesNotMatch(read('index.html'), /id="motion-toggle"/);
  const h = analytics({ choice: 'allow' });
  const target = { id: 'quick-connect', matches: selector => selector === 'a[href^="mailto:"]', closest: () => null };
  h.clicks.click({target:{closest:()=>target}});
  const events = h.context.dataLayer.map(args => Array.from(args)).filter(c => c[0] === 'event');
  assert.equal(events.length, 1); assert.equal(events[0][1], 'contact_click');
});

test('Withdrawal on www removes only GA cookies, including the parent-domain cookies', () => {
  const h = analytics({ choice: 'allow', hostname: 'www.lakshmikantha.in' });
  const removed = [];
  Object.defineProperty(h.context.document, 'cookie', {
    get: () => '_ga=example; _ga_TEST=example; unrelated=keep', set: value => removed.push(value)
  });
  h.handlers.decline();
  assert.ok(removed.some(value => value === '_ga=; Max-Age=0; path=/; domain=.lakshmikantha.in'));
  assert.ok(removed.every(value => value.startsWith('_ga')));
});

test('A declined choice or browser privacy preference prevents measurement downloads', () => {
  assert.equal(analytics({ choice: 'decline' }).scripts.length, 0);
  const blocked = analytics({ choice: 'allow', blocked: true });
  assert.equal(blocked.scripts.length, 0); assert.equal(blocked.panel.hidden, true);
});

test('A failed Google download shows recovery and can retry without duplicate configuration', () => {
  const h = analytics(); h.handlers.allow();
  assert.match(h.status.textContent, /Connecting/);
  h.scripts[0].onerror();
  assert.match(h.status.textContent, /could not connect/);
  assert.equal(h.context.LKAnalytics.inspect().active, false);
  assert.equal(h.buttons[0].disabled, false);
  h.handlers.allow(); h.scripts[1].onload();
  assert.match(h.status.textContent, /enabled/);
  assert.equal(h.context.dataLayer.filter(args => args[0] === 'config').length, 1);
});

test('Declining while the Google tag is pending cannot start vitals when it arrives', () => {
  const h = analytics(); h.handlers.allow(); h.handlers.decline(); h.scripts[0].onload();
  assert.equal(h.scripts.length, 1);
  assert.match(h.status.textContent, /off by your choice/);
  assert.equal(h.context['ga-disable-G-EXAMPLE1'], true);
});

test('A failed connection does not override a later decline', () => {
  const h = analytics(); h.handlers.allow(); h.scripts[0].onerror(); h.handlers.decline();
  assert.match(h.status.textContent, /off by your choice/);
  assert.equal(h.help.hidden, true);
});

test('Revoking consent in another tab stops this tab as well', () => {
  const h = analytics({choice:'allow'}); h.scripts[0].onload();
  h.windowEvents.storage({key:'lk-analytics-choice',newValue:'decline'});
  assert.equal(h.context.LKAnalytics.inspect().active, false);
  assert.equal(h.context['ga-disable-G-EXAMPLE1'], true);
});

test('Preferences can close with Escape and return keyboard focus', () => {
  const h = analytics(); h.handlers.preferences();
  assert.equal(h.attributes.focus, 'close');
  h.clicks.keydown({key:'Escape',preventDefault(){}});
  assert.equal(h.panel.hidden, true);
  assert.equal(h.attributes.focus, 'preferences');
});

test('Storage restrictions show a temporary choice without breaking the website', () => {
  const h = analytics({storageDenied:true}); h.handlers.decline();
  assert.match(h.help.textContent, /could not save/);
  assert.equal(h.scripts.length, 0);
});
