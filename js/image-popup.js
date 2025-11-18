// Lightweight image popup (lightbox) with event delegation.
(function () {
  const createOverlay = () => {
    const overlay = document.createElement('div');
    overlay.className = 'image-popup-overlay';
  overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.display = 'none';
  overlay.setAttribute('aria-hidden', 'true');

  // window frame to feel like a native window
  const wrap = document.createElement('div');
  wrap.className = 'image-popup-window';

  const header = document.createElement('div');
  header.className = 'image-popup-header';

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

  const spinner = document.createElement('div');
  spinner.className = 'image-popup-spinner';
  spinner.setAttribute('aria-hidden', 'true');

  header.appendChild(close);
  wrap.appendChild(header);
  wrap.appendChild(img);
  wrap.appendChild(caption);
  overlay.appendChild(spinner);
  overlay.appendChild(wrap);
    // Append to the documentElement when possible to reduce chances of
    // being clipped by a stacking context on <body> or other ancestors.
    // Keep the overlay element around but don't permanently append a top-level
    // container that could alter stacking context and break header behaviour.
    // The overlay container will be created and appended on open, and removed
    // on close to avoid persistent DOM changes that affect layout.
    let overlayContainer = null;
    // enforce high z-index with !important to trump other stacking contexts
    overlay.style.setProperty('z-index', '2147483647', 'important');
  // We set z-index later when the overlay is appended so it doesn't affect header

    // sanity check: if overlay is still not the topmost element at viewport center,
    // increment the z-index slightly to try to outrank elements with enormous z-index.
    setTimeout(() => {
      const cx = Math.round(window.innerWidth / 2);
      const cy = Math.round(window.innerHeight / 2);
      const top = document.elementsFromPoint(cx, cy)[0];
      if (top && !overlay.contains(top) && top !== overlay) {
        // Bump z-index until overlay is topmost (safeguarded to avoid infinite loop)
        let current = parseInt(getComputedStyle(overlay).zIndex || '2147483647', 10);
        const max = 9999999999999; // arbitrary large fallback
        while (current < max) {
          current = Math.min(current + 1000, max);
          overlay.style.setProperty('z-index', String(current), 'important');
        overlayContainer && overlayContainer.style.setProperty('z-index', String(current), 'important');
          const t = document.elementsFromPoint(cx, cy)[0];
          if (!t || overlay.contains(t) || t === overlay) break;
        }
      }
    }, 60);

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
      spinner.style.display = '';
      overlay.setAttribute('aria-hidden', 'true');
      try {
        if (overlayContainer && overlay.parentNode === overlayContainer) {
          overlayContainer.removeChild(overlay);
        }
        if (overlayContainer && overlayContainer.parentNode) {
          overlayContainer.parentNode.removeChild(overlayContainer);
        }
        overlayContainer = null;
      } catch (err) { /* ignore */ }
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
    // create an on-demand top-level container so we don't permanently
    // alter the page stacking context (this prevents header layout issues)
    if (!overlayContainer) {
      overlayContainer = document.createElement('div');
      overlayContainer.id = 'stardust-overlay-root';
      overlayContainer.style.position = 'fixed';
      overlayContainer.style.top = '0';
      overlayContainer.style.left = '0';
      overlayContainer.style.width = '100%';
      overlayContainer.style.height = '100%';
      overlayContainer.style.zIndex = '2147483647';
      overlayContainer.style.pointerEvents = 'none';
    }
    if (!overlay.parentNode || overlay.parentNode !== overlayContainer) {
      overlayContainer.appendChild(overlay);
    }
    if (!overlayContainer.parentNode) document.body.appendChild(overlayContainer);
    overlay.style.pointerEvents = 'auto';
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
        // Whether to allow scrolling for very tall images: we hide background scroll
        document.body.style.overflow = 'hidden';
        // Wait a frame then add class so CSS transition runs
        requestAnimationFrame(() => overlay.classList.add('open'));
        document.addEventListener('keydown', escClose);
        // Once the image loads, attempt to display it at native resolution
        // show spinner while the image is loading; hide it on success/failure
        spinner.style.display = 'block';
        img.onload = function () {
          // compute available area for the image with margins
          const margin = 32; // px
          const maxW = Math.max(40, window.innerWidth - margin * 2);
          const maxH = Math.max(40, window.innerHeight - margin * 2);
          const naturalW = img.naturalWidth || img.width;
          const naturalH = img.naturalHeight || img.height;

          // if the image fits within the max area, display at native resolution
          if (naturalW <= maxW && naturalH <= maxH) {
            img.style.width = naturalW + 'px';
            img.style.height = naturalH + 'px';
          } else {
            // else, scale it down preserving aspect ratio
            const scale = Math.min(maxW / naturalW, maxH / naturalH);
            img.style.width = Math.round(naturalW * scale) + 'px';
            img.style.height = Math.round(naturalH * scale) + 'px';
          }

          // if caption is long allow it to wrap; focus close button once the layout stabilizes
          setTimeout(() => {
            try { close.focus(); } catch (err) { /* ignore */ }
          }, 50);
          // hide spinner when ready
          spinner.style.display = 'none';
        };
        img.onerror = function () {
          // ensure spinner hides on error and let user close
          spinner.style.display = 'none';
        };
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
