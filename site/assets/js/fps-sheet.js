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

  function send(payload) {
    var endpoint = window.FPS_SHEET_ENDPOINT;
    if (!endpoint) {
      console.info('FPS sheet endpoint is empty. Nothing was sent.');
      return Promise.resolve();
    }
    return fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
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
    var payload = { type: 'scorecard' };
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
    var payload = kind === 'scorecard' ? scorecardPayload(form) : inquiryPayload(form);
    send(payload).then(function () { thank(form); });
  }

  function boot() {
    document.querySelectorAll('form[data-fps-sheet]').forEach(function (form) {
      form.addEventListener('submit', onSubmit);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
