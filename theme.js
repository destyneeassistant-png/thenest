// Global theme switcher for The Nest
// Keeps the Black Cosmic Library / galaxy theme, with a white "light mode" option.
(function () {
    const STORAGE_KEY = 'nest-theme-mode';
    const root = document.documentElement;

    function getPreferredMode() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
        return 'dark';
    }

    function setTheme(mode) {
        const nextMode = mode === 'light' ? 'light' : 'dark';
        root.dataset.theme = nextMode;
        localStorage.setItem(STORAGE_KEY, nextMode);
        document.querySelector('meta[name="theme-color"]')?.setAttribute(
            'content',
            nextMode === 'light' ? '#fff9ff' : '#05050d'
        );
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            const isLight = nextMode === 'light';
            toggle.innerHTML = isLight
                ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 14.6A8.4 8.4 0 0 1 9.4 3a7.2 7.2 0 1 0 11.6 11.6Z" fill="currentColor"/></svg>'
                : '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.4" fill="currentColor"/><path d="M12 1.8v3M12 19.2v3M4.8 4.8l2.1 2.1M17.1 17.1l2.1 2.1M1.8 12h3M19.2 12h3M4.8 19.2l2.1-2.1M17.1 6.9l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
            toggle.setAttribute('aria-label', isLight ? 'Switch to dark galaxy mode' : 'Switch to light galaxy mode');
            toggle.title = isLight ? 'Switch to dark galaxy mode' : 'Switch to light galaxy mode';
        }
        window.dispatchEvent(new CustomEvent('nest-theme-change', { detail: { mode: nextMode } }));
    }

    function addToggle() {
        if (document.getElementById('theme-toggle')) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'theme-toggle';
        button.className = 'theme-toggle';
        button.addEventListener('click', () => {
            setTheme(root.dataset.theme === 'light' ? 'dark' : 'light');
        });
        document.body.appendChild(button);
    }

    setTheme(getPreferredMode());

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            addToggle();
            setTheme(root.dataset.theme || getPreferredMode());
        });
    } else {
        addToggle();
        setTheme(root.dataset.theme || getPreferredMode());
    }
})();
