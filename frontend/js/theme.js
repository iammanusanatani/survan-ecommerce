// ================================
// LOGO UPDATE
// ================================
function updateLogo() {
    const logo = document.getElementById("site-logo");
    if (!logo) return;

    // Tumhare project me light-mode class = Dark Theme
    if (document.body.classList.contains("light-mode")) {
        logo.src = "assets/images/SV_logo_light.png"; //light
    } else {
        logo.src = "assets/images/SV_logo.png"; // dark
    }
}

// ================================
// THEME TOGGLE
// ================================
function toggleTheme() {

    const isDark = document.body.classList.toggle('light-mode');

    const btn = document.getElementById('theme-toggle');

    btn.innerHTML = isDark
        ? '<i data-lucide="sun" style="width:16px;height:16px"></i>'
        : '<i data-lucide="moon" style="width:16px;height:16px"></i>';

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Change Logo
    updateLogo();

    localStorage.setItem('survan_theme', isDark ? 'dark' : 'light');
}

// ================================
// LOAD SAVED THEME
// ================================
(function () {

    const saved = localStorage.getItem('survan_theme');

    if (saved === 'dark') {

        document.body.classList.add('light-mode');

        const btn = document.getElementById('theme-toggle');

        if (btn) {
            btn.innerHTML = '<i data-lucide="sun" style="width:16px;height:16px"></i>';
        }

        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 10);
        }
    }

    // Set Logo on Page Load
    updateLogo();

})();