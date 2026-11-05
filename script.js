// Local UI behavior only. No analytics, storage, network calls, or form submission.
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.main-nav');
if (menuButton && menu) {
  menuButton.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
}

const scorecard = document.querySelector('#scorecard');
if (scorecard) {
  const inputs = [...scorecard.querySelectorAll('input[type="radio"]')];
  const ring = document.querySelector('#score-ring');
  const value = document.querySelector('#score-value');
  const progress = document.querySelector('#progress-text');
  const title = document.querySelector('#result-title');
  const copy = document.querySelector('#result-copy');
  const link = document.querySelector('#result-link');

  scorecard.addEventListener('change', () => {
    const answered = new Set(inputs.filter(input => input.checked).map(input => input.name));
    const points = inputs.filter(input => input.checked).reduce((sum, input) => sum + Number(input.value), 0);
    const score = Math.round((points / 20) * 100);
    progress.textContent = `${answered.size} of 10 answered`;
    ring.style.setProperty('--score', score);
    value.textContent = score;

    if (answered.size < 10) {
      title.textContent = 'Your picture is taking shape';
      copy.textContent = `Answer ${10 - answered.size} more question${10 - answered.size === 1 ? '' : 's'} for a complete suggested next step.`;
      link.textContent = 'Explore advisory options';
      link.href = 'advisory.html';
    } else if (score < 50) {
      title.textContent = 'Start with a clear baseline';
      copy.textContent = 'A Readiness Assessment could help organize the numbers and identify the first issues to address.';
      link.textContent = 'Explore the assessment';
      link.href = 'advisory.html#assessment-call';
    } else if (score < 80) {
      title.textContent = 'Turn insight into a plan';
      copy.textContent = 'An assessment, followed by focused value-building support, could help close the remaining gaps.';
      link.textContent = 'See your options';
      link.href = 'advisory.html#offers';
    } else {
      title.textContent = 'Explore your transition options';
      copy.textContent = 'A confidential brokerage conversation may be a useful next step when your timeline is right.';
      link.textContent = 'Talk about a transition';
      link.href = 'sell.html#consultation';
    }
  });
}
