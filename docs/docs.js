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
  if (sidebar && toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      // Optionally, toggle aria-expanded for accessibility
      toggle.setAttribute('aria-expanded', sidebar.classList.contains('open'));
    });
    // Close sidebar when a link is clicked (mobile UX)
    sidebar.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        sidebar.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
});
