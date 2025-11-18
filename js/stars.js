// Stars and Shooting Stars
// Inspired by semdeck CodePen: https://codepen.io/semdeck/pen/abQBwKN

(function() {
  // Use a CSS property as the primary way to tune density; fallback to 120
  const cssCount = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--star-count'), 10);
  const STAR_COUNT = Number.isFinite(cssCount) && cssCount > 0 ? cssCount : 120;
  const STAR_CONTAINER_ID = 'stars';
  const SHOOT_INTERVAL = 8000; // ms

  function createStar(el) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 1.6 + 0.4; // 0.4 - 2.0px
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.opacity = String(Math.random() * 0.85 + 0.15);
    // randomize animation duration to stagger twinkle
    star.style.animationDuration = `${Math.random() * 6 + 4}s`;
    el.appendChild(star);
  }

  function createShootingStar(el) {
    const shooting = document.createElement('div');
    shooting.className = 'shooting-star';
    // random start position along top half of screen
    const startY = Math.random() * 40 + 5; // 5 - 45% from top
    const startX = Math.random() * 100; // anywhere across width
    shooting.style.top = `${startY}%`;
    shooting.style.left = `${startX}%`;
    // randomly flip direction left-to-right vs right-to-left
    if (Math.random() < 0.5) shooting.classList.add('shooting-star--reverse');

    // remove after animation
    shooting.addEventListener('animationend', () => {
      shooting.remove();
    });

    el.appendChild(shooting);
  }

  function initStars() {
    const container = document.getElementById(STAR_CONTAINER_ID);
    if (!container) return;

    // clear any existing
    container.innerHTML = '';

    for (let i = 0; i < STAR_COUNT; i++) createStar(container);

    // Shooting stars on interval, but respect reduced motion
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // create one immediately for visual feedback
      createShootingStar(container);
      setInterval(() => createShootingStar(container), SHOOT_INTERVAL + Math.random() * 4000);
    }
  }

  document.addEventListener('DOMContentLoaded', initStars);
})();
