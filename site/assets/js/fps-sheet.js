(function () {
  var INQUIRY_FIELDS = [
    ['name', 'Name'],
    ['email', 'Email'],
    ['phone', 'Phone'],
    ['practice', 'Practice / City'],
    ['state', 'State'],
    ['topic', 'Topic'],
    ['message', 'Message']
  ];

  function fieldValue(form, name) {
    var el = form.elements[name];
    if (!el) return '';
    return String(el.value || '').trim();
  }

  function add(payload, key, value) {
    if (value) payload[key] = value;
  }

  function textOf(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function optionText(id) {
    var el = document.getElementById(id);
    if (!el || !el.value || el.selectedIndex < 0) return '';
    return String(el.options[el.selectedIndex].text || '').trim();
  }

  function choiceLabel(name) {
    var input = document.querySelector('input[name="' + name + '"]:checked');
    if (!input) return '';
    var label = document.querySelector('label[for="' + input.id + '"]');
    return label ? label.textContent.trim() : input.value;
  }

  // One id per Scorecard visit, so "Book a call" and "Email me my Seller Scorecard" update the SAME row.
  var ID_KEY = 'fpsScorecardId';
  function submissionId() {
    var id = '';
    try { id = sessionStorage.getItem(ID_KEY) || ''; } catch (e) {}
    if (!/^sc-[0-9a-f]{16}$/.test(id)) {
      var b = new Uint8Array(8);
      (window.crypto || window.msCrypto).getRandomValues(b);
      id = 'sc-' + Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      try { sessionStorage.setItem(ID_KEY, id); } catch (e) {}
    }
    return id;
  }
  window.fpsNewScorecardId = function () { try { sessionStorage.removeItem(ID_KEY); } catch (e) {} };

  function send(payload) {
    var endpoint = window.FPS_SHEET_ENDPOINT;
    if (!endpoint) {
      console.info('FPS sheet endpoint is empty. Nothing was sent.');
      return Promise.resolve();
    }
    return fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).catch(function (error) {
      console.info('FPS sheet request did not complete.', error);
    });
  }

  function thank(form) {
    form.hidden = true;
    var note = document.getElementById(form.getAttribute('data-thanks'));
    if (note) note.hidden = false;
  }

  function inquiryPayload(form) {
    var payload = { type: 'inquiry', 'Source page': location.pathname };
    INQUIRY_FIELDS.forEach(function (pair) {
      add(payload, pair[1], fieldValue(form, pair[0]));
    });
    add(payload, 'county', fieldValue(form, 'county'));
    add(payload, 'yearsToSale', fieldValue(form, 'years'));
    return payload;
  }

  function scorecardPayload(form) {
    var payload = { type: 'scorecard', submission_id: submissionId() };
    INQUIRY_FIELDS.forEach(function (pair) {
      if (pair[0] === 'topic' || pair[0] === 'message') return;
      add(payload, pair[1], fieldValue(form, pair[0]));
    });
    var score = document.getElementById('score-value');
    if (score && /^\d+$/.test(score.textContent.trim())) add(payload, 'Total score', score.textContent.trim());
    document.querySelectorAll('#area-bars .area-row').forEach(function (row) {
      var name = row.querySelector('span');
      var figure = row.querySelector('strong');
      if (!name || !figure) return;
      var label = name.textContent.trim();
      var value = figure.textContent.trim();
      if (label && value && value !== '—') payload[label] = value;
    });
    add(payload, 'county', fieldValue(form, 'county'));
    add(payload, 'yearsToSale', fieldValue(form, 'years'));
    var first = textOf('gate-first');
    var last = textOf('gate-last');
    var fullName = (first + ' ' + last).trim() || fieldValue(form, 'name');
    var email = textOf('gate-email') || fieldValue(form, 'email');
    var phone = textOf('gate-phone') || fieldValue(form, 'phone');
    add(payload, 'Name', fullName);
    add(payload, 'name', fullName);
    add(payload, 'first_name', first);
    add(payload, 'last_name', last);
    add(payload, 'Email', email);
    add(payload, 'Phone', phone);
    add(payload, 'phone', phone);
    add(payload, 'own_or_lease', choiceLabel('occupancy'));
    add(payload, 'cloud_or_server', choiceLabel('q14'));
    add(payload, 'computer_age', choiceLabel('q15'));
    ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q17', 'q18', 'q19']
      .forEach(function (q) { add(payload, q.toUpperCase(), choiceLabel(q)); });
    add(payload, 'practice_state', textOf('practice-state'));
    add(payload, 'zip', textOf('zip'));
    add(payload, 'goal', optionText('goal'));
    add(payload, 'practice_type', optionText('practice-type'));
    add(payload, 'practice_software', optionText('practice-software'));
    add(payload, 'collections', textOf('collections').replace(/[^0-9.]/g, ''));
    return payload;
  }

  function onSubmit(event) {
    var form = event.currentTarget;
    event.preventDefault();
    if (fieldValue(form, 'company')) {
      thank(form);
      return;
    }
    var kind = form.getAttribute('data-fps-sheet');
    if (kind === 'scorecard') {
      var email = textOf('gate-email') || fieldValue(form, 'email');
      var phoneDigits = (textOf('gate-phone') || fieldValue(form, 'phone')).replace(/\D/g, '');
      var phoneOk = phoneDigits.length === 10 || (phoneDigits.length === 11 && phoneDigits.charAt(0) === '1');
      if (!textOf('gate-first') || !textOf('gate-last') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phoneOk) return;
    }
    var payload = kind === 'scorecard' ? scorecardPayload(form) : inquiryPayload(form);
    if (kind === 'scorecard') payload.action = 'report';
    send(payload).then(function () { thank(form); });
  }

  function gateOk() {
    var email = textOf('gate-email');
    var digits = textOf('gate-phone').replace(/\D/g, '');
    var phoneOk = digits.length === 10 || (digits.length === 11 && digits.charAt(0) === '1');
    return !!(textOf('gate-first') && textOf('gate-last') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && phoneOk);
  }

  // "Book a free 20-minute call" on the Scorecard saves the Scorecard first (the link still opens normally).
  function onBookClick() {
    var form = document.getElementById('results-email');
    if (!form || !gateOk()) return;
    var payload = scorecardPayload(form);
    payload.action = 'book';
    send(payload);
  }

  function boot() {
    document.querySelectorAll('form[data-fps-sheet]').forEach(function (form) {
      form.addEventListener('submit', onSubmit);
    });
    if (document.getElementById('results-email')) {
      document.querySelectorAll('#results a[href^="https://calendar.app.google/"]').forEach(function (a) {
        a.addEventListener('click', onBookClick);
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
