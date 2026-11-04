const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Execute the shipped enquiry handlers, with browser APIs isolated from sending.
function enquiry({ clipboardFails = false } = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../assets/js/ui.js'), 'utf8');
  const start = source.indexOf('  const enquiryForm =') >= 0
    ? source.indexOf('  const enquiryForm =') : source.indexOf('  function enquiryDraft()');
  const end = source.indexOf('\n  const pointer=', start);
  assert.ok(start >= 0 && end > start, 'Find the real enquiry implementation');
  const handlers = {}, copies = [], drafts = [];
  function field(value, minLength = 0) {
    return { value, minLength, error: '', setCustomValidity(message) { this.error = message; } };
  }
  const fields = {
    name: field('Lakshmikantha', 2), email: field('preview@example.com'),
    organization: field('Example & Co'), message: field('A useful website project brief.', 10),
    reason: { value: 'project', selectedOptions: [{ textContent: 'A project enquiry' }] },
    service: { value: 'automation', selectedOptions: [{ textContent: 'AI & automation' }] }
  };
  const form = {
    elements: fields,
    reportValidity: () => !Object.values(fields).some(f => f.error),
    addEventListener: (type, callback) => { handlers[type] = callback; }
  };
  const status = { dataset: {}, textContent: '' };
  const button = { hidden: true, addEventListener: (_, callback) => { handlers.copy = callback; } };
  const location = { set href(value) { drafts.push(value); } };
  const context = {
    $: selector => ({ '#enquiry-form': form, '#form-status': status, '#copy-enquiry': button })[selector],
    data: { profile: { email: 'lakshmikanthark20@gmail.com' } },
    FormData: class { *[Symbol.iterator]() { for (const [key, f] of Object.entries(fields)) yield [key, f.value]; } },
    navigator: { clipboard: { async writeText(value) { if (clipboardFails) throw Error('Denied'); copies.push(value); } } },
    window: { location }
  };
  vm.runInNewContext(source.slice(start, end), context);
  return {
    fields, status, copies, drafts,
    copy: () => handlers.copy(),
    submit: () => handlers.submit({ preventDefault() {}, currentTarget: form }),
    input: target => handlers.input?.({ target })
  };
}

test('Whitespace-only name cannot produce an email or copied enquiry', async () => {
  const h = enquiry(); h.fields.name.value = '  ';
  await h.copy(); h.submit();
  assert.equal(h.copies.length, 0, 'A blank name must not be copied');
  assert.equal(h.drafts.length, 0, 'A blank name must not open a draft');
  assert.ok(h.fields.name.error);
});

test('Whitespace-only message cannot produce an email or copied enquiry', async () => {
  const h = enquiry(); h.fields.message.value = '          ';
  await h.copy(); h.submit();
  assert.equal(h.copies.length, 0, 'A blank message must not be copied');
  assert.equal(h.drafts.length, 0);
  assert.ok(h.fields.message.error);
});

test('Correcting invalid input recovers and prepares one encoded draft', async () => {
  const h = enquiry(); h.fields.name.value = '  '; await h.copy();
  h.fields.name.value = ' LK '; h.input(h.fields.name);
  h.fields.message.value = ' Explain pricing & scope? '; h.input(h.fields.message);
  h.submit();
  assert.equal(h.drafts.length, 1);
  const url = new URL(h.drafts[0]);
  assert.equal(url.pathname, 'lakshmikanthark20@gmail.com');
  assert.equal(url.searchParams.get('subject'), 'A project enquiry — AI & automation | LK');
  assert.match(url.searchParams.get('body'), /Organization \/ website: Example & Co/);
  assert.match(url.searchParams.get('body'), /Explain pricing & scope\?$/);
  assert.equal(h.status.dataset.state, 'draft');
});

test('A valid enquiry copies successfully without opening or sending an email', async () => {
  const h = enquiry(); await h.copy();
  assert.equal(h.copies.length, 1); assert.equal(h.drafts.length, 0);
  assert.match(h.copies[0], /Name: Lakshmikantha/);
  assert.equal(h.status.dataset.state, 'copied');
});

test('Clipboard denial preserves the enquiry and gives a manual recovery', async () => {
  const h = enquiry({ clipboardFails: true }); await h.copy();
  assert.equal(h.copies.length, 0); assert.equal(h.drafts.length, 0);
  assert.match(h.status.textContent, /details remain in the form/);
  assert.equal(h.fields.message.value, 'A useful website project brief.');
});
