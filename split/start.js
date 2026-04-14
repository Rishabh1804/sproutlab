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
