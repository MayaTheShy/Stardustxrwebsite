// Docs loader and sidebar toggle for merged homepage+docs
async function loadDocMerged() {
  const hash = decodeURIComponent(location.hash.slice(1));
  const homepageSections = document.getElementById('homepage-sections');
  const sidebar = document.getElementById('docs-sidebar');
  const docsContentWrap = document.getElementById('docs-content-wrap');
  if (!hash) {
    // Show homepage, hide docs
    if (homepageSections) homepageSections.style.display = '';
    if (sidebar) {
      // Keep sidebar in the DOM but let CSS hide it using the .open state
      // so transitions are possible. Avoid inline display changes that
      // cause layout reflow when the viewport changes.
      sidebar.classList.remove('open');
    }
    if (docsContentWrap) docsContentWrap.style.display = 'none';
    return;
  }
  // Show docs, hide homepage
  if (homepageSections) homepageSections.style.display = 'none';
  if (sidebar) {
    // Ensure the sidebar is visible when loading a doc; rely on CSS to
    // show it (it will be shown when .open gets added from the hamburger)
    sidebar.classList.remove('collapsing');
  }
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
          // Ensure .open is added so mobile overlay rules show the sidebar.
          // We avoid changing inline display and let CSS manage it for
          // predictable transitions.
      } else {
          // When closing while on the homepage, make sure .open is removed so
          // the sidebar is visually hidden and doesn't affect layout.
          if (!location.hash) sidebar.classList.remove('open');
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
          if (!location.hash) sidebar.classList.remove('open');
      }
    });
    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('sidebar-open');
        overlay.classList.remove('active');
          if (!location.hash) sidebar.classList.remove('open');
      });
    }
    // Remove sidebar-open and overlay if window is resized to desktop
    // Track the viewport width to detect when we cross the mobile breakpoint
    // and animate the sidebar collapsing when we go from wide -> narrow.
    let _lastWindowWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) {
        sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
        if (overlay) overlay.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
          if (!location.hash) sidebar.classList.remove('open');
      }

      // Animate collapse when crossing from desktop to mobile. We add a
      // 'collapsing' class which can be used to temporarily style the
      // transition; CSS has a transform/opacity transition on .docs-sidebar.
      const wasWide = _lastWindowWidth > 900;
      const isNowNarrow = window.innerWidth <= 900;
      if (wasWide && isNowNarrow) {
        // Only animate if the sidebar is currently visible.
        try {
          const visible = sidebar && getComputedStyle(sidebar).display !== 'none';
          if (visible) {
            // Prevent the docs/main layout from switching to column during the
            // short collapse animation. This avoids pushing the content down.
            document.body.classList.add('docs-collapsing');
            sidebar.classList.add('collapsing');
            // Keep the docs layout locked while the animation runs.
            document.body.classList.add('docs-collapsing');

            // Wait for the transitionend event so layout changes occur
            // immediately after the visual collapse — no arbitrary timeout
            // to avoid visible delays. Use `once: true` to run only once.
            const tidyUp = (ev) => {
              // Accept transform/opacity transitions only
              if (ev && ev.propertyName && !(ev.propertyName === 'transform' || ev.propertyName === 'opacity')) return;
              sidebar.classList.remove('collapsing');
              document.body.classList.remove('docs-collapsing');
                if (!location.hash) sidebar.classList.remove('open');
            };
            sidebar.addEventListener('transitionend', tidyUp, { once: true });
            // Fallback if transitionend doesn't fire (older browsers / cancel)
            setTimeout(tidyUp, 600);
          }
        } catch (e) { /* ignore computed style errors on some browsers */ }
      }
      _lastWindowWidth = window.innerWidth;
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
