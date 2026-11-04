const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/motion.js'), 'utf8');
const timeline = {};
vm.runInNewContext(source, { window: timeline });

function controls({ reduced = false, smoothController = true } = {}) {
  const calls = [], cards = Array.from({ length: 4 }, (_, index) => ({
    scrollIntoView(options) { calls.push({ index, ...options }); }
  }));
  const context = { reduce: { matches: reduced }, h: 844, smoothedY: 0,
    byId: new Map(['services', 'work'].map(id => [id, { querySelectorAll: () => cards }])),
    layout: ['services', 'work'].map((id, index) => ({ id, top: 5000 + index * 10000, height: 7000 })),
    holdStop: timeline.LKTimeline.holdStop, measure() {},
    root: { scrollTo(options) { calls.push(options); } }
  };
  if (smoothController) context.root.LKSmoothScroll = { scrollTo: context.root.scrollTo };
  const start = source.indexOf('  function step('), end = source.indexOf('  function artStep(', start);
  vm.runInNewContext(source.slice(start, end), context);
  return { calls, context, select: context.step };
}

test('Every selector immediately lands on the requested card, with its actions enabled', () => {
  const h = controls();
  for (const [section, count] of [['services', 3], ['work', 4]]) {
    const layout = h.context.layout.find(item => item.id === section);
    for (let index = 0; index < count; index++) {
      h.select(section, index, count);
      const call = h.calls.at(-1);
      assert.equal(call.behavior, 'instant', 'Do not glide through unrelated clickable cards');
      assert.equal(h.context.smoothedY, call.top, 'The animation sample must not lag behind the selected scroll position');
      const p = (call.top - layout.top) / (layout.height - h.context.h);
      const state = timeline.LKTimeline.sample(section, p, { width: 390, height: 844 });
      assert.equal(state.cards.q, index);
      assert.equal(state.cards.alpha, 1);
    }
  }
});

test('Rapid project changes finish on the latest selection', () => {
  const h = controls();
  for (const index of [3, 0, 2, 1]) h.select('work', index, 4);
  assert.equal(h.calls.length, 4);
  assert.equal(h.context.smoothedY, h.calls.at(-1).top);
  const layout = h.context.layout.find(item => item.id === 'work');
  const p = (h.context.smoothedY - layout.top) / (layout.height - h.context.h);
  assert.equal(timeline.LKTimeline.sample('work', p).cards.q, 1);
});

test('Selectors retain native scrolling when the smoothing controller is unavailable', () => {
  const h = controls({ smoothController: false });
  h.select('work', 2, 4);
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].behavior, 'instant');
});

test('Reduced motion scrolls the selected static card directly into view', () => {
  const h = controls({ reduced: true });
  h.select('work', 3, 4);
  assert.equal(h.calls[0].index, 3);
  assert.equal(h.calls[0].block, 'center');
  assert.equal(h.calls[0].behavior, 'instant');
});
