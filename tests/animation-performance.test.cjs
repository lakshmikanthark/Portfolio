const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const directory = path.join(__dirname, '..');
const prior = 'bcbbdf63b05c514b9bd4d4d2bdcb016e97cebbc5';
const compare = process.argv.includes('--compare');
const read = (file, before = false) => before
  ? execFileSync('git', ['show', `${prior}:${file}`], { cwd: directory, encoding: 'utf8' })
  : fs.readFileSync(path.join(directory, file), 'utf8');

function classList() {
  const values = new Set();
  return {
    add: (...items) => items.forEach(item => values.add(item)),
    remove: (...items) => items.forEach(item => values.delete(item)),
    contains: item => values.has(item),
    toggle(item, force) { const on = force ?? !values.has(item); on ? values.add(item) : values.delete(item); }
  };
}

function touchHarness(before = false, { reduced = false, phase = 'home', width = 390 } = {}) {
  const text = read('assets/js/ui.js', before);
  const start = text.lastIndexOf('(() => {', text.indexOf('const root = window;'));
  const end = text.indexOf('\n})();', start) + '\n})();'.length;
  const listeners = new Map(), frames = new Map();
  let nextFrame = 0;
  const html = { style: {}, classList: classList(), scrollHeight: 10000 };
  const context = {
    window: null, Element: class {}, WheelEvent: { DOM_DELTA_LINE: 1, DOM_DELTA_PAGE: 2 },
    document: { documentElement: html, scrollingElement: html, hidden: false, querySelector: () => null, addEventListener() {} },
    innerWidth: width, innerHeight: 844, scrollY: 0, scrollX: 0,
    LKMotion: { inspect: () => ({ phase }) },
    matchMedia: query => ({ matches: query.includes('reduced-motion') ? reduced : query.includes('max-width') ? width < 768 : true, addEventListener() {} }),
    requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
    addEventListener(type, callback, options) { listeners.set(type, { callback, options }); },
    scrollTo(options) { context.scrollY = options.top; },
    getComputedStyle: () => ({ overflowY: 'visible' })
  };
  context.window = context;
  vm.runInNewContext(text.slice(start, end), context);
  let time = 0, prevented = 0;
  function send(type, properties = {}) {
    const event = { touches: [{ clientX: 100, clientY: 700 }], timeStamp: time, cancelable: true, target: null, preventDefault() { prevented++; }, ...properties };
    listeners.get(type)?.callback(event);
  }
  function frame() {
    time += 16.67;
    const pending = frames.entries().next().value;
    if (pending) { frames.delete(pending[0]); pending[1](time); }
    return context.scrollY;
  }
  return { context, listeners, frames, send, frame, get prevented() { return prevented; } };
}

function checkTouch() {
  const after = touchHarness();
  assert.equal(after.listeners.get('touchmove').options.passive, false, 'Original cinematic touch input must remain connected');
  assert.equal(after.listeners.get('touchstart').options.passive, true);
  after.context.LKSmoothScroll.scrollTo({ top: 600 });
  assert.ok(after.frames.size, 'Menu/anchor glide remains available');
  after.send('touchstart');
  assert.equal(after.frames.size, 0, 'A finger interrupts a pending glide');
  after.send('touchmove', { touches: [{ clientX: 100, clientY: 100 }], timeStamp: 16 });
  assert.equal(after.prevented, 1, 'Vertical swipes use the original easing');
  assert.ok(Math.abs(after.context.LKSmoothScroll.targetY - 672) < 1e-9, 'Original compact-phone swipe gain is retained');
  after.frame();
  const beforeRelease = after.context.LKSmoothScroll.targetY;
  after.send('touchend', { touches: [], timeStamp: 32 });
  assert.ok(after.context.LKSmoothScroll.targetY > beforeRelease, 'Release momentum extends the glide');
  assert.ok(after.context.scrollY < after.context.LKSmoothScroll.targetY, 'Scroll progresses over frames');
  for (let i = 0; i < 240 && after.frames.size; i++) after.frame();
  assert.equal(after.frames.size, 0, 'Original easing settles instead of running forever');
  assert.ok(Math.abs(after.context.scrollY - after.context.LKSmoothScroll.targetY) <= 1);

  function gesture(before, phase, width) {
    const harness = touchHarness(before, { phase, width });
    harness.send('touchstart');
    harness.send('touchmove', { touches: [{ clientX: 100, clientY: 100 }], timeStamp: 16 });
    const trace = [harness.frame()];
    harness.send('touchend', { touches: [], timeStamp: 32 });
    for (let i = 0; i < 120; i++) trace.push(harness.frame());
    return trace;
  }
  for (const phase of ['home', 'dispersing', 'brand-fade']) {
    for (const width of [390, 1280]) {
      if (compare) assert.deepEqual(gesture(false, phase, width), gesture(true, phase, width), 'Original touch glide and phase speed must match');
    }
  }
  assert.ok(gesture(false, 'dispersing', 390)[0] < gesture(false, 'home', 390)[0], 'Dispersal remains slower');
  assert.equal(gesture(false, 'brand-fade', 390)[0], gesture(false, 'dispersing', 390)[0]);

  const reversal = touchHarness();
  reversal.context.scrollY = 2000;
  reversal.send('touchstart');
  for (let i = 0; i < 6; i++) reversal.send('touchmove', { touches: [{ clientX: 100, clientY: 100 - i * 500 }], timeStamp: 16 + i * 16 });
  assert.ok(reversal.context.LKSmoothScroll.targetY - reversal.context.scrollY <= 844 * 1.6, 'Repeated swipes retain the queued-travel bound');
  reversal.send('touchmove', { touches: [{ clientX: 100, clientY: 700 }], timeStamp: 128 });
  assert.ok(reversal.context.LKSmoothScroll.targetY < reversal.context.scrollY, 'Reversing direction cancels the old target');
  reversal.send('touchcancel');
  assert.equal(reversal.frames.size, 0);

  const horizontal = touchHarness();
  horizontal.send('touchstart');
  horizontal.send('touchmove', { touches: [{ clientX: 300, clientY: 690 }], timeStamp: 16 });
  assert.equal(horizontal.prevented, 0, 'Horizontal gestures remain native');
  assert.equal(horizontal.frames.size, 0);

  const native = touchHarness();
  const field = new native.context.Element();
  field.closest = () => field;
  native.send('touchstart', { target: field });
  native.send('touchmove', { touches: [{ clientX: 100, clientY: 100 }], timeStamp: 16 });
  assert.equal(native.prevented, 0, 'Native controls keep their own scrolling');
  native.context.document.querySelector = () => ({});
  native.send('touchstart');
  native.send('touchmove', { touches: [{ clientX: 100, clientY: 100 }], timeStamp: 16 });
  assert.equal(native.prevented, 0, 'Open dialogs keep native input');

  const pinch = touchHarness();
  pinch.context.LKSmoothScroll.scrollTo({ top: 600 });
  pinch.send('touchstart', { touches: [{}, {}] });
  assert.equal(pinch.frames.size, 0, 'Pinch interrupts custom scrolling');
  assert.equal(pinch.prevented, 0);

  const wheel = touchHarness();
  wheel.send('wheel', { deltaY: 300, deltaX: 0, deltaMode: 0, ctrlKey: false });
  assert.equal(wheel.prevented, 1, 'Desktop wheel easing remains');
  assert.equal(wheel.context.LKSmoothScroll.targetY, 255);
  wheel.send('pointerdown', { clientX: 389 });
  assert.equal(wheel.frames.size, 0, 'The scrollbar interrupts a glide');

  const reduced = touchHarness(false, { reduced: true });
  reduced.context.LKSmoothScroll.scrollTo({ top: 300 });
  assert.equal(reduced.context.scrollY, 300);
  assert.equal(reduced.frames.size, 0, 'Reduced motion remains immediate');
  reduced.send('touchstart');
  reduced.send('touchmove', { touches: [{ clientX: 100, clientY: 100 }], timeStamp: 16 });
  assert.equal(reduced.prevented, 0);
  return { originalGestureTraces: compare ? '6/6 match across phone and wide touch viewports' : 'not compared', swipeMomentum: 'pass', phaseSpeedLimits: 'pass', queueBoundAndReversal: 'pass', horizontalAndNativeInput: 'pass', pinchAndCancellation: 'pass', desktopWheel: 'pass', anchorInterruption: 'pass', reducedMotion: 'pass' };
}

async function meshHarness(before = false) {
  const text = read('assets/js/scene.js', before);
  const firstEngine = text.slice(0, text.indexOf('})(window);') + '})(window);'.length);
  let queries = 0, lost = false;
  const gl = new Proxy({
    NO_ERROR: 0,
    getParameter() { queries++; return 4096; },
    getShaderParameter: () => true, getProgramParameter: () => true,
    isContextLost: () => lost, getError: () => 0, getExtension: () => null
  }, { get: (target, name) => name in target ? target[name] : name.toUpperCase() === name ? name : () => ({}) });
  const encode = array => Buffer.from(array.buffer).toString('base64');
  const context = {
    window: null, innerWidth: 390, devicePixelRatio: 3,
    atob: value => Buffer.from(value, 'base64').toString('binary'), setTimeout, clearTimeout,
    Image: class {
      naturalWidth = 1;
      set src(value) { Promise.resolve().then(() => this.onload?.()); }
    },
    KnightMath: Object.fromEntries(['perspective', 'lookAt', 'multiply', 'composePivot', 'translation', 'scaling'].map(name => [name, () => new Float32Array(16)])),
    KNIGHT_MESH_B64: {
      positions: encode(new Float32Array(9)), normals: encode(new Int16Array(9)),
      indices: encode(new Uint32Array([0, 1, 2])), vis: encode(new Uint8Array(12)),
      tex: { side: 'side', front: 'front', rear: 'rear' }
    }
  };
  context.window = context;
  vm.runInNewContext(firstEngine, context);
  const canvas = { clientWidth: 390, clientHeight: 844, getContext: () => gl };
  const scene = context.Knight3D.createScene(canvas);
  await scene.ready;
  const state = { fov: 34, eye: [0, 1.5, -7.8], target: [0, 1.5, 0], instances: [{ pos: [0, 0, 0], rot: [0, 0, 0], scale: 1, alpha: 1, intensity: 1 }] };
  for (let frame = 0; frame < 60; frame++) scene.render(state, frame / 60);
  const firstSize = [canvas.width, canvas.height], frameQueries = queries;
  canvas.clientWidth = 844; canvas.clientHeight = 390; scene.resize();
  const resized = [canvas.width, canvas.height];
  lost = true;
  assert.throws(() => scene.render(state, 1), /context unavailable/);
  scene.dispose();
  return { frameQueries, firstSize, resized };
}

function motionHarness(before = false) {
  let reads = 0, nextFrame = 0;
  const geometry = { service: 350, project: 358, width: 390, height: 844 };
  const frames = new Map(), listeners = new Map(), nodes = new Map();
  const element = id => ({
    id, style: { setProperty(name, value) { this[name] = value; } }, classList: classList(),
    querySelectorAll: () => [], setAttribute() {}, offsetTop: 0, offsetHeight: 3000
  });
  const ids = ['home', 'introduction', 'eye', 'services', 'work', 'journey', 'archive-entry', 'archive', 'archive-exit', 'afterhours', 'black-pause', 'finale', 'contact', 'footer'];
  ids.forEach((id, i) => { const node = element(id); node.offsetTop = i * 3000; nodes.set(id, node); });
  for (const id of ['hero-title', 'intro-heading', 'work-heading', 'archive-heading', 'services-track', 'project-track', '.experiment-room', '.play-world', '.services-window']) nodes.set(id, element(id));
  Object.defineProperty(nodes.get('.services-window'), 'clientWidth', { get() { reads++; return geometry.service; } });
  Object.defineProperties(nodes.get('.play-world'), {
    clientWidth: { get() { reads++; return geometry.width; } },
    clientHeight: { get() { reads++; return geometry.height; } }
  });
  const cards = [element('project-a'), element('project-b')];
  cards.forEach((card, i) => Object.defineProperty(card, 'offsetLeft', { get() { reads++; return i * geometry.project; } }));
  const html = { style: {}, classList: classList(), dataset: {} };
  const context = {
    window: null, innerWidth: 390, innerHeight: 844, scrollY: 0, devicePixelRatio: 1,
    location: { hash: '' }, sessionStorage: { getItem: () => 'true' }, performance: { now: () => 0 },
    document: {
      documentElement: html, hidden: false,
      getElementById: id => nodes.get(id) || null, querySelector: selector => nodes.get(selector) || null,
      querySelectorAll: selector => selector === '.project-card' ? cards : [],
      createTreeWalker: () => ({ nextNode: () => false }), addEventListener() {}
    },
    NodeFilter: { SHOW_TEXT: 4 }, CustomEvent: class { constructor(type) { this.type = type; } },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    addEventListener: (name, callback) => listeners.set(name, callback), dispatchEvent() {},
    requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
    LKScene: { render() {}, resize() {}, inspect: () => ({}) }
  };
  context.window = context;
  vm.runInNewContext(read('assets/js/motion.js', before), context);
  function frame(time) {
    const [id, callback] = frames.entries().next().value;
    frames.delete(id); callback(time);
    return JSON.stringify([...nodes].map(([id, node]) => [id, node.style]));
  }
  frame(16);
  reads = 0;
  const snapshots = [];
  for (let i = 1; i <= 60; i++) {
    context.scrollY = i * 650;
    snapshots.push(frame(16 + i * 16));
  }
  const steadyReads = reads;
  geometry.service = 470; geometry.project = 482; geometry.width = 520; geometry.height = 900;
  context.innerWidth = 520; context.innerHeight = 900;
  listeners.get('resize')();
  reads = 0;
  const resized = frame(1008);
  assert.ok(reads > 0, 'Resize must refresh cached geometry');
  if (!before) {
    context.LKSmoothScroll = { scrollTo({ top }) { context.scrollY = top; } };
    context.LKMotion.goTo('journey', 'instant');
    frame(1024);
    assert.equal(context.LKMotion.inspect().section, 'journey', 'Covered navigation must synchronize the scene before the reveal');
  }
  return { steadyReads, snapshots, resized };
}

(async () => {
  const touch = checkTouch();
  const oldMesh = compare ? await meshHarness(true) : null, newMesh = await meshHarness();
  if (oldMesh) {
    assert.deepEqual(newMesh.firstSize, oldMesh.firstSize, 'Render resolution stays unchanged');
    assert.deepEqual(newMesh.resized, oldMesh.resized, 'Orientation resizing stays unchanged');
    assert.equal(oldMesh.frameQueries, 120);
  }
  assert.notDeepEqual(newMesh.firstSize, newMesh.resized, 'Orientation changes update the render surface');
  assert.equal(newMesh.frameQueries, 2);
  const oldMotion = compare ? motionHarness(true) : null, newMotion = motionHarness();
  if (oldMotion) {
    assert.deepEqual(newMotion.snapshots, oldMotion.snapshots, 'Same scroll/clock inputs must retain all sampled visual styles');
    assert.equal(newMotion.resized, oldMotion.resized, 'Layout recalculation must retain the same responsive composition');
  }
  assert.equal(newMotion.steadyReads, 0);
  console.log(JSON.stringify({ touch, graphicsLimitQueriesOver60Frames: { before: oldMesh?.frameQueries ?? 'not compared', after: newMesh.frameQueries }, trackedLayoutReadsOver60Frames: { before: oldMotion?.steadyReads ?? 'not compared', after: newMotion.steadyReads }, sampledStyleParity: compare ? 'pass' : 'not compared', responsiveRecalculation: 'pass', graphicsContextLoss: 'pass', scope: 'Node VM behavior checks; not physical-phone FPS or WebGL visual proof' }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
