function placeMobileMenu(drop) {
  var header = document.querySelector('header.site-header');
  var top = header ? Math.round(header.getBoundingClientRect().bottom) : 64;
  drop.style.top = Math.max(top, 0) + 'px';
}

function setMobileMenu(open) {
  document.querySelectorAll('.site-navigation-toggle').forEach(function (btn) {
    btn.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('.site-navigation-dropdown').forEach(function (drop) {
    drop.classList.toggle('show', open);
    drop.classList.toggle('fps-open', open);
    drop.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) {
      drop.removeAttribute('inert');
      placeMobileMenu(drop);
    } else {
      drop.setAttribute('inert', '');
    }
  });
}

document.querySelectorAll('.site-navigation-toggle').forEach(function (btn) {
  btn.addEventListener('click', function () {
    setMobileMenu(btn.getAttribute('aria-expanded') !== 'true');
  });
});
document.querySelectorAll('.site-navigation-dropdown a').forEach(function (link) {
  link.addEventListener('click', function () { setMobileMenu(false); });
});
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') setMobileMenu(false);
});
window.addEventListener('resize', function () {
  document.querySelectorAll('.site-navigation-dropdown.fps-open').forEach(placeMobileMenu);
});
document.querySelectorAll('form').forEach(function (form) {
  form.addEventListener('submit', function (event) { event.preventDefault(); });
});
(function () {
  if (!document.currentScript) return;
  var widget = document.createElement('script');
  widget.src = new URL('ask-fps.js', document.currentScript.src).href;
  document.body.appendChild(widget);
})();
function settleAsk() {
  var el = document.querySelector('.ask-fps');
  if (!el) return;
  var narrow = window.matchMedia('(max-width: 900px)').matches;
  var hold = narrow && window.scrollY < 24 && !el.classList.contains('is-open');
  el.classList.toggle('ask-fps-hold', hold);
}
new MutationObserver(settleAsk).observe(document.body, { childList: true });
window.addEventListener('scroll', settleAsk, { passive: true });
settleAsk();
