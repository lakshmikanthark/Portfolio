const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { gzipSync } = require('node:zlib');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const tick = () => new Promise(resolve => setImmediate(resolve));

function loader({ knownSize = true, reduced = false, compression = '' } = {}) {
  const fonts = deferred(), scene = deferred(), network = deferred();
  const scripts = [], timers = new Map(), frames = new Map(), values = [], scriptWaiters = [];
  let timerId = 0, frameId = 0, time = 0, ended = 0, bodyController, emberDraws = 0;
  const classes = new Set(), attrs = {};
  const counter = { _text: '000', set textContent(value) { this._text = value; values.push(Number(value)); }, get textContent() { return this._text; } };
  const opening = { hidden: false, setAttribute(key, value) { attrs[key] = value; }, classList: { add() {}, remove() {} } };
  const emberContext = { setTransform() {}, clearRect() {}, fillRect() { emberDraws++; } };
  const canvas = { width: 0, height: 0, getContext: () => emberContext };
  const html = { style: {}, classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x) } };
  const body = { classList: { remove() {} }, append(script) {
    scripts.push(script);
    for (const waiter of scriptWaiters) if (script.src.includes(waiter.name)) waiter.resolve(script);
  } };
  const json = new TextEncoder().encode(JSON.stringify({ version: 1, tex: {}, vertexCount: 3 }));
  const mesh = compression === 'gzip' ? new Uint8Array(gzipSync(json)) : json;
  const stream = new ReadableStream({ start(controller) { bodyController = controller; } });
  const context = {
    window: null, document: { documentElement: html, body,
      fonts: { load: () => fonts.promise },
      querySelector: selector => ({ '.opening': opening, '#opening': opening, '#load-count': counter, '#embers': canvas })[selector],
      getElementById: id => ({ opening, 'load-count': counter })[id],
      createElement: () => ({ remove() {} })
    },
    matchMedia: () => ({ matches: reduced }), fetch: () => network.promise,
    Response, Blob, Uint8Array, TextDecoder, AbortController, console: { warn() {} },
    innerWidth: 390, innerHeight: 844, devicePixelRatio: 1,
    requestAnimationFrame: cb => { frames.set(++frameId, cb); return frameId; },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: (cb, ms) => { timers.set(++timerId, { cb, ms }); return timerId; },
    clearTimeout: id => timers.delete(id)
  };
  context.window = context;
  if (compression) context.DecompressionStream = DecompressionStream;
  vm.runInNewContext(read('assets/js/loader.js'), context);
  return {
    context, scripts, timers, counter, opening, attrs, classes, values,
    get ended() { return ended; },
    get emberDraws() { return emberDraws; },
    async firstChunk() {
      const headers = knownSize ? { 'content-length': String(mesh.length) } : {};
      if (compression === 'transparent') headers['content-encoding'] = 'gzip';
      network.resolve(new Response(stream, { headers }));
      bodyController.enqueue(mesh.slice(0, 16)); await tick();
    },
    async finishMesh() { bodyController.enqueue(mesh.slice(16)); bodyController.close(); await tick(); },
    whenScript(name) {
      const existing = scripts.find(s => s.src.includes(name));
      if (existing) return Promise.resolve(existing);
      const waiting = deferred(); scriptWaiters.push({ name, resolve: waiting.resolve }); return waiting.promise;
    },
    async completeScript(name, fail = false) {
      const script = scripts.find(s => s.src.includes(name) && !s.settled);
      assert.ok(script, `Expected pending ${name}`); script.settled = true;
      if (name === 'scene.js') context.LKScene = { whenReady: scene.promise };
      if (name === 'motion.js') context.LKMotion = { endOpening() { ended++; } };
      fail ? script.onerror(Error('Script unavailable')) : script.onload();
      await tick();
    },
    async readyFonts() { fonts.resolve([]); await tick(); },
    async failFonts() { fonts.reject(Error('Font unavailable')); await tick(); },
    async readyScene() { scene.resolve(); await tick(); },
    async flushFrames(limit = 300) {
      for (let i = 0; frames.size && i < limit; i++) {
        const [id, callback] = frames.entries().next().value; frames.delete(id); time += 16; callback(time); await tick();
      }
    },
    async stall() { const latest = [...timers.values()].at(-1); assert.ok(latest); latest.cb(); await tick(); }
  };
}

test('Hero copy and extra actions cannot overlay the scroll sequence', () => {
  assert.equal(/class="hero-summary"/.test(read('index.html')), false);
  assert.equal(/\.hero-summary/.test(read('assets/css/site.css')), false);
  const menu = read('index.html').split('<dialog id="menu"')[1].split('</dialog>')[0];
  assert.ok(menu.includes('href="services/"')); assert.ok(menu.includes('href="about/"'));
});

test('The motion timeline cannot write a time-based fake loading percentage', () => {
  assert.equal(/number\.textContent/.test(read('assets/js/motion.js')), false);
  assert.equal(/elapsed\/2400/.test(read('assets/js/motion.js')), false);
  assert.equal(/loader-seen|lk-number-loader-seen/.test(read('index.html')), false);
});

test('Known-size downloads report real progress and wait for scene, fonts and scripts', async () => {
  const h = loader(); await h.firstChunk();
  await h.flushFrames(4);
  assert.ok(Number(h.counter.textContent) > 0); assert.ok(Number(h.counter.textContent) < 100);
  await h.finishMesh(); await h.completeScript('scene.js');
  assert.equal(h.context.LKLoading.ready, false);
  await h.readyScene();
  assert.equal(h.scripts.some(s => s.src.includes('motion.js')), false, 'Fonts still block readiness');
  await h.readyFonts(); await h.completeScript('motion.js');
  assert.ok(Number(h.counter.textContent) < 100, 'Preview controller is not ready yet');
  await h.completeScript('videos.js');
  assert.equal(h.context.LKLoading.ready, true);
  assert.equal(h.ended, 0, 'Give completed progress a paint before the scene reveal');
  await h.flushFrames(); assert.equal(h.ended, 1);
  assert.equal(h.counter.textContent, '100'); assert.equal(h.attrs['aria-valuenow'], '100');
  assert.ok(h.values.every((v, i, a) => !i || v >= a[i - 1]), 'Progress must never run backwards');
});

test('Unknown download sizes do not invent intermediate byte percentages', async () => {
  const h = loader({ knownSize: false }); await h.firstChunk();
  assert.equal(h.counter.textContent, '000');
  await h.finishMesh(); await h.flushFrames(4); assert.ok(Number(h.counter.textContent) > 0);
  assert.ok(Number(h.counter.textContent) < 100);
});

test('An asset failure opens the readable fallback without claiming 100 percent', async () => {
  const h = loader(); await h.firstChunk(); await h.finishMesh();
  await h.completeScript('scene.js', true);
  assert.equal(h.context.LKLoading.ready, false);
  assert.equal(h.context.LKLoading.state, 'failed');
  assert.ok(Number(h.counter.textContent) < 100);
  assert.equal(h.opening.hidden, true); assert.ok(h.classes.has('motion-fallback'));
});

test('A stalled load recovers instead of counting to completion', async () => {
  const h = loader(); await h.firstChunk(); await h.stall();
  assert.equal(h.context.LKLoading.ready, false);
  assert.ok(Number(h.counter.textContent) < 100); assert.equal(h.opening.hidden, true);
});

test('Reduced motion loads only its required startup tasks', async () => {
  const h = loader({ reduced: true }); await h.readyFonts();
  await h.completeScript('motion.js'); await h.completeScript('videos.js'); await h.flushFrames();
  assert.equal(h.context.LKLoading.ready, true);
  assert.equal(h.scripts.some(s => s.src.includes('scene.js')), false);
});

for (const compression of ['gzip', 'transparent']) test(`${compression} model responses retain the original decoding fallback`, async () => {
  const h = loader({ compression }); await h.firstChunk(); await h.finishMesh();
  await h.whenScript('scene.js');
  assert.equal(h.context.KNIGHT_MESH_B64.version, 1);
  assert.ok(Number(h.counter.textContent) < 100);
});

test('A font failure cannot report successful loading', async () => {
  const h = loader({ reduced: true }); await h.failFonts();
  assert.equal(h.context.LKLoading.state, 'failed');
  assert.ok(Number(h.counter.textContent) < 100);
  assert.equal(h.opening.hidden, true);
});

test('Large real-progress changes are displayed gradually and never run ahead', async () => {
  const h = loader(); await h.flushFrames(3); assert.equal(h.counter.textContent, '000');
  await h.readyFonts();
  assert.equal(h.counter.textContent, '000', 'A completed task must not cause an immediate large numeric jump');
  await h.flushFrames(20);
  assert.ok(Number(h.counter.textContent) > 0);
  assert.ok(h.values.every(value => value <= h.context.LKLoading.progress));
  assert.ok(h.values.every((value, i, values) => !i || value - values[i - 1] <= 3), 'Each 16 ms frame advances by at most a few numbers');
  assert.ok(Number(h.counter.textContent) < 100);
});

test('Amber particles begin while progress is still zero and stop for reduced motion', async () => {
  const h = loader(); await h.flushFrames(1);
  assert.equal(h.counter.textContent, '000'); assert.ok(h.emberDraws > 0);
  const quiet = loader({ reduced: true }); await quiet.flushFrames(1); assert.equal(quiet.emberDraws, 0);
  assert.ok(read('index.html').includes('class="loading-note"'));
});

test('The hero handoff waits for completed progress to be presented', () => {
  const source = read('assets/js/motion.js').match(/  function endOpening\(\)\{[\s\S]*?\n  \}/)[0];
  const context = { root: { LKLoading: { ready: true, presented: false } }, openingDone: false, completedClock: 0, clock: 100, paused: false, openingRevealPending: false };
  vm.runInNewContext(source + '\nendOpening();', context);
  assert.equal(context.openingDone, false);
  context.root.LKLoading.presented = true; context.endOpening();
  assert.equal(context.openingDone, true); assert.equal(context.openingRevealPending, true);
});

test('Reduced motion keeps the loading cover until real progress is complete', () => {
  const source = read('assets/js/motion.js');
  const start = source.indexOf('  // Loading handoff:'), end = source.indexOf('  const set=', start);
  const opening = { hidden: false }, state = { ready: false, presented: false };
  const context = { opening, reduce: { matches: true }, root: { LKLoading: state }, doc: { style: {} }, paused: false, clock: 0 };
  vm.runInNewContext(source.slice(start, end), context);
  context.revealOpening();
  assert.equal(opening.hidden, false, 'Reduced motion must not dismiss the real loading indicator early');
  state.ready = true; state.presented = true;
  context.endOpening(); context.revealOpening();
  assert.equal(opening.hidden, true);
});
