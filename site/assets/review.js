(function () {
  var KEY = 'fps-review';

  function wanted() {
    var params = new URLSearchParams(location.search);
    if (params.get('review') === 'off') {
      localStorage.setItem(KEY, 'off');
      return false;
    }
    if (params.get('review') === 'on') {
      localStorage.setItem(KEY, 'on');
      return true;
    }
    return localStorage.getItem(KEY) !== 'off';
  }

  function items() {
    return Array.prototype.slice.call(document.querySelectorAll('.wip'));
  }

  function tagFor(el) {
    var kind = el.getAttribute('data-type') === 'gap' ? 'GAP' : 'DECISION';
    var num = (el.id || '').replace('wip-', '');
    return kind + ' #' + num + ' · ' + (el.getAttribute('data-owner') || '');
  }

  function setTags(on) {
    items().forEach(function (el) {
      var tag = el.querySelector(':scope > .wip-tag');
      if (on) {
        if (!tag) {
          tag = document.createElement('span');
          tag.className = 'wip-tag';
          el.insertBefore(tag, el.firstChild);
        }
        tag.textContent = tagFor(el) + ' ';
      } else if (tag) {
        tag.remove();
      }
    });
  }

  function apply(on) {
    document.body.classList.toggle('fps-review-on', on);
    setTags(on);
    var btn = document.querySelector('.fps-review-btn');
    if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function panelList(panel) {
    var list = panel.querySelector('ol');
    list.textContent = '';
    var found = items();
    if (!found.length) {
      var empty = document.createElement('li');
      empty.textContent = 'No flags on this page.';
      list.appendChild(empty);
      return;
    }
    found.forEach(function (el) {
      var li = document.createElement('li');
      var kind = document.createElement('div');
      kind.className = 'wip-kind';
      kind.textContent = tagFor(el);
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = el.getAttribute('data-item') || el.textContent.trim().slice(0, 80);
      button.addEventListener('click', function () {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.remove('fps-wip-pulse');
        void el.offsetWidth;
        el.classList.add('fps-wip-pulse');
      });
      li.append(kind, button);
      list.appendChild(li);
    });
  }

  function boot() {
    var on = wanted();
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fps-review-btn';
    btn.textContent = 'Review';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    var panel = document.createElement('div');
    panel.className = 'fps-review-panel';
    panel.hidden = true;
    panel.innerHTML = '<h2>Flags on this page</h2><ol></ol>';
    btn.addEventListener('click', function () {
      on = !on;
      localStorage.setItem(KEY, on ? 'on' : 'off');
      apply(on);
      panel.hidden = !on;
      if (on) panelList(panel);
    });
    document.body.append(panel, btn);
    apply(on);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
