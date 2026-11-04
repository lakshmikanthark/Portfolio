const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const fields = {
  service: { value: 'website' },
  contact: { value: 'ready' },
  timing: { value: 'this-week' }
};
let submit;
const form = {
  querySelector: selector => fields[selector.match(/name="([^"]+)"/)[1]],
  addEventListener: (name, handler) => { if (name === 'submit') submit = handler; }
};
const elements = Object.fromEntries(['output', 'status', 'owner', 'next', 'steps', 'draft'].map(key => [key, {
  hidden: true,
  textContent: '',
  replaceChildren(...children) { this.children = children; }
}]));
const scenarios = ['website', 'missing', 'automation'].map(name => ({
  dataset: { demoScenario: name },
  addEventListener(event, handler) { this.click = handler; }
}));
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/js/workflow-demo.js'), 'utf8'), {
  document: {
    querySelector: selector => selector === '#workflow-form' ? form : elements[selector.replace('#workflow-', '')],
    querySelectorAll: () => scenarios,
    createElement: () => ({ textContent: '' })
  }
});
let prevented = false;
submit({ preventDefault() { prevented = true; } });
assert.equal(prevented, true);
assert.equal(elements.output.hidden, false);
assert.match(elements.draft.textContent, /business website/);
assert.match(elements.next.textContent, /this week/);
assert.equal(elements.steps.children.length, 5);

scenarios[1].click();
assert.match(elements.status.textContent, /Needs contact details/);
assert.match(elements.draft.textContent, /No reply draft prepared/);
assert.match(elements.next.textContent, /obtain contact details/);

scenarios[2].click();
assert.match(elements.draft.textContent, /follow-up workflow/);
assert.match(elements.next.textContent, /Clarify the brief/);
assert.match(elements.status.textContent, /Ready for a human review/);
assert.equal(elements.steps.children.some(item => !item.textContent), false);
console.log('Workflow demo: complete request, missing contact, changed service and timing, and recovery checked');

