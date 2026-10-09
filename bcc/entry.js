(function () {
  'use strict';
  const demo = window.BccDemo;
  const error = document.getElementById('entry-error');
  document.querySelectorAll('[data-user]').forEach(button => {
    button.addEventListener('click', () => {
      const user = demo.user(button.dataset.user);
      if (!user) return;
      try {
        sessionStorage.setItem(demo.SESSION_KEY, user.id);
        window.location.assign('dashboard.html');
      } catch {
        error.textContent = 'Browser session storage is unavailable. Enable site storage to open the demo workspace.';
        error.hidden = false;
      }
    });
  });
})();
