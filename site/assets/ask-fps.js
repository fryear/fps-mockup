// Demo assistant. Reads a local JSON file and matches keywords in the browser.
// It does not call an API, and it does not store the question.
(function () {
  var script = document.currentScript;
  var here = new URL('./', script.src);
  var site = new URL('../', script.src);

  function siteHref(path) {
    return new URL(path, site).href;
  }

  function answerQuestion(knowledge, query) {
    var text = String(query || '').toLowerCase();
    var best = null;
    var bestScore = 0;
    (knowledge.entries || []).forEach(function (entry) {
      var score = 0;
      (entry.keywords || []).forEach(function (word) {
        if (text.indexOf(String(word).toLowerCase()) !== -1) score += String(word).length;
      });
      if (score > bestScore) {
        best = entry;
        bestScore = score;
      }
    });
    if (!best) return { text: knowledge.fallback.text, links: knowledge.fallback.links, id: 'fallback' };
    return { text: best.text, links: best.links, id: best.id };
  }

  globalThis.answerAskFps = answerQuestion;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function mount(knowledge) {
    if (document.getElementById('ask-fps')) return;
    var root = el('div', 'ask-fps');
    root.id = 'ask-fps';

    var launcher = el('button', 'ask-fps-launcher', 'Ask FPS');
    launcher.type = 'button';
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-controls', 'ask-fps-panel');

    var panel = el('section', 'ask-fps-panel');
    panel.id = 'ask-fps-panel';
    panel.hidden = true;

    var head = el('div', 'ask-fps-head');
    var titles = el('div');
    titles.append(el('strong', null, knowledge.title || 'Ask FPS'));
    titles.append(el('span', 'ask-fps-badge', knowledge.badge || 'Demo, preview only'));
    var close = el('button', 'ask-fps-close', '\u00d7');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    head.append(titles, close);

    var log = el('div', 'ask-fps-log');
    log.setAttribute('aria-live', 'polite');
    var intro = el('p', 'ask-fps-msg', knowledge.intro);
    log.append(intro);

    var form = el('form', 'ask-fps-form');
    form.setAttribute('action', '#');
    var input = document.createElement('input');
    input.type = 'text';
    input.name = 'ask';
    input.autocomplete = 'off';
    input.placeholder = 'Ask about selling, buying, or the scorecard';
    input.setAttribute('aria-label', 'Your question');
    var send = el('button', 'ask-fps-send', 'Send');
    send.type = 'submit';
    form.append(input, send);

    var note = el('p', 'ask-fps-note', knowledge.agentNote);
    panel.append(head, log, form, note);
    root.append(launcher, panel);
    document.body.append(root);

    function addMessage(className, text, links) {
      var msg = el('p', 'ask-fps-msg ' + className, text);
      if (links && links.length) {
        var row = el('p', 'ask-fps-links');
        links.forEach(function (key) {
          var item = knowledge.links && knowledge.links[key];
          if (!item) return;
          var a = document.createElement('a');
          a.href = siteHref(item.path);
          a.textContent = item.label;
          row.append(a);
        });
        log.append(msg, row);
      } else {
        log.append(msg);
      }
      log.scrollTop = log.scrollHeight;
    }

    function ask(query) {
      var clean = String(query || '').trim();
      if (!clean) return;
      addMessage('is-user', clean);
      var result = answerQuestion(knowledge, clean);
      addMessage('is-bot', result.text, result.links);
      input.value = '';
    }

    function isOpen() {
      return root.classList.contains('is-open');
    }

    function setOpen(open) {
      root.classList.toggle('is-open', open);
      panel.hidden = !open;
      launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        input.focus();
      } else {
        launcher.focus();
      }
    }

    launcher.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(!isOpen());
    });
    close.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    });
    document.addEventListener('keydown', function (event) {
      if ((event.key === 'Escape' || event.key === 'Esc') && isOpen()) {
        event.preventDefault();
        setOpen(false);
      }
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();
      ask(input.value);
    });
  }

  fetch(new URL('ask-fps.json', here))
    .then(function (response) { return response.json(); })
    .then(mount)
    .catch(function () {
      mount({
        title: 'Ask FPS',
        badge: 'Demo, preview only',
        intro: 'The answer file did not load. You can still use the scorecard, listings, or the contact page.',
        agentNote: 'This demo does not connect to ChatGPT.',
        entries: [],
        fallback: { text: 'Try the free scorecard, the listings, or talk to Karl.', links: ['scorecard', 'listings', 'contact'] },
        links: {
          scorecard: { label: 'Free scorecard', path: 'scorecard/' },
          listings: { label: 'Current listings', path: 'listings/' },
          contact: { label: 'Talk to Karl', path: 'contact/' }
        }
      });
    });
})();
