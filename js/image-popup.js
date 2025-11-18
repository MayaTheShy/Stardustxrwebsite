// Lightweight image popup (lightbox) with event delegation.
(function () {
  const createOverlay = () => {
    const overlay = document.createElement('div');
    overlay.className = 'image-popup-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.display = 'none';

    const wrap = document.createElement('div');
    wrap.className = 'image-popup-wrap';

    const close = document.createElement('button');
    close.className = 'image-popup-close';
    close.setAttribute('aria-label', 'Close image');
    close.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    const img = document.createElement('img');
    img.className = 'image-popup-img';
    img.alt = '';

    const caption = document.createElement('div');
    caption.className = 'image-popup-caption';
    caption.setAttribute('aria-hidden', 'true');

    wrap.appendChild(img);
    wrap.appendChild(caption);
    overlay.appendChild(wrap);
    overlay.appendChild(close);
    document.body.appendChild(overlay);

    // close overlay when clicking outside the image (on the overlay)
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) closeOverlay();
    });

    close.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closeOverlay();
    });

    function closeOverlay() {
      overlay.classList.remove('open');
      overlay.style.display = 'none';
      document.body.style.overflow = '';
      document.removeEventListener('keydown', escClose);
      img.src = '';
      caption.textContent = '';
    }

    function escClose(e) {
      if (e.key === 'Escape') closeOverlay();
    }

    return {
      overlay,
      img,
      caption,
      open(src, alt, maxWidth) {
        img.src = src;
        img.alt = alt || '';
        caption.textContent = alt || '';
        overlay.style.display = 'flex';
        // Whether to allow scrolling for very tall images: we hide background scroll
        document.body.style.overflow = 'hidden';
        // Wait a frame then add class so CSS transition runs
        requestAnimationFrame(() => overlay.classList.add('open'));
        document.addEventListener('keydown', escClose);
        // move keyboard focus to the close button for accessibility
        close.setAttribute('tabindex', '0');
        try { close.focus(); } catch (err) { /* ignored */ }
      },
    };
  };

  let overlayState;

  function getOverlay() {
    if (!overlayState) overlayState = createOverlay();
    return overlayState;
  }

  function isVisibleImage(img) {
    if (!img || !(img instanceof HTMLImageElement)) return false;
    const classesNoPopup = ['logo'];
    if (classesNoPopup.some((c) => img.classList.contains(c))) return false;
    // don't popup tiny or decorative icons
    if (img.naturalWidth && img.naturalWidth < 80) return false;
    // don't popup images inside nav or footer areas
    if (img.closest('header') || img.closest('footer')) return false;
    // allow images that are already in overlays to avoid recursion
    if (img.closest('.image-popup-overlay')) return false;
    // allow images with explicit .no-popup opt-out
    if (img.classList.contains('no-popup')) return false;
    return true;
  }

  document.addEventListener('click', (e) => {
    const img = e.target.closest('img');
    if (!img) return;
    if (!isVisibleImage(img)) return;

    // Show popup; choose src from data-full or srcset fallback
    const fullsrc = img.getAttribute('data-full') || img.getAttribute('data-src') || img.src;
    const overlay = getOverlay();
    overlay.open(fullsrc, img.alt || img.title || '');

    // prevent link click navigation if wrapped in an anchor
    const anchor = img.closest('a');
    if (anchor && anchor.getAttribute('href')) {
      // If the anchor points to the same src we show, stop navigation
      const href = anchor.getAttribute('href');
      if (href === img.src || href === fullsrc || href === fullsrc.replace(window.location.origin, '')) {
        e.preventDefault();
      }
    }
  });
})();
