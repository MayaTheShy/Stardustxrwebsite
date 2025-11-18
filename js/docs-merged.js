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
  // Remove any previous commit panel so it doesn't persist between pages.
  document.querySelectorAll('.doc-commit-panel').forEach((el) => el.remove());
  try {
    const res = await fetch(file);
    if (!res.ok) {
      container.textContent = 'Document not found.';
      return;
    }
    let text = await res.text();
    text = text.replace(/^---[\s\S]*?---\n/, '');
    container.innerHTML = marked.parse(text);
    // Try to load commit info and show a small panel under the doc content.
    (async function showCommitInfo() {
      try {
        const res = await fetch('docs/commit-info.json');
        if (!res.ok) return;
        const map = await res.json();
  const info = map[file];
        if (!info) return;
        // Small HTML panel that shows author & date and a neat hover for the commit message
        const panel = document.createElement('div');
        panel.className = 'doc-commit-panel';
        const author = document.createElement('span');
        author.className = 'commit-by';
        // use data-message so a CSS pseudo-element can display it on hover
        author.setAttribute('data-message', escapeHtml(info.message || ''));
        author.setAttribute('tabindex', '0');
        author.textContent = info.author || 'Unknown';

        const when = document.createElement('span');
        when.className = 'commit-when';
        // Use toLocaleString for nicer formatting in the user's timezone
        try {
          when.textContent = new Date(info.date).toLocaleString();
        } catch (e) { when.textContent = info.date || ''; }

        panel.appendChild(document.createTextNode('Last updated: '));
        panel.appendChild(author);
        panel.appendChild(document.createTextNode(' '));
        panel.appendChild(when);

        // Also include a link to the commit if the repo url is provided.
        if (map.__repo__) {
          const a = document.createElement('a');
          a.href = (map.__repo__.replace(/\/$/, '')) + '/commit/' + info.sha;
          a.textContent = 'View commit';
          a.target = '_blank';
          a.rel = 'noopener';
          a.className = 'commit-link';
          a.style.marginLeft = '0.6rem';
          panel.appendChild(a);
        }

        // Append the panel right after the content.
        const wrap = document.getElementById('docs-content-wrap');
        if (wrap) wrap.appendChild(panel);
      } catch (e) { /* ignore commit info errors */ }
    })();
  } catch (e) {
    container.textContent = 'Error loading document.';
  }
}

// Basic escaping for data attributes / text content when inserting into DOM
function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
      // Toggle open state on the sidebar. On the homepage the sidebar is
      // hidden via an inline `display: none` (set by loadDocMerged). When
      // the user clicks the hamburger we should clear that inline value so
      // the overlay can be shown. When closing, re-hide the sidebar only if
      // no docs are loaded (location.hash is empty) so we don't interfere
      // with the normal docs view.
      const nowOpen = sidebar.classList.toggle('open');
      if (nowOpen) {
        // Remove any inline 'display: none' (set by loadDocMerged) so the CSS
        // overlay can take effect (body.sidebar-open rules). This shows the
        // sidebar even while on the homepage.
        try { sidebar.style.display = ''; } catch (e) { /* ignore */ }
      } else {
        // When closing while on the homepage, hide it again so the docs
        // panel doesn't take space if the user opens it from the header.
        if (!location.hash) sidebar.style.display = 'none';
      }
      toggle.setAttribute('aria-expanded', nowOpen);
      document.body.classList.toggle('sidebar-open', nowOpen);
      if (overlay) overlay.classList.toggle('active', nowOpen);
    });
    // Close sidebar when a link is clicked (mobile UX)
    sidebar.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        sidebar.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('sidebar-open');
        if (overlay) overlay.classList.remove('active');
        // When the user clicks a link from the homepage, hide the docs
        // panel again so the content returns to the homepage view.
        if (!location.hash) sidebar.style.display = 'none';
      }
    });
    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('sidebar-open');
        overlay.classList.remove('active');
        if (!location.hash) sidebar.style.display = 'none';
      });
    }
    // Remove sidebar-open and overlay if window is resized to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) {
        sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
        if (overlay) overlay.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        if (!location.hash) sidebar.style.display = 'none';
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
        // Place the socials above the heading so the hamburger shows them
        // at the top of the overlay. Add a distinguishing class so CSS can
        // style the placement differently (border-bottom instead of border-top).
        if (heading && heading.parentNode) {
          heading.insertAdjacentElement('beforebegin', sidebarSocials);
          sidebarSocials.classList.add('placed-above-heading');
        }
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
