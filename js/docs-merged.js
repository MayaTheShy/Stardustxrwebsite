// Docs loader and sidebar toggle for merged homepage+docs
async function loadDocMerged() {
  const hash = decodeURIComponent(location.hash.slice(1));
  const homepageSections = document.getElementById('homepage-sections');
  const sidebar = document.getElementById('docs-sidebar');
  const docsContentWrap = document.getElementById('docs-content-wrap');
  if (!hash) {
    // Show homepage, hide docs
    if (homepageSections) homepageSections.style.display = '';
    if (sidebar) sidebar.style.display = 'none';
    if (docsContentWrap) docsContentWrap.style.display = 'none';
    return;
  }
  // Show docs, hide homepage
  if (homepageSections) homepageSections.style.display = 'none';
  if (sidebar) sidebar.style.display = '';
  if (docsContentWrap) docsContentWrap.style.display = '';
  const file = 'docs/' + hash + '.md';
  const container = document.getElementById('content');
  if (!container) return;
  try {
    const res = await fetch(file);
    if (!res.ok) {
      container.textContent = 'Document not found.';
      return;
    }
    let text = await res.text();
    text = text.replace(/^---[\s\S]*?---\n/, '');
    container.innerHTML = marked.parse(text);
  } catch (e) {
    container.textContent = 'Error loading document.';
  }
}
window.addEventListener('hashchange', loadDocMerged);
window.addEventListener('load', loadDocMerged);

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

    // Move social links from the header into the sidebar on small screens
    const headerSocials = Array.from(document.querySelectorAll('.nav-right a.nav-icon, .nav-right a.nav-text'));
    let sidebarSocials = sidebar.querySelector('.sidebar-socials');
    if (!sidebarSocials) {
      sidebarSocials = document.createElement('div');
      sidebarSocials.className = 'sidebar-socials';
      // Insert it right after the <h2> heading inside the sidebar
      const heading = sidebar.querySelector('h2');
      if (heading && heading.parentNode) heading.insertAdjacentElement('afterend', sidebarSocials);
      else sidebar.appendChild(sidebarSocials);
    }

    function syncSocialsToSidebar() {
      // create clones on mobile, remove clones on desktop
  if (window.innerWidth <= 900) {
        // only add if sidebarSocials is empty
        sidebarSocials.innerHTML = '';
        headerSocials.forEach((el) => {
          const clone = el.cloneNode(true);
          clone.setAttribute('data-cloned', 'true');
          // ensure the cloned link opens in a new tab like the original
          sidebarSocials.appendChild(clone);
        });
        // Hide header icons from assistive tech to avoid duplicates in mobile menu
        headerSocials.forEach((el) => el.setAttribute('aria-hidden', 'true'));
      } else {
        if (sidebarSocials) sidebarSocials.innerHTML = '';
        // Make header icons accessible again on desktop
        headerSocials.forEach((el) => el.removeAttribute('aria-hidden'));
      }
    }

    // run once now and on resize so the layout updates with viewport changes
    syncSocialsToSidebar();
    window.addEventListener('resize', syncSocialsToSidebar);
  }
  // Hide the tagline when it would wrap to more than one line
  const tagline = document.querySelector('.tagline');
  function updateTagline() {
    if (!tagline) return;
    // getClientRects length > 1 means it rendered on multiple lines
    const rects = tagline.getClientRects();
    const wrapped = rects && rects.length > 1;
    if (wrapped) {
      tagline.classList.add('tagline-hidden');
      tagline.setAttribute('aria-hidden', 'true');
    } else {
      tagline.classList.remove('tagline-hidden');
      tagline.removeAttribute('aria-hidden');
    }
  }
  // Run on load and on resize; also use ResizeObserver if available for better accuracy
  updateTagline();
  window.addEventListener('resize', updateTagline);
  if (window.ResizeObserver) {
    try {
      new ResizeObserver(updateTagline).observe(document.querySelector('.header-content'));
    } catch (e) { /* ignore, fall back to resize event */ }
  }
});
