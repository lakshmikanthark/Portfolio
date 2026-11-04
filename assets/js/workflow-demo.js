/* Fictional enquiry demonstration. No network requests, storage or message sending. */
(() => {
  const form = document.querySelector('#workflow-form');
  if (!form) return;
  const fields = {
    service: form.querySelector('[name="service"]'),
    contact: form.querySelector('[name="contact"]'),
    timing: form.querySelector('[name="timing"]')
  };
  const output = document.querySelector('#workflow-output');
  const status = document.querySelector('#workflow-status');
  const owner = document.querySelector('#workflow-owner');
  const next = document.querySelector('#workflow-next');
  const steps = document.querySelector('#workflow-steps');
  const draft = document.querySelector('#workflow-draft');

  function render() {
    const website = fields.service.value === 'website';
    const ready = fields.contact.value === 'ready';
    const soon = fields.timing.value === 'this-week';
    const service = website ? 'business website' : 'follow-up workflow';
    const action = ready
      ? (soon ? 'Review the brief and confirm timing this week.' : 'Clarify the brief before agreeing a timeline.')
      : 'Return to the source of the enquiry and obtain contact details.';
    status.textContent = ready ? 'Ready for a human review.' : 'Needs contact details before a reply can be prepared.';
    owner.textContent = 'A named business contact must own the next step.';
    next.textContent = action;
    const items = [
      'Capture the example request: ' + service + '.',
      ready ? 'Required contact detail is available in this scenario.' : 'Stop the reply step because contact detail is missing.',
      'Assign the enquiry to a person rather than leaving it unowned.',
      action,
      ready ? 'Review the draft before sending through an agreed channel.' : 'Resume only after the missing detail has been supplied.'
    ];
    steps.replaceChildren(...items.map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
    draft.textContent = ready
      ? 'EXAMPLE DRAFT FOR REVIEW\n\nSubject: Your ' + service + ' enquiry\n\nThank you for the brief. Please share the current setup and the outcome you want. ' +
        (soon ? 'We will first confirm whether the requested timing is feasible.' : 'We can then discuss a useful scope and timeline.') +
        '\n\nThis fictional draft has not been sent.'
      : 'No reply draft prepared. Contact details are missing in this example.';
    output.hidden = false;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    render();
  });
  document.querySelectorAll('[data-demo-scenario]').forEach(button => {
    button.addEventListener('click', () => {
      const scenario = button.dataset.demoScenario;
      fields.service.value = scenario === 'automation' ? 'automation' : 'website';
      fields.contact.value = scenario === 'missing' ? 'missing' : 'ready';
      fields.timing.value = scenario === 'automation' ? 'exploring' : 'this-week';
      render();
    });
  });
})();

