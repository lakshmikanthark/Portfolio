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

test('Blank, invalid and non-HTTPS configurations schedule no analytics download', () => {
  assert.equal(settings('').length, 0);
  assert.equal(settings('invalid').length, 0);
  assert.equal(settings('G-EXAMPLE1', 'http:').length, 0);
});

test('A configured HTTPS site loads the existing consent controller once', () => {
  const scripts = settings('G-EXAMPLE1');
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, '/assets/js/analytics.js?v=ga4-20261104');
});

test('The provided ID is configured and preview or local hosts cannot load analytics', () => {
  assert.match(read('assets/js/settings.js'), /ga4MeasurementId:'G-WLY0TDLXQG'/);
  for (const host of ['127.0.0.1', 'localhost', 'review.chatgpt.site', 'lakshmikantha.in.example.test']) {
    assert.equal(settings('G-WLY0TDLXQG', 'https:', host).length, 0);
  }
  assert.equal(settings('G-WLY0TDLXQG', 'https:', 'www.lakshmikantha.in').length, 1);
});

function analytics({ choice = null, blocked = false, hostname = 'lakshmikantha.in', supporting = false } = {}) {
  const scripts = [], handlers = {}, attributes = {}, clicks = {};
  const panel = { hidden: true, querySelector: () => ({ focus() {} }) };
  const preferences = { hidden: true, addEventListener: (_, cb) => { handlers.preferences = cb; } };
  const buttons = ['allow', 'decline'].map(value => ({ dataset: { analyticsChoice: value }, addEventListener: (_, cb) => { handlers[value] = cb; } }));
  const context = { location: { protocol: 'https:', origin: 'https://' + hostname, pathname: supporting ? '/services/' : '/', hostname },
    navigator: { globalPrivacyControl: blocked }, localStorage: { getItem: () => choice, setItem() {} },
    LK_SETTINGS: { ga4MeasurementId: 'G-EXAMPLE1' },
    document: { referrer: '', cookie: '',
      querySelector: selector => ({ '#analytics-choice': panel, '#analytics-preferences': preferences, '#privacy-dialog': supporting ? null : { close() {} } })[selector],
      querySelectorAll: () => buttons, createElement: () => ({ remove() {} }), head: { append: el => scripts.push(el) }, addEventListener(type, handler) { clicks[type] = handler; }
    }, addEventListener() {}, requestAnimationFrame: cb => cb(), URL
  };
  context.window = context;
  vm.runInNewContext(read('assets/js/analytics.js'), context);
  return { scripts, handlers, panel, context, attributes, clicks };
}

test('Analytics and performance measurement wait for consent', () => {
  const h = analytics(); assert.equal(h.scripts.length, 0); assert.equal(h.panel.hidden, false);
  h.handlers.allow();
  assert.equal(h.scripts.filter(x => x.src.includes('googletagmanager.com')).length, 1);
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

test('The motion checkbox reports its actual paused or playing state', () => {
  const h = analytics({ choice: 'allow' });
  const target = { id: 'motion-toggle', checked: true, matches: () => false };
  const event = { target: { closest: selector => selector.includes('#motion-toggle') ? target : null } };
  h.clicks.click(event); target.checked = false; h.clicks.click(event);
  const states = h.context.dataLayer.map(args => Array.from(args)).filter(c => c[0] === 'event').map(c => c[2].placement);
  assert.deepEqual(Array.from(states), ['paused', 'playing']);
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
