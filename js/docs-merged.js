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
  // Debounced, tolerant tagline toggling: prevents flicker caused by tiny
  // layout shifts during resize by requiring short stability and using a threshold.
  let _taglineDebounce = null;
  let _pendingTaglineState = null;
  let _lastAppliedTaglineState = null;
  function updateTagline() {
    if (!tagline) return;
    // If the tagline itself wraps to multiple lines, or it gets pushed
    // down below the logo/title (which happens when there isn't room
    // for the tagline to be on the same row), hide it.
    const rects = tagline.getClientRects();
    const wrapped = rects && rects.length > 1;

    // Prefer width-based detection: measure if the tagline's required width
    // plus the logo and nav widths would fit in the header. This avoids
    // flipping when the tagline gets moved out of the flow by CSS.
    let pushedDown = false;
    try {
      const header = document.querySelector('.header-content');
      const logo = document.querySelector('.logo-container');
      const nav = document.querySelector('.nav-right');
      if (header && logo && nav) {
        const headerWidth = header.clientWidth;
        const logoWidth = logo.offsetWidth;
        const navWidth = nav.offsetWidth;
      const gap = 28; // conservatively account for flex gap & padding
        // add a small buffer so we hide the tagline before it has to wrap;
        // this prevents the header content from landing in a two-line state
        // where the title and tagline share the header but look awkward.
      const buffer = Math.max(36, Math.round(headerWidth * 0.06));
        // Use scrollWidth to get the natural width the tagline needs
        const tagNeeded = tagline.scrollWidth;
  pushedDown = (logoWidth + tagNeeded + navWidth + gap + buffer) > headerWidth;
      }
    } catch (e) {
      pushedDown = false;
    }

  const shouldHide = wrapped || pushedDown;

    // Avoid toggling repeatedly for tiny layout changes. Only change after
    // the state is stable for a short period.
    // If we already have the same desired state scheduled, bail.
    if (shouldHide === _pendingTaglineState) return;
    _pendingTaglineState = shouldHide;
    // schedule the real toggling so quick layout flashes don't cause flicker
  if (_taglineDebounce) clearTimeout(_taglineDebounce);
  _taglineDebounce = setTimeout(() => {
      const hide = _pendingTaglineState;
      if (hide) {
        tagline.classList.add('tagline-hidden');
        tagline.setAttribute('aria-hidden', 'true');
      } else {
        tagline.classList.remove('tagline-hidden');
        tagline.removeAttribute('aria-hidden');
      }
      _lastAppliedTaglineState = hide;
      _taglineDebounce = null;
  }, 200);
  }
  // Run on load and on resize; also use ResizeObserver when available.
  updateTagline();
  window.addEventListener('resize', updateTagline);
  if (window.ResizeObserver) {
    try {
  new ResizeObserver(updateTagline).observe(document.querySelector('.header-content'));
    } catch (e) { /* ignore, fall back to resize event */ }
  }
});
