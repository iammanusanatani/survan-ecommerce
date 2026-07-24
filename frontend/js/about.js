// ════════════════════════════════════════════════════════════
// ABOUT PAGE — scroll reveal, animated counters, FAQ accordion
// ════════════════════════════════════════════════════════════

let _aboutObserversReady = false;
let _aboutCountersAnimated = false;

// FAQ accordion — only one item open at a time within .ab-faq
function toggleAboutFaq(btn) {
  const item = btn.closest('.ab-faq-item');
  const wasOpen = item.classList.contains('open');
  item.parentElement.querySelectorAll('.ab-faq-item.open').forEach(el => {
    el.classList.remove('open');
    el.querySelector('.ab-faq-q').setAttribute('aria-expanded', 'false');
  });
  if (!wasOpen) {
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }
}

// Newsletter (About page has its own input id so it never collides
// with the home page newsletter form)
function subscribeAboutNewsletter() {
  const input = document.getElementById('about-nl-email');
  const email = input.value.trim();
  if (!email || !email.includes('@')) { showToast('Enter a valid email'); return; }
  input.value = '';
  showToast('Subscribed! Welcome to the SURVAN fam.');
}

// Animate a single counter element from 0 to its data-target value
function animateAboutCounter(el) {
  const target = parseInt(el.getAttribute('data-target'), 10) || 0;
  const suffix = el.getAttribute('data-suffix') || '';
  const duration = 1400;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    // ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Sets up IntersectionObservers for scroll-reveal elements, the
// timeline dots, and the statistic counters. Safe to call multiple
// times — guarded so listeners are only attached once per page load.
function initAboutPage() {
  const page = document.getElementById('page-about');
  if (!page || _aboutObserversReady) return;
  _aboutObserversReady = true;

  // Generic reveal-on-scroll for cards, sections, etc.
  const revealItems = page.querySelectorAll('.ab-reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revealItems.forEach(el => revealObserver.observe(el));

  // Timeline dots light up as each item scrolls into view
  const tlItems = page.querySelectorAll('.ab-tl-item');
  const tlObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        tlObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  tlItems.forEach(el => tlObserver.observe(el));

  // Statistic counters animate once, the first time they scroll into view
  const statsBlock = page.querySelector('.ab-stats');
  if (statsBlock) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !_aboutCountersAnimated) {
          _aboutCountersAnimated = true;
          page.querySelectorAll('.ab-counter').forEach(animateAboutCounter);
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    statsObserver.observe(statsBlock);
  }
}

// The About section lives inside the app's single-page shell, so re-run
// setup right after showPage('about') in case DOMContentLoaded already
// fired before the page markup existed in the DOM (it doesn't — it's
// static HTML — but this keeps initAboutPage() idempotent and safe to
// call from showPage() too if ever wired in there).
document.addEventListener('DOMContentLoaded', initAboutPage);
