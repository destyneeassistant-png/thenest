(() => {
  const storedTheme = localStorage.getItem('nest-theme-mode');
  document.documentElement.dataset.theme = storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const pages = [
    ['Today', 'dashboard.html'], ['Plan', 'calendar.html'], ['Dissertation', 'dissertation.html'],
    ['Study', 'quiz.html'], ['Library', 'pdf-library.html'], ['Notes', 'notes.html'], ['Settings', 'settings.html']
  ];
  const current = location.pathname.split('/').pop() || 'dashboard.html';
  const links = pages.map(([label, href]) => `<a href="${href}"${current === href ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const header = document.createElement('header');
  header.className = 'nest-header';
  header.innerHTML = `<a class="nest-brand" href="dashboard.html" aria-label="The Nest home"><img src="assets/owl-icon.svg" alt=""><span>The Nest</span></a><nav class="nest-nav" aria-label="Primary navigation">${links}</nav><button class="shell-theme" type="button" aria-label="Toggle color theme">◐</button>`;
  document.body.prepend(header);
  const mobile = document.createElement('nav');
  mobile.className = 'nest-mobile-nav';
  mobile.setAttribute('aria-label', 'Mobile navigation');
  mobile.innerHTML = links;
  document.body.append(mobile);
  header.querySelector('.shell-theme').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('nest-theme-mode', next);
  });
})();
