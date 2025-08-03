// Theme Switcher (Minimal Skeleton)
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    // Optionally: Save preference to localStorage
  });
});
