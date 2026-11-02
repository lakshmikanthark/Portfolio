/* Copies only the public contact address; no visitor data or tracking. */
(() => {
  document.querySelectorAll('[data-copy-email]').forEach(button => {
    const status = button.closest('.email-contact')?.querySelector('[role="status"]');
    if (!status) return;
    button.hidden = false;
    button.addEventListener('click', async () => {
      button.disabled = true;
      status.textContent = '';
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText('lakshmikanthark20@gmail.com');
        status.textContent = 'Email address copied. Paste it into your email app.';
      } catch {
        status.textContent = 'Copy is unavailable here. Select the email address above and copy it manually.';
      } finally {
        button.disabled = false;
      }
    });
  });
})();
