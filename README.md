# Daily Goal Dashboard (GitHub Pages)

Auto-updating dashboard for daily goals, schedule, and execution tracking.

## Features
- Static website in `docs/` (GitHub Pages compatible)
- Daily plan auto-refresh via GitHub Actions (`scripts/update_dashboard.js`)
- Habit and priority checkboxes saved in browser local storage
- History log updates automatically each day

## File map
- `docs/index.html` UI
- `docs/styles.css` styling
- `docs/app.js` dashboard logic
- `docs/data/goals.json` your goals and KPI targets
- `docs/data/daily-plan.json` generated daily plan
- `docs/data/history.json` generated history
- `scripts/update_dashboard.js` daily plan generator
- `.github/workflows/daily-update.yml` scheduled data update
- `.github/workflows/deploy-pages.yml` GitHub Pages deployment

## Deployment
1. Create a GitHub repository.
2. Push this folder to the repo default branch (`main`).
3. In GitHub repo settings, enable Pages with source: **GitHub Actions**.
4. Workflow `Deploy Dashboard to GitHub Pages` publishes the site.
5. Workflow `Daily Dashboard Update` runs daily at `23:10 UTC` (`07:10 UTC+8`).

## Customize
- Edit `/docs/data/goals.json` for your targets and habits.
- Edit `/scripts/update_dashboard.js` templates if you want different weekday plans.
