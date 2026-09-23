/**
 * `app.json` plus two overrides that only the GitHub Pages build sets
 * (`.github/workflows/pages.yml`). Locally neither variable exists, and the
 * config is exactly `app.json`.
 *
 * - `EXPO_BASE_URL` — Pages serves a project site under `/<repo>/`, not `/`.
 *   Expo prefixes every route and asset with `experiments.baseUrl`.
 * - `EXPO_WEB_OUTPUT` — Pages has no server-side routing: a direct link to
 *   `/yuny/folder/<id>` is a 404, answered with `404.html`. A single-page
 *   build (`single`) makes that file a copy of `index.html` and lets the
 *   router take the URL from there; the pre-rendered `static` output would
 *   hydrate the wrong route's HTML instead.
 */
module.exports = ({ config }) => ({
  ...config,
  web: {
    ...config.web,
    ...(process.env.EXPO_WEB_OUTPUT ? { output: process.env.EXPO_WEB_OUTPUT } : {}),
  },
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
