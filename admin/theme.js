/* Apply the saved appearance before styles paint, independently of admin data. */
(() => {
  const key = 'pm_admin_theme';
  const root = document.documentElement;
  let theme = 'light';
  try { if (localStorage.getItem(key) === 'dark') theme = 'dark'; } catch (_) {}
  root.dataset.theme = theme;

  function updateButton() {
    const button = document.getElementById('admin-theme-toggle');
    if (!button) return;
    const dark = root.dataset.theme === 'dark';
    button.setAttribute('aria-pressed', String(dark));
    button.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const actions = document.querySelector('.header-actions');
    if (!actions) return;
    const button = document.createElement('button');
    button.id = 'admin-theme-toggle';
    button.type = 'button';
    button.className = 'btn-icon admin-theme-toggle';
    button.setAttribute('aria-label', 'Dark mode');
    button.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/></svg>';
    button.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, root.dataset.theme); } catch (_) {}
      updateButton();
    });
    actions.prepend(button);
    updateButton();
  });

  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    root.dataset.theme = event.newValue === 'dark' ? 'dark' : 'light';
    updateButton();
  });
})();
