// Local UI behavior only. No analytics, storage, network calls, or form submission.
// Area score = average answer / 2 * 100.
// Preview scorecard only. Overall weights: financial 27, revenue 18, lease 14, team 18, systems 13, AI visibility 10.
// Goal weights only rank weak answers. They do not change the score.

const SCORE_WEIGHTS = { financial: 27, revenue: 18, lease: 14, team: 18, systems: 13, visibility: 10 };
const GOAL_WEIGHTS = {
  'sell-now': { financial: 30, revenue: 15, lease: 20, team: 20, systems: 15, visibility: 10 },
  'sell-later': { financial: 25, revenue: 25, lease: 10, team: 25, systems: 15, visibility: 18 },
  dso: { financial: 30, revenue: 20, lease: 10, team: 25, systems: 15, visibility: 25 },
};
const AREAS = [
  { id: 'financial', label: 'Financial evidence', questions: ['q1', 'q2', 'q3'] },
  { id: 'revenue', label: 'Revenue & payer durability', questions: ['q4'] },
  { id: 'lease', label: 'Lease & premises', questions: ['q5'] },
  { id: 'team', label: 'Team & owner dependence', questions: ['q6', 'q7'] },
  { id: 'systems', label: 'Systems & transition', questions: ['q8', 'q9', 'q10'] },
  { id: 'visibility', label: 'AI & online visibility', questions: ['q11', 'q12', 'q13'] },
];
const ACTION_DEFS = {
  q1: { area: 'financial', order: 1, title: 'Get three years of statements and tax returns, and reconcile collections.', who: 'CPA', doneWhen: 'Three years of statements and returns are in one place, and collections reconcile.', windowLabel: '30–60 days', estimate: 'about 1–2 months', days: 60 },
  q2: { area: 'financial', order: 2, title: 'List owner and one-time expenses with receipts, and include market pay for a replacement clinician.', who: 'Owner + CPA', doneWhen: 'Owner and one-time costs are listed with receipts, including market replacement-clinician pay.', windowLabel: '2–4 weeks', estimate: 'about 2–4 weeks', days: 28 },
  q3: { area: 'financial', order: 3, title: 'Start a monthly dashboard for collections, costs, and cash.', who: 'Owner', doneWhen: 'The monthly collections, costs, and cash dashboard has been reviewed for 90 days.', windowLabel: '90 days', estimate: 'about 3 months', days: 90 },
  q4: { area: 'revenue', order: 4, title: 'Export collections by payer and find the top payer’s share.', who: 'Owner', doneWhen: 'Collections by payer are exported and the top-payer share is known.', windowLabel: '2–4 weeks', estimate: 'about 2–4 weeks', days: 28 },
  q5: { area: 'lease', order: 5, title: 'Have counsel review assignment rights, renewal options, and landlord consent.', who: 'Counsel', doneWhen: 'Counsel has reviewed assignment, options, and landlord consent.', windowLabel: '30–90 days', estimate: 'about 1–3 months', days: 90, hard: true },
  q6: { area: 'team', order: 6, title: 'Measure owner production against associate and hygiene production, then write a coverage and retention plan.', who: 'Owner', doneWhen: 'Owner, associate, and hygiene output are measured, and a coverage and retention plan is written.', windowLabel: '6–18 months', estimate: '6–18 months', days: 540 },
  q7: { area: 'team', order: 7, title: 'Write down roles, compensation, and key agreements.', who: 'Owner', doneWhen: 'Roles, compensation, and agreements are documented.', windowLabel: '30–60 days', estimate: 'about 1–2 months', days: 60 },
  q8: { area: 'systems', order: 8, title: 'Build a monthly report pack you can repeat without a scramble.', who: 'Manager', doneWhen: 'A monthly report pack can be produced the same way each time.', windowLabel: '30–60 days', estimate: 'about 1–2 months', days: 60 },
  q9: { area: 'systems', order: 9, title: 'Compare a sale to an individual dentist, a DSO, and a PE recap on cash, equity, work term, and control.', who: 'Owner', doneWhen: 'Individual, DSO, and PE paths are compared on cash, equity, work term, and control.', windowLabel: '1–2 weeks', estimate: 'about 1–2 weeks', days: 14 },
  q10: { area: 'systems', order: 10, title: 'Write a one-page transition plan with a target date, your role, and your advisors.', who: 'Owner', doneWhen: 'A one-page plan names a target date, your future role, and your advisors.', windowLabel: '1–2 weeks', estimate: 'about 1–2 weeks', days: 14 },
  q11: { area: 'visibility', order: 11, title: 'Claim the Google Business Profile and make the hours, services, and phone number current.', who: 'Manager', doneWhen: 'The Google Business Profile is claimed, and hours, services, and the phone number match the practice.', windowLabel: '1–2 weeks', estimate: 'about 1–2 weeks', days: 14 },
  q12: { area: 'visibility', order: 12, title: 'Claim the ChatGPT Business Hub profile and keep the public details current.', who: 'Owner', doneWhen: 'The Business Hub profile is claimed, and the description, hours, and services are filled in.', windowLabel: '1–2 weeks', estimate: 'about 1–2 weeks', days: 14 },
  q13: { area: 'visibility', order: 13, title: 'Align hours, services, and insurance on Google, Yelp, and Healthgrades, and tend recent reviews.', who: 'Manager', doneWhen: 'Those listings match, and recent reviews are answered with the rating at 4.5 or higher.', windowLabel: '2–4 weeks', estimate: 'about 2–4 weeks', days: 28 },
};

function parseCollections(raw) {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/[$,\s]/g, '');
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function bandFor(score) {
  if (score < 50) return 'Establish baseline';
  if (score < 80) return 'Prepare';
  return 'Review for market';
}

function computeReadiness(input) {
  const answers = input.answers || {};
  const labels = input.labels || {};
  const scores = {};
  let answeredCount = 0;
  Object.keys(ACTION_DEFS).forEach((id) => {
    const value = answers[id];
    if (value === 0 || value === 1 || value === 2) {
      scores[id] = value;
      answeredCount += 1;
    } else {
      scores[id] = null;
    }
  });

  const areas = AREAS.map((area) => {
    const values = area.questions.map((id) => scores[id]);
    const complete = values.every((value) => value != null);
    if (!complete) return { id: area.id, label: area.label, score: null, complete: false };
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    return { id: area.id, label: area.label, score: (average / 2) * 100, complete: true };
  });

  const complete = answeredCount === Object.keys(ACTION_DEFS).length;
  let overall = null;
  let band = null;
  if (complete) {
    const byId = Object.fromEntries(areas.map((area) => [area.id, area.score]));
    const weighted = AREAS.reduce((sum, area) => sum + byId[area.id] * SCORE_WEIGHTS[area.id], 0) / 100;
    overall = Math.round(weighted);
    band = bandFor(overall);
  }

  const leaseIsWeakest = complete && scores.q5 < 2 && Object.values(scores).every((value) => scores.q5 <= value);

  const goalWeights = GOAL_WEIGHTS[input.goal] || null;
  const weak = Object.keys(ACTION_DEFS).filter((id) => scores[id] === 0 || scores[id] === 1).map((id) => {
    const def = ACTION_DEFS[id];
    const label = labels[id] ? `You answered “${labels[id]}.”` : 'This answer is still a gap.';
    return {
      id,
      score: scores[id],
      area: def.area,
      order: def.order,
      title: def.title,
      why: label,
      who: def.who,
      doneWhen: def.doneWhen,
      windowLabel: def.windowLabel,
      estimate: def.estimate,
      days: def.days,
      hard: Boolean(def.hard),
    };
  });

  const lease = weak.find((item) => item.id === 'q5') || null;
  const rest = weak.filter((item) => item.id !== 'q5');
  rest.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    const weightA = goalWeights ? goalWeights[a.area] : 0;
    const weightB = goalWeights ? goalWeights[b.area] : 0;
    if (weightA !== weightB) return weightB - weightA;
    return a.order - b.order;
  });
  const ranked = lease ? [lease, ...rest] : rest;
  const shown = ranked.slice(0, 5);
  const alsoOpen = ranked.slice(5);

  let readiness = null;
  if (ranked.length) {
    const longest = ranked.reduce((best, item) => (item.days > best.days ? item : best), ranked[0]);
    readiness = {
      estimate: longest.estimate,
      driver: longest.title,
      windowLabel: longest.windowLabel,
    };
  }

  const amount = parseCollections(input.collections);
  const missing = [];
  if (input.practiceType !== 'general') missing.push('General dentistry selected');
  if (input.state !== 'AZ') missing.push('Arizona selected');
  if (scores.q5 == null) missing.push('the lease question answered');
  else if (scores.q5 < 2) missing.push('a resolved lease (a weak lease is a hard blocker)');
  if (amount == null) missing.push('annual collections');

  const value = missing.length ? {
    status: 'explain',
    message: `An orientation range is not shown yet. Still needed: ${missing.join('; ')}.`,
  } : {
    status: 'range',
    low: Math.round(amount * 0.6),
    high: Math.round(amount * 0.85),
    message: 'Orientation only, based on FPS\'s published Arizona guide; not a valuation.',
  };

  return {
    answeredCount,
    complete,
    areas: areas.map((area) => ({ ...area, score: area.score == null ? null : Math.round(area.score) })),
    overall,
    band,
    leaseIsWeakest,
    shown,
    alsoOpen,
    readiness,
    value,
  };
}

globalThis.computeReadiness = computeReadiness;


const scorecard = document.querySelector('#scorecard');
if (scorecard) {
  const goal = document.querySelector('#goal');
  const goalLive = document.querySelector('#goal-live');
  const practiceType = document.querySelector('#practice-type');
  const practiceState = document.querySelector('#practice-state');
  const zip = document.querySelector('#zip');
  const collections = document.querySelector('#collections');
  const ring = document.querySelector('#score-ring');
  const valueEl = document.querySelector('#score-value');
  const progress = document.querySelector('#progress-text');
  const title = document.querySelector('#result-title');
  const copy = document.querySelector('#result-copy');
  const link = document.querySelector('#result-link');
  const areaBars = document.querySelector('#area-bars');
  const actionList = document.querySelector('#action-list');
  const alsoOpen = document.querySelector('#also-open');
  const readinessCopy = document.querySelector('#readiness-copy');
  const valueCopy = document.querySelector('#value-copy');
  const valueFigures = document.querySelector('#value-figures');
  const leaseLine = document.querySelector('#lease-line');
  const bandLine = document.querySelector('#band-line');
  const zipNote = document.querySelector('#zip-note');
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  function selectedLabel(name) {
    const checked = scorecard.querySelector(`input[name="${name}"]:checked`);
    if (!checked) return '';
    const label = scorecard.querySelector(`label[for="${checked.id}"]`);
    return label ? label.textContent.trim() : '';
  }

  function currentInput() {
    const answers = {};
    const labels = {};
    Object.keys(ACTION_DEFS).forEach((id) => {
      const checked = scorecard.querySelector(`input[name="${id}"]:checked`);
      answers[id] = checked ? Number(checked.value) : null;
      if (checked) labels[id] = selectedLabel(id);
    });
    return {
      answers,
      labels,
      goal: goal ? goal.value : '',
      practiceType: practiceType ? practiceType.value : '',
      state: practiceState ? practiceState.value : '',
      collections: collections ? collections.value : '',
    };
  }

  function syncGoal(source, target) {
    if (source && target && target.value !== source.value) target.value = source.value;
  }

  function addRow(dl, label, text) {
    const wrap = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = text;
    wrap.append(dt, dd);
    dl.append(wrap);
  }

  function render() {
    const model = currentInput();
    const result = computeReadiness(model);
    progress.textContent = `${result.answeredCount} of ${Object.keys(ACTION_DEFS).length} answered`;
    ring.style.setProperty('--score', result.complete ? result.overall : 0);
    valueEl.textContent = result.complete ? String(result.overall) : '—';

    if (!result.complete) {
      title.textContent = result.answeredCount ? 'Your picture is taking shape' : 'Start with your goal';
      copy.textContent = result.answeredCount
        ? `Answer ${Object.keys(ACTION_DEFS).length - result.answeredCount} more question${Object.keys(ACTION_DEFS).length - result.answeredCount === 1 ? '' : 's'} for the overall score.`
        : 'Your score, actions, and planning window will appear as you answer. Nothing is stored or sent.';
      link.textContent = 'Continue the questions';
      link.href = '#setup';
    } else if (result.leaseIsWeakest) {
      title.textContent = 'Not ready to market: lease path unresolved';
      copy.textContent = `The score is ${result.overall}, in the ${result.band} band. The lease answer is still the weakest item.`;
      link.textContent = 'Review your actions';
      link.href = '#results';
    } else if (result.band === 'Establish baseline') {
      title.textContent = 'Establish baseline';
      copy.textContent = 'Start by getting the records and routines a buyer will ask for.';
      link.textContent = 'Review your actions';
      link.href = '#results';
    } else if (result.band === 'Prepare') {
      title.textContent = 'Prepare';
      copy.textContent = 'You have a base. Close the open gaps before a broad buyer process.';
      link.textContent = 'Review your actions';
      link.href = '#results';
    } else {
      title.textContent = 'Review for market';
      copy.textContent = 'These answers look ready for a market conversation. This score is not a valuation.';
      link.textContent = 'Review your actions';
      link.href = '#results';
    }

    leaseLine.hidden = !result.leaseIsWeakest;
    bandLine.textContent = result.complete ? `Overall ${result.overall} · ${result.band}` : 'Overall score appears after every question is answered.';

    areaBars.replaceChildren();
    result.areas.forEach((area) => {
      const row = document.createElement('div');
      row.className = 'area-row';
      const name = document.createElement('span');
      name.textContent = area.label;
      const track = document.createElement('div');
      track.className = 'area-track';
      const fill = document.createElement('span');
      if (area.score == null) {
        fill.style.width = '0%';
      } else {
        fill.style.width = `${area.score}%`;
        if (area.score < 50) fill.classList.add('is-low');
      }
      track.append(fill);
      const figure = document.createElement('strong');
      figure.textContent = area.score == null ? '—' : String(area.score);
      row.append(name, track, figure);
      areaBars.append(row);
    });

    actionList.replaceChildren();
    if (!result.shown.length) {
      const empty = document.createElement('p');
      empty.textContent = result.answeredCount
        ? 'No weak answers yet. Strong answers do not create an action card.'
        : 'Actions appear when an answer is partial or missing.';
      actionList.append(empty);
    } else {
      result.shown.forEach((action) => {
        const card = document.createElement('article');
        card.className = 'action-card';
        card.dataset.actionId = action.id;
        const heading = document.createElement('h3');
        heading.textContent = action.title;
        if (action.hard) {
          const flag = document.createElement('span');
          flag.className = 'mock-note';
          flag.textContent = 'Hard blocker';
          heading.append(flag);
        }
        const why = document.createElement('p');
        why.textContent = action.why;
        const dl = document.createElement('dl');
        addRow(dl, 'Who', action.who);
        addRow(dl, 'Done when', action.doneWhen);
        addRow(dl, 'Proposed window', action.windowLabel);
        card.append(heading, why, dl);
        actionList.append(card);
      });
    }

    alsoOpen.replaceChildren();
    if (result.alsoOpen.length) {
      const note = document.createElement('p');
      note.className = 'small';
      note.textContent = 'Also still open. Changing goals reorders the list. It does not remove these.';
      const list = document.createElement('ul');
      list.className = 'also-list';
      result.alsoOpen.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item.title;
        list.append(li);
      });
      alsoOpen.append(note, list);
    }

    if (!result.readiness) {
      readinessCopy.textContent = 'Estimated time to ready appears when an answer opens an action. It is a planning estimate, not a promise.';
    } else {
      const driver = result.readiness.driver.replace(/\.$/, '');
      readinessCopy.textContent = `Estimated time to ready: ${result.readiness.estimate}. Longest open item: ${driver} (${result.readiness.windowLabel}). This is a planning estimate, not a promise.`;
    }

    if (result.value.status === 'range') {
      valueFigures.hidden = false;
      valueFigures.textContent = `${money.format(result.value.low)} to ${money.format(result.value.high)}`;
      valueCopy.textContent = result.value.message;
    } else {
      valueFigures.hidden = true;
      valueFigures.textContent = '';
      valueCopy.textContent = result.value.message;
    }

    const zipValue = zip && zip.value.trim();
    zipNote.textContent = zipValue
      ? `You entered ${zipValue}. This mockup does not look up that ZIP, and it is not sent.`
      : 'ZIP is optional. This page does not look it up or send it.';
  }

  scorecard.addEventListener('change', (event) => {
    if (event.target === goal) syncGoal(goal, goalLive);
    render();
  });
  scorecard.addEventListener('submit', (event) => event.preventDefault());
  if (goalLive) {
    goalLive.addEventListener('change', () => {
      syncGoal(goalLive, goal);
      render();
    });
  }
  if (collections) collections.addEventListener('input', render);
  if (zip) zip.addEventListener('input', render);

  const resetButton = document.querySelector('#reset-scorecard');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      scorecard.reset();
      if (collections) collections.value = '';
      if (goalLive && goal) goalLive.value = goal.value;
      render();
    });
  }
  const printButton = document.querySelector('#print-scorecard');
  if (printButton) printButton.addEventListener('click', () => window.print());

  render();
}
