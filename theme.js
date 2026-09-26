(() => {
  const STORAGE_KEY = 'gaokao-dashboard-theme';
  const root = document.documentElement;

  function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function getSavedTheme() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === 'dark' || value === 'light' ? value : null;
    } catch {
      return null;
    }
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
  }

  function currentTheme() {
    return root.dataset.theme || getSavedTheme() || getSystemTheme();
  }

  function updateButton(button, theme) {
    if (!button) return;
    const dark = theme === 'dark';
    button.textContent = dark ? '☀ 浅色模式' : '☾ 深色模式';
    button.setAttribute('aria-label', dark ? '切换到浅色模式' : '切换到深色模式');
    button.setAttribute('title', dark ? '切换到浅色模式' : '切换到深色模式');
    button.setAttribute('aria-pressed', String(dark));
  }

  const savedTheme = getSavedTheme();
  applyTheme(savedTheme || getSystemTheme());

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('[data-theme-toggle]');
    if (!button) return;

    updateButton(button, currentTheme());

    button.addEventListener('click', () => {
      const nextTheme = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      try {
        localStorage.setItem(STORAGE_KEY, nextTheme);
      } catch {
        // Ignore storage errors; the theme still changes for this session.
      }
      updateButton(button, nextTheme);
    });

    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return;

    const handleSystemThemeChange = (event) => {
      if (getSavedTheme()) return;
      applyTheme(event.matches ? 'dark' : 'light');
      updateButton(button, currentTheme());
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleSystemThemeChange);
    }
  });
})();
