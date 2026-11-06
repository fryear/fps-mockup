# Frye Practice Sales — static design mockup

Open `index.html` in a browser. All six pages share `styles.css` and `script.js`.

- No build step or external JavaScript dependencies.
- Google Fonts are optional; system sans-serif fonts are the fallback.
- Forms are intentionally disabled placeholders.
- The scorecard runs locally in the browser only. It does not use storage, analytics, or network requests.
- The free scorecard result adds setup questions (goal, practice type, state, optional ZIP), weighted area scores, a goal-ranked action list, a planning window, and an optional Arizona orientation range. Changing the goal reorders actions and does not hide risks. The range is shown only for a general dentistry practice in Arizona with a resolved lease, and it is labeled as orientation, not a valuation.
- A “Local market snapshot (coming soon)” lists five free public sources (NPPES, Census ACS, Census CBP, BLS OEWS, and BLS QCEW). No market figures are invented. The same list is summarized on the advisory page.
- All offers, prices, proposed roles, and credentials requiring confirmation are labeled in the UI.
- Team portraits and testimonials are deliberately represented by placeholders or omitted.

## Pages
- `index.html` — dual-path home page
- `advisory.html` — four-step advisory ladder
- `scorecard.html` — free 10-question scorecard with area scores, actions, and a printable summary
- `sell.html` — brokerage services and process
- `california.html` — Orange County / San Diego landing page
- `about.html` — team overview
