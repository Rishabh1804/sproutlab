import { test, expect, type Page } from '@playwright/test';

// Issue #53 — post-detach Firestore snapshot stragglers must not apply stale state.
//
// The fix is a listener-generation guard: _syncDetachListeners() bumps a
// module-scope generation counter, and every onSnapshot callback captures the
// generation it was attached under and bails (`if (_gen !== _syncListenerGen) return;`)
// when it no longer matches. A snapshot callback already queued on the microtask
// loop at detach time therefore cannot reach the snapshot-apply path
// (save(lsKey, entries)) after its listener has been torn down.
//
// Real Firestore callbacks can't fire in the hermetic e2e harness (no backend
// under ?nosync), so we exercise the mechanism directly through the global
// helpers it introduces: a detach must invalidate the generation any in-flight
// callback captured. That invariant is exactly what rejects the straggler.

async function gotoApp(page: Page): Promise<void> {
  // ?nosync skips Firebase init but keeps the sync module loaded + visibility
  // wiring running, so the generation helpers are present on window.
  await page.goto('/?nosync');
  await page.waitForFunction(
    () => typeof (window as any)._syncListenerGenNow === 'function'
       && typeof (window as any)._syncDetachListeners === 'function',
    null,
    { timeout: 15_000 },
  );
}

test('#53 — _syncDetachListeners() invalidates the generation in-flight callbacks captured', async ({ page }) => {
  await gotoApp(page);

  const result = await page.evaluate(() => {
    const w = window as any;

    // A callback attached under the current generation captures it.
    const capturedAtAttach = w._syncListenerGenNow();

    // Detach (household switch / reconnect / re-attach) tears the listeners down.
    w._syncDetachListeners();
    const afterDetach = w._syncListenerGenNow();

    // The straggler's guard is `capturedGen !== _syncListenerGen`.
    const stragglerIsRejected = capturedAtAttach !== afterDetach;          // must be true
    const liveCallbackStillApplies = !(afterDetach !== w._syncListenerGenNow()); // must be true

    // Generation is monotonic across repeated detaches (each invalidates the last).
    w._syncDetachListeners();
    const afterSecondDetach = w._syncListenerGenNow();

    return {
      capturedAtAttach,
      afterDetach,
      afterSecondDetach,
      stragglerIsRejected,
      liveCallbackStillApplies,
    };
  });

  // Detach advanced the generation → any callback that captured the prior value is stale.
  expect(result.afterDetach).toBe(result.capturedAtAttach + 1);
  expect(result.stragglerIsRejected).toBe(true);
  // A callback attached under the live generation is NOT spuriously rejected.
  expect(result.liveCallbackStillApplies).toBe(true);
  // Each detach invalidates the previous generation (monotonic, no reuse).
  expect(result.afterSecondDetach).toBe(result.afterDetach + 1);
});
