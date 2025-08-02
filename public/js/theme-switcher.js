// Theme Switcher for Dark/Light Mode
(function() {
  const toggleBtn = document.getElementById('theme-toggle');
  const darkIcon = '🌙';
  const lightIcon = '☀️';
  const darkClass = 'dark-mode';

  // Farben als CSS-Variablen in :root und .dark-mode
  function setTheme(isDark) {
    document.documentElement.classList.toggle(darkClass, isDark);
    toggleBtn.textContent = isDark ? lightIcon : darkIcon;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  // Immer Dark Mode als Standard
  function getPreferredTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return true;
  }

  toggleBtn.addEventListener('click', function() {
    setTheme(!document.documentElement.classList.contains(darkClass));
  });

  // Initial setzen
  setTheme(getPreferredTheme());
})();
(function() {
  const toggleBtn = document.getElementById('theme-toggle');
  const darkIcon = '🌙';
  const lightIcon = '☀️';
  const darkClass = 'dark-mode';

  // Farben als CSS-Variablen in :root und .dark-mode
  function setTheme(isDark) {
    document.documentElement.classList.toggle(darkClass, isDark);
    toggleBtn.textContent = isDark ? lightIcon : darkIcon;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  // Systempräferenz berücksichtigen
  function getPreferredTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    // Immer dunkel als Standard
    return true;
  }

  toggleBtn.addEventListener('click', function() {
    setTheme(!document.documentElement.classList.contains(darkClass));
  });

  // Initial setzen
  setTheme(getPreferredTheme());
})();
