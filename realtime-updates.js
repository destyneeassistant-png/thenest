// Keeps The Nest current on static hosting.
// It checks a tiny version file and refreshes when a newer publish is available.
(function () {
    const VERSION_URL = 'app-version.json';
    const STORAGE_KEY = 'nest-active-version';
    const CHECK_INTERVAL_MS = 60 * 1000;
    let currentVersion = localStorage.getItem(STORAGE_KEY);
    let checking = false;

    function cacheBustedUrl() {
        return `${VERSION_URL}?t=${Date.now()}`;
    }

    function showUpdateNotice() {
        if (document.getElementById('nest-update-notice')) return;
        const notice = document.createElement('div');
        notice.id = 'nest-update-notice';
        notice.className = 'update-notice';
        notice.setAttribute('role', 'status');
        notice.innerHTML = '<strong>Updating The Nest…</strong><span>Fresh version found. Reloading now.</span>';
        document.body.appendChild(notice);
    }

    async function checkForUpdate({ reloadOnChange = true } = {}) {
        if (checking) return;
        checking = true;
        try {
            const response = await fetch(cacheBustedUrl(), {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (!response.ok) return;
            const data = await response.json();
            if (!data.version) return;

            if (!currentVersion) {
                currentVersion = data.version;
                localStorage.setItem(STORAGE_KEY, data.version);
                return;
            }

            if (data.version !== currentVersion) {
                localStorage.setItem(STORAGE_KEY, data.version);
                if (reloadOnChange) {
                    showUpdateNotice();
                    window.setTimeout(() => window.location.reload(), 600);
                }
            }
        } catch (error) {
            // Stay quiet if offline or GitHub Pages is briefly unavailable.
            console.debug('Nest update check skipped:', error);
        } finally {
            checking = false;
        }
    }

    function startUpdateChecks() {
        checkForUpdate({ reloadOnChange: false });
        window.setInterval(() => checkForUpdate(), CHECK_INTERVAL_MS);
        window.addEventListener('focus', () => checkForUpdate());
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) checkForUpdate();
        });
        window.addEventListener('online', () => checkForUpdate());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startUpdateChecks);
    } else {
        startUpdateChecks();
    }
})();
