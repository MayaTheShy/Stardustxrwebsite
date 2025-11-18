async function loadDoc() {
  const hash = decodeURIComponent(location.hash.slice(1)) || '01-get-started/01-What-is-Stardust';
  const file = hash + '.md';
  const res = await fetch(file);
  const container = document.getElementById('content');
  if (!res.ok) {
    container.textContent = 'Document not found.';
    return;
  }
  let text = await res.text();
  text = text.replace(/^---[\s\S]*?---\n/, '');
  container.innerHTML = marked.parse(text);
}
window.addEventListener('hashchange', loadDoc);
window.addEventListener('load', loadDoc);

// Sidebar hamburger menu toggle for mobile
window.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('docs-sidebar');
  const toggle = document.getElementById('sidebar-toggle');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar && toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      const isOpen = sidebar.classList.contains('open');
      toggle.setAttribute('aria-expanded', isOpen);
      document.body.classList.toggle('sidebar-open', isOpen);
      if (overlay) overlay.classList.toggle('active', isOpen);
    });
    // Close sidebar when a link is clicked (mobile UX)
    sidebar.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        sidebar.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('sidebar-open');
        if (overlay) overlay.classList.remove('active');
      }
    });
    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('sidebar-open');
        overlay.classList.remove('active');
      });
    }

    // Remove sidebar-open and overlay if window is resized to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) {
        sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
        if (overlay) overlay.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
});
