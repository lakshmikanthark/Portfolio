const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/contact.js'), 'utf8');

async function exercise(clipboard) {
  const status = { textContent: '' };
  let click;
  const button = {
    hidden: true,
    disabled: false,
    closest: () => ({ querySelector: () => status }),
    addEventListener: (_, handler) => { click = handler; }
  };
  vm.runInNewContext(source, {
    document: { querySelectorAll: () => [button] },
    navigator: { clipboard }
  });
  assert.equal(button.hidden, false);
  await click();
  assert.equal(button.disabled, false, 'A failed copy must leave the control usable');
  return status.textContent;
}

(async () => {
  let copied;
  const success = await exercise({ writeText: async value => { copied = value; } });
  assert.equal(copied, 'lakshmikanthark20@gmail.com');
  assert.match(success, /Email address copied/);
  assert.match(await exercise(undefined), /copy it manually/);
  assert.match(await exercise({ writeText: async () => { throw new Error('Denied'); } }), /copy it manually/);
  console.log('Public-email copy: success, unavailable API and denied permission checked');
})().catch(error => { console.error(error); process.exitCode = 1; });
