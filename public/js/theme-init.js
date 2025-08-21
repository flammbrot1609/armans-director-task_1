/*! Early theme init: apply saved or system preference before first paint to avoid FOUC */
(function() {
  try {
    var saved = null;
    try { saved = localStorage.getItem('theme'); } catch(_) {}
    var prefersDark = false;
    try { prefersDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); } catch(_) {}
    var dark = saved ? (saved === 'dark') : prefersDark;

    // Hide body until theme class is applied
    var styleEl = document.createElement('style');
    styleEl.setAttribute('data-pre-theme', '');
    styleEl.textContent = 'body{visibility:hidden}';
    document.head.appendChild(styleEl);

    function applyTheme() {
      try {
        var b = document.body;
        if (!b) return;
        if (dark) b.classList.add('dark-theme');
        else b.classList.remove('dark-theme');
      } finally {
        var pre = document.querySelector('style[data-pre-theme]');
        if (pre) pre.remove();
      }
    }

    if (document.body) {
      applyTheme();
    } else {
      // Run as soon as body exists (early, before DOMContentLoaded)
      document.addEventListener('readystatechange', function onrs() {
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
          document.removeEventListener('readystatechange', onrs);
          applyTheme();
        }
      });
    }
  } catch (e) {
    // Fallback: ensure body is not left hidden
    var pre = document.querySelector('style[data-pre-theme]');
    if (pre) pre.remove();
  }
})();
