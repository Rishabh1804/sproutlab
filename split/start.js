// ─────────────────────────────────────────
// START — must be last in concat order
// ─────────────────────────────────────────
initDarkMode();
initSimpleMode();
initZoomLevel();
init();
initWelcomeGuide();
_bugInit();
// Safe sync init — ?nosync bypasses Firebase entirely for recovery
if (window.location.search.indexOf('nosync') === -1) {
  try { initFirebase(); } catch(e) { console.error('[sync] initFirebase crashed:', e); }
}
// Sync visibility indicator (Phase 1 — sl-1-2). Runs even under ?nosync so
// the header still reflects true network state from navigator.onLine alone.
try { initSyncVisibility(); } catch(e) { console.error('[sync-vis] init crashed:', e); }
// App version display (Phase 2 PR-3). Fetches manifest.json and populates
// the settings #appVersion line. Silent on failure; :empty CSS hides the row.
try { displayAppVersion(); } catch(e) { console.error('[app-version] display crashed:', e); }
