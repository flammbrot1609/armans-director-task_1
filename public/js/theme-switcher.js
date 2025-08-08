// Theme Switcher mit Persistenz und Systempräferenz
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  // Standard: Systempräferenz, außer der Nutzer hat explizit gespeichert
  const shouldBeDark = saved ? saved === 'dark' : prefersDark;
  if (!shouldBeDark) {
    document.body.classList.remove('dark-theme');
  } else {
    document.body.classList.add('dark-theme');
  }

  const updateLabel = () => {
    const isDark = document.body.classList.contains('dark-theme');
    themeToggle.textContent = isDark ? '☀️' : '🌓';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('title', isDark ? 'Helles Theme' : 'Dunkles Theme');
  };

  updateLabel();

  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateLabel();
  });
});
