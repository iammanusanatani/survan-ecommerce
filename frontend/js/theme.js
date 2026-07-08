    // ── THEME TOGGLE ──
    function toggleTheme() {
      const isDark = document.body.classList.toggle('light-mode');
      const btn = document.getElementById('theme-toggle');
      btn.innerHTML = isDark
        ? '<i data-lucide="sun" style="width:16px;height:16px"></i>'
        : '<i data-lucide="moon" style="width:16px;height:16px"></i>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      localStorage.setItem('survan_theme', isDark ? 'dark' : 'light');
    }
    // Load saved theme
    (function () {
      const saved = localStorage.getItem('survan_theme');
      if (saved === 'dark') {
        document.body.classList.add('light-mode');
        setTimeout(() => {
          const btn = document.getElementById('theme-toggle');
          if (btn) btn.innerHTML = '<i data-lucide="sun" style="width:16px;height:16px"></i>'; if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 10);
        }, 0);
      }
    })();

