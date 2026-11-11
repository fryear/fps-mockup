document.querySelectorAll('.site-navigation-toggle').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    document.querySelectorAll('.site-navigation-dropdown').forEach(function (drop) {
      drop.classList.toggle('show', !open);
      drop.classList.toggle('fps-open', !open);
    });
  });
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
