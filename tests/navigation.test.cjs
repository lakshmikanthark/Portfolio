const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));

function navigation({ reduced = false, close = [], distance = 18000 } = {}) {
  const source = read('assets/js/ui.js');
  const start = source.indexOf('  let chapterNavigationBusy=') >= 0
    ? source.indexOf('  let chapterNavigationBusy=') : source.indexOf("  document.addEventListener('click',async e=>{");
  const end = source.indexOf("  $$('[data-details]')", start);
  const fades = [], jumps = [], frames = [], changes = [];
  let handler, focused = false;
  const curtain = { style: {}, animate(keyframes, options) {
    let resolve, reject; const finished = new Promise((a, b) => { resolve = a; reject = b; });
    const animation = { keyframes, options, finished, resolve, reject, cancelled: false, cancel() { this.cancelled = true; } };
    fades.push(animation); return animation;
  } };
  const target = { offsetTop: distance, focus() { focused = true; } };
  const context = { window: null, reduced: { matches: reduced },
    $: () => curtain, $$: () => close,
    document: { getElementById: () => target, addEventListener: (_, callback) => { handler = callback; } },
    innerHeight: 900, scrollY: 0,
    LKMotion: { goTo(id, behavior = 'smooth') { jumps.push({ id, behavior }); context.scrollY = distance; } },
    LKSmoothScroll: { cancel() {} },
    closeDialog: async dialog => { dialog.open = false; },
    requestAnimationFrame: callback => { frames.push(callback); return frames.length; },
    history: { replaceState: (...args) => changes.push(args) }
  };
  context.window = context;
  vm.runInNewContext(source.slice(start, end), context);
  return { fades, jumps, curtain, frames, changes, get focused() { return focused; },
    click({ skip = false, ctrlKey = false } = {}) {
      const anchor = { getAttribute: name => name === 'href' ? '#journey' : null,
        classList: { contains: () => skip }, closest: () => ({}) };
      return handler({ target: { closest: () => anchor }, button: 0, ctrlKey, preventDefault() {} });
    },
    async paint() { for (let i = 0; i < 4 && frames.length; i++) { frames.shift()(i * 16); await tick(); } }
  };
}

test('Distant section navigation covers the page before repositioning', async () => {
  const h = navigation(); const done = h.click(); await tick();
  assert.equal(h.jumps.length, 0, 'Do not race through intervening scenes');
  assert.equal(h.fades.length, 1); assert.ok(h.fades[0].options.duration >= 200);
  h.fades[0].resolve(); await tick();
  assert.deepEqual(h.jumps, [{ id: 'journey', behavior: 'instant' }]);
  await h.paint(); assert.equal(h.fades.length, 2);
  h.fades[1].resolve(); await done;
  assert.equal(h.curtain.style.pointerEvents, 'none'); assert.equal(h.focused, true);
  assert.equal(h.changes[0][2], '#journey');
});

test('Repeated link clicks do not start overlapping chapter changes', async () => {
  const h = navigation(); const first = h.click(); await tick(); const second = h.click(); await tick();
  assert.equal(h.fades.length, 1);
  h.fades[0].resolve(); await tick(); await h.paint(); h.fades[1].resolve(); await Promise.all([first, second]);
  assert.equal(h.jumps.length, 1);
});

test('Reduced motion and keyboard skip links navigate directly', async () => {
  for (const config of [{ reduced: true }, {}]) {
    const h = navigation(config); await h.click({ skip: !config.reduced });
    assert.equal(h.fades.length, 0); assert.equal(h.jumps[0].behavior, 'instant');
  }
});

test('An interrupted fade recovers without trapping the page', async () => {
  const h = navigation(); const done = h.click(); await tick(); h.fades[0].reject(Error('Interrupted')); await done;
  assert.equal(h.jumps.length, 1); assert.equal(h.jumps[0].behavior, 'instant');
  assert.equal(h.curtain.style.pointerEvents, 'none');
});

test('Modified clicks retain their native browser behaviour', async () => {
  const h = navigation(); await h.click({ ctrlKey: true });
  assert.equal(h.jumps.length, 0); assert.equal(h.fades.length, 0);
});

function hint({ scrolling = false, reduced = false, dialog = false } = {}) {
  const source = read('assets/js/motion.js');
  const start = source.indexOf('  function updateImmerse('), end = source.indexOf('  // Loading handoff:', start);
  const classes = new Set();
  const context = { immerse: { dataset: {}, classList: { toggle(name, on) { on ? classes.add(name) : classes.delete(name); } } },
    lastHintSection: 'home', lastScrollActivity: 0, clock: 900, completedClock: 0,
    openingDone: true, openingRevealPending: false,
    reduce: { matches: reduced }, document: { querySelector: () => dialog ? {} : null },
    root: { LKSmoothScroll: { scrolling } }
  };
  vm.runInNewContext(source.slice(start, end), context);
  return { classes, context, update(time = 900, section = 'home', state = { phase: 'forming', flame: { coverage: 0 } }) {
    context.clock = time; context.updateImmerse(time, section, state);
  } };
}

test('Immerse is visible within the first second and returns shortly after scrolling', () => {
  const h = hint(); h.update(); assert.equal(h.classes.has('is-visible'), true);
  h.context.lastScrollActivity = 1000; h.update(1660); assert.equal(h.classes.has('is-visible'), true);
});

test('The earlier hint still respects scrolling, dialogs, reduced motion and red transitions', () => {
  for (const options of [{ scrolling: true }, { reduced: true }, { dialog: true }]) {
    const h = hint(options); h.update(); assert.equal(h.classes.has('is-visible'), false);
  }
  const h = hint(); h.update(900, 'home', { phase: 'forming', flame: { coverage: 1 } });
  assert.equal(h.classes.has('is-visible'), false);
  h.update(1600, 'contact'); assert.equal(h.classes.has('is-visible'), false);
});
