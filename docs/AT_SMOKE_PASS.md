# AT Smoke-Pass Checklist

**Purpose.** A repeatable manual screen-reader pass for SproutLab's
accessibility-sensitive surfaces — primarily the **live-region announcements**
(sync/offline status, toasts, activity). Structural/automated checks (Playwright,
the Governor chain) can prove a live region is *present and wired*; they cannot
prove an announcement *actually fires and is heard* on real assistive tech. This
checklist is that final certification.

**When to run.**
- Any change to the live-region architecture (`#a11yLive`, `_a11yAnnounce`, or the
  status surfaces that feed it).
- Any change that adds/moves an `aria-live` / `role="status"` region.
- Before closing an issue gated on an "AT smoke-pass" (e.g. #6 item 3).
- Periodically as a regression guard after large `template.html` / `styles.css` work.

**This is a manual, human-in-the-loop pass.** It cannot be run in CI or by the
agent — it needs a real screen reader and a human listening.

---

## Live-region architecture (what you're certifying)

SproutLab routes **all transient status announcements** through a single
persistent live region so they fire reliably (merged in #175):

- `template.html` — `<div id="a11yLive" class="sr-only" role="status"
  aria-live="polite" aria-atomic="true">` — always in the accessibility tree
  (`.sr-only`, never `display:none`).
- `core.js` — `_a11yAnnounce(msg)` — clears then sets the region's text on the
  next animation frame (falls back to `setTimeout` when the tab is backgrounded);
  multiple calls in one frame coalesce to the last message.
- The visual surfaces (`#syncStatus`, `#syncActivity`, `#updateToast`, the
  offline/halted badge) carry **no** `aria-live` of their own — they're
  visual-only and announce by calling `_a11yAnnounce()`. `#appVersion` is static
  reference text and does **not** announce.

The whole reason this exists: a live region toggled via `[hidden]`
(`display:none`) is removed from the a11y tree, so a same-tick unhide+write does
**not** reliably announce on older AT. The pass below confirms the persistent
region fixes that.

---

## Screen-reader / device matrix

Run at least the **bold** rows. SproutLab is a phone-first PWA, so mobile AT is
primary; NVDA is the named older-AT double-announce risk and is free.

| Priority | Platform | Screen reader | How to enable |
|----------|----------|---------------|---------------|
| **1** | iOS / Safari | **VoiceOver** | Settings → Accessibility → VoiceOver (or triple-click side button) |
| **1** | Android / Chrome | **TalkBack** | Settings → Accessibility → TalkBack |
| **2** | Windows / Chrome or Firefox | **NVDA** (free, nvaccess.org) | Launch NVDA before the browser |
| 3 | Windows | JAWS | If available |
| 3 | macOS / Safari | VoiceOver | Cmd+F5 |

Test against the **live deploy** (https://rishabh1804.github.io/SproutLab/) so the
service-worker / PWA path is real, not a local file.

---

## Test cases

### TC-1 — Offline transition (the core case)
Highest-value; exercises the full persistent-region path end-to-end.
1. Open the app with the screen reader on; let it settle on the `online` state.
2. **Go offline:** airplane mode / toggle Wi-Fi (mobile), or DevTools → Network → **Offline** (desktop).
3. **Listen.**

| | |
|---|---|
| ✅ **Pass** | Hear **"Offline — changes will sync when back online."** announced **exactly once**, politely (does not interrupt current speech). |
| ❌ **Fail** | **Silence** (announcement lost from the hidden start — the core risk); **OR** heard **twice** (indicator + badge double-announce); **OR** the word **"Reload"** is appended to the status sentence. |

4. **Restore network** → badge hides, no spurious announcement.

### TC-2 — Pending-count politeness
1. While offline, **log 1–2 entries** (any feed/diaper/note).
2. The badge copy updates to `… (N pending)`.

| | |
|---|---|
| ✅ **Pass** | Each tick re-announces the **full sentence** politely (no interrupt), e.g. "Offline — changes will sync when back online. (2 pending)". |
| ❌ **Fail** | Interrupts current speech; or announces a bare number with no context. |

### TC-3 — Halted state + Reload button separation
The circuit breaker trips after 3 sync errors — hard to trigger naturally. Drive
the announcement + button directly in the desktop console (same DOM):
```js
_a11yAnnounce('Sync paused after errors — reload to retry.');
```
Then navigate the badge area by swipe (mobile) / Tab (desktop).

| | |
|---|---|
| ✅ **Pass** | Hear the halted sentence **once**; the **"Reload" button is a separate focus stop**, announced as *"Reload, button"* — **not** part of the status sentence. |
| ❌ **Fail** | "Reload" is read as part of the announced status; or the button is unreachable. |

### TC-4 — Update toast
Fires on a new deploy with an existing controller. To simulate on demand:
```js
document.getElementById('updateToast').removeAttribute('hidden');
_a11yAnnounce('New version available — Tap to reload');
```
| | |
|---|---|
| ✅ **Pass** | Hear **"New version available — Tap to reload"** once; the toast is reachable as a button. |

### TC-5 — Activity pill (optional; needs a 2nd device)
With two devices on the same household, edit on device B; on device A the
`#syncActivity` pill surfaces (e.g. "Bhavna synced 2 updates").
| | |
|---|---|
| ✅ **Pass** | The attribution text is announced once, politely. Skip if you don't have a second device. |

### TC-6 — App-version regression (must NOT announce)
Open Settings with the screen reader on.
| | |
|---|---|
| ✅ **Pass** | The **app-version line does NOT announce** on its own — it's static reference text, read on demand when navigating to it. |
| ❌ **Fail** | "App version …" is spoken as an unsolicited status announcement on load. |

---

## Recording results

Log the pass in a comment on the gating issue (and tick the gate). Capture:
- AT + OS + browser **versions** (e.g. "VoiceOver / iOS 18.2 / Safari", "NVDA 2024.4 / Chrome 131").
- TC-1…TC-6 result (pass / fail / skipped).
- For any fail: the exact transition and what was (or wasn't) heard.

**On all-clear:** comment results, close the gating item, and update the relevant
spec / CLAUDE.md note that the gate is cleared.

**On a fail:** the structure is already the canonical robust pattern, so a residual
failure points to a specific AT quirk. Likely narrow remedies: pre-seed the region
with a non-breaking space, add a brief delay before the text write, or adjust
`aria-relevant`. File with the AT/transition detail.

---

## Outstanding items

| Date added | Surface | Gating issue | Status |
|------------|---------|--------------|--------|
| 2026-05-29 | Persistent live-region refactor (all 5 status surfaces; merged in #175, deploy `06b29f6`) | [#6](https://github.com/Rishabh1804/sproutlab/issues/6) item 3 | **Pending AT pass** — structure is AT-defensible (Governor chain + Cipher cleared); awaits TC-1…TC-6 certification on the device matrix above. |
