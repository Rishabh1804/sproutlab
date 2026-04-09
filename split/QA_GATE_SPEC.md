# SproutLab — Build QA Gate Spec
**Created:** 9 April 2026
**Applies to:** Every SproutLab build session
**Philosophy:** The user never asks for a QA audit. Code is not presented until it passes.

---

## How This Document Works

This spec defines a **three-gate system** that every build session must follow. Code cannot be presented to the user until Gate 2 passes with zero defects in layers 1–3. The user should never encounter a mechanical, structural, or logic bug — those are builder failures caught before delivery.

**Attach this document to every session alongside the feature spec and handoff.**

---

## §1 — Dependency Verification (Gate 1)

### Rule: No code is written against unverified dependencies.

Before writing any code, the builder's **first message** must contain:

1. **A dependency scan** — every external function, constant, utility, CSS class, DOM element, and HTML structure that the new code will call, override, reference, or inject into.

2. **A classification** of each dependency:

| Status | Meaning | Action |
|--------|---------|--------|
| **Verified** | File is uploaded, implementation has been read | Proceed |
| **In-memory** | Function signature/behavior is known from handoff or memory | Cite the source, proceed with caution |
| **Unverified** | File not uploaded, behavior unknown | **Ask for the file** |

3. **An explicit ask** for all unverified files, formatted as:

> Before I start building, I need to verify these dependencies:
> - `escHtml()` in core.js — I'll be passing JSON through it into HTML attributes
> - `undoLastActivity()` in home.js — I'm overriding it and need to read the original
> - `template.html` lines around `#qlModal-activity` — I'm injecting DOM before the textarea
>
> Can you upload: **core.js**, **home.js**? (template.html only if I'll touch HTML structure)

### What counts as a dependency

| Type | Example | Why it matters |
|------|---------|----------------|
| **Utility function** | `escHtml()`, `toDateStr()`, `save()` | May not do what the name implies |
| **Domain function** | `matchesMilestoneKeyword()`, `computeAutoStatus()` | Signature/return shape unknown |
| **Function override** | Redefining `undoLastActivity()` | Original may have side effects the override drops |
| **Data constant** | `EVIDENCE_PATTERNS`, `KEYWORD_TO_MILESTONE` | Structure/field names must match |
| **DOM element** | `#alTextInput`, `.ql-field`, `.ql-presets` | Must exist in template with expected structure |
| **CSS class** | `.ql-modal`, `.al-chip` | Existing styles may conflict or need extension |
| **Global variable** | `milestones`, `activityLog`, `_qlBackfillDate` | Shape and lifecycle must be understood |
| **Delegation wiring** | `data-action` handler in core.js | Must exist or be added |

### The threshold for "must verify"

The builder must verify a dependency if **any** of these are true:

- Using a function in a context beyond what its name guarantees (e.g., `escHtml` for attribute escaping)
- Overriding or replacing a function defined elsewhere
- Depending on the internal implementation (not just the interface) of a function
- Injecting DOM relative to elements the builder hasn't seen
- Passing data through a function and relying on specific output format
- The function could plausibly have side effects (logging, cache clearing, state changes)

**Default is verify. The user can waive specific items with "proceed with assumption" — but the builder must ask first.**

### Practical workflow

The builder **may begin writing code for verified portions** while waiting for unverified files. But:

- Unverified code sections are marked with `// UNVERIFIED: depends on X from Y` comments
- These sections are not included in Gate 2 checks until the dependency is resolved
- The builder does not present code to the user until all dependencies are verified or waived

---

## §2 — Gate System

### Gate 1 — Pre-Build

**When:** After reading spec + handoff, before writing any code.
**Owner:** Builder.
**Output:** Dependency list in first message.

| Check | Criteria |
|-------|----------|
| Dependency scan complete | Every external call/override/injection listed |
| All unverified deps raised | Builder has asked for files |
| Spec understood | Builder confirms BN- notes, edge cases, and gotchas |
| Design doc referenced | DESIGN_PRINCIPLES.md has been read (or is in memory) |

**Gate 1 passes when:** All dependencies are verified or explicitly waived by the user.

---

### Gate 2 — Pre-Delivery

**When:** After code is written, before presenting to the user.
**Owner:** Builder (automated + manual checks).
**Output:** The user receives code that has passed all three layers.

Gate 2 has three layers. **All three must be zero defects.** If any layer fails, the builder fixes and re-runs. The user never sees Gate 2 failures.

#### Layer 1 — Mechanical (automated via bash)

These checks are **run as bash commands**, not mental checks. The builder must execute the verification script and include its output in its thinking before presenting code.

```
CHECKS:
1. zi() icon validation     — every zi('name') cross-referenced against the 52-icon set
2. Attribute escaping       — every data-arg with JSON uses _alAttrSafe (or equivalent), not bare escHtml
3. XSS: escHtml             — all user-originated text in innerHTML passes through escHtml()
4. No emojis                — Unicode range grep (U+1F300–1F9FF, U+2600–27BF)
5. No inline onclick        — grep for onclick=, onchange=, oninput=, onfocus=, onblur=
6. No inline styles         — grep for style=" in HTML strings (not .style. JS DOM)
7. CSS token validation     — spacing (--sp-2..32), radius (--r-sm..full), font (--fs-2xs..3xl)
8. CSS color tokens         — only design system tokens (--sage-light, --tc-sage, --warm, --glass, --mid, --text, etc.)
9. All buttons have data-action
10. No text-overflow: ellipsis
11. Syntax check            — node -c on every modified JS file
12. Dark mode coverage      — every selector with color/background either uses a theme-aware token or has a [data-theme="dark"] rule
13. Min tap target          — interactive elements have min-height: var(--chip-min-h) or equivalent ≥36px
14. Font family             — only 'Nunito' and 'Fraunces', never Inter/Roboto/Arial/system-ui
```

**The builder runs a bash block that checks all 14 items and reviews the output.** Any failure → fix → re-run. Not optional.

#### Layer 2 — Structural (manual cross-reference)

| Check | What to verify |
|-------|----------------|
| Delegation completeness | Every `data-action="X"` in rendered HTML has a matching handler in core.js delegation |
| Function existence | Every function called exists in an uploaded file or is verified in-memory |
| Override safety | Every overridden function has the original read; override is a superset |
| Timer lifecycle | Every `setTimeout` ID is stored and cleared on all exit paths (dismiss, re-trigger, success) |
| State reset | Module-level state variables reset on modal open/close (BN-4 pattern) |
| DOM injection idempotency | Injection functions are guarded by a flag (`if (_injected) return`) |
| Event listener safety | `addEventListener` not called multiple times for the same handler on the same element |
| Data persistence | `save()` called after every mutation to localStorage-backed data |
| Dirty flags | `_tsfMarkDirty()` / `_islMarkDirty()` called after data changes that affect dependent views |

#### Layer 3 — Logic (spec-driven)

| Check | What to verify |
|-------|----------------|
| Edge case coverage | Every row in the spec's edge case table (§12) has been addressed in code |
| Builder notes | Every BN-* note has been implemented and the specific fix is identifiable in code |
| Prefill suppression | Prefilled modal hides/shows the correct sections |
| Evidence flow | Suggestion tap bypasses classifier; manual typing re-engages it |
| Save integrity | Entry object has all required fields (id, text, type, duration, ts, source, domains, evidence) |
| Undo integrity | Undo removes the correct entries and re-renders all affected views |
| Render flow | Save → close modal → toast → re-render sequence is correct (no renders inside a closed modal) |
| Classifier interaction | Programmatic `.value` changes don't trigger `oninput`; only user input does |
| Fallback paths | Missing data (no milestones, no yesterday, no evidence) produces graceful fallbacks, not crashes |

**Gate 2 passes when:** All three layers report zero defects.

---

### Gate 3 — Post-Deploy

**When:** After user deploys and shares a screenshot or confirms it's running.
**Owner:** Builder + user.

| Check | Criteria |
|-------|----------|
| Visual correctness | Domain colors rendering, icons visible, text readable |
| Spacing/alignment | Nothing cramped, misaligned, or overflowing |
| Tap responsiveness | Tapping cards/buttons performs the expected action |
| Dark mode visual | Colors appropriate for dark background |

**Exit criteria:** ≤2 cosmetic issues, logged as debt in the session handoff. Session is complete.

---

## §3 — Cross-Document Reference Protocol

When the builder encounters a reference to code, data, or behavior defined in a file or document not present in the current context:

### Decision tree

```
Is the information in memory/handoff?
  ├─ Yes → Cite the source. If using beyond its name's guarantee → still ask for file.
  └─ No →
      Is the file uploadable? (JS/CSS/HTML/MD from the split folder)
        ├─ Yes → Ask: "I need to read [function/section] from [file]. Can you upload it?"
        └─ No → Document the assumption explicitly:
                 "ASSUMPTION: [function] in [file] does [expected behavior].
                  If this is wrong, [specific consequence]."
```

### Rules

1. **Never infer behavior from a function name alone.** `escHtml` sounds like it escapes all HTML — it doesn't escape `"`. `matchesMilestoneKeyword` sounds like it takes a keyword — it actually takes milestone text and a keyword. Names lie.

2. **Never override a function without reading the original.** The override must be a strict superset. If the original has side effects (analytics, cache invalidation, secondary state), the override must preserve them.

3. **Never inject DOM without understanding the target structure.** If inserting before/after/inside an element, the builder must have seen the HTML or confirmed the structure via the user.

4. **When in doubt, ask.** A 30-second file upload saves two debug cycles. The cost of asking is always less than the cost of a wrong assumption.

### Format for asking

> **Dependency check:** I need to verify [N] functions before building:
> - `functionName()` from `file.js` — [why: what I'm doing with it]
> - `functionName()` from `file.js` — [why]
>
> Can you upload **file.js**?

The builder groups requests by file to minimize user effort. One upload covers multiple dependencies.

---

## §4 — Mechanical Check Script (bash template)

The builder adapts this template for each session. The specific checks vary by feature, but the structure is fixed.

```bash
echo "═══════════════ GATE 2: MECHANICAL ═══════════════"

echo "── 1. zi() icon validation ──"
VALID="baby balloon bars bell bolt book bowl brain bulb camera chart chat check chef clock crystal diaper dot-red drop flame flask halfcircle handshake hourglass info link list lotus medical moon note palette party pill rainbow ruler run scale scope shield siren sleep sparkle spoon sprout star steth sun syringe target timer trophy warn zzz"
grep -oP "zi\('\K[^']+" $FILE | sort -u | while read icon; do
  echo "$VALID" | grep -qw "$icon" && echo "  ✓ $icon" || echo "  ✗ $icon — INVALID"
done

echo "── 2. Attribute escaping (JSON in data-arg) ──"
grep 'data-arg=.*JSON\|data-arg=.*stringify\|data-arg=.*payload' $FILE | grep -v '_alAttrSafe\|_attrSafe' && echo "  ✗ UNESCAPED JSON" || echo "  ✓ PASS"

echo "── 3. escHtml on user text ──"
# Manual review: check innerHTML assignments with user data

echo "── 4. No emojis ──"
python3 -c "
import re
with open('$FILE') as f:
    for i, line in enumerate(f, 1):
        if re.search(r'[\U0001F300-\U0001F9FF\u2600-\u27BF]', line):
            print(f'  ✗ L{i}: {line.rstrip()[:80]}')
" || echo "  ✓ PASS"

echo "── 5. No inline onclick ──"
grep -n 'onclick=\|onchange=\|oninput=\|onfocus=\|onblur=' $FILE || echo "  ✓ PASS"

echo "── 6. No inline styles in HTML strings ──"
grep -n 'style="' $FILE | grep -v '\.style\.\|//' || echo "  ✓ PASS"

echo "── 7-8. CSS token validation ──"
echo "  Spacing (must be 2,4,6,8,10,12,16,20,24,32):"
grep -oP '\-\-sp-\d+' $CSS | sort -t- -k3 -n | uniq
echo "  Radius (must be r-sm,r-md,r-lg,r-xl,r-2xl,r-full):"
grep -oP '\-\-r-\w+' $CSS | sort -u
echo "  Colors (must be design system tokens):"
grep -oP '\-\-[a-z][\w-]+' $CSS | sort -u | grep -v 'sp-\|fs-\|r-\|ls-\|chip-\|anim-\|al-'

echo "── 9. All buttons have data-action ──"
grep '<button' $FILE | grep -v 'data-action' || echo "  ✓ PASS"

echo "── 10. No ellipsis ──"
grep -n 'ellipsis' $FILE $CSS || echo "  ✓ PASS"

echo "── 11. Syntax ──"
node -c $FILE && echo "  ✓ PASS" || echo "  ✗ FAIL"

echo "── 12. Dark mode ──"
# Automated: check selectors with color/background against [data-theme=dark] rules
# Theme-aware tokens (--mid, --text, --warm, --glass, --tc-*, --*-light) are exempt

echo "── 13. Min tap target ──"
grep -c 'min-height.*chip-min-h' $CSS
echo "  (verify all interactive elements ≥36px)"

echo "── 14. Font family ──"
grep 'font-family' $CSS | grep -v 'Nunito\|Fraunces' || echo "  ✓ PASS"
```

**The builder runs this (adapted to the session's files) and reviews the output before presenting code.** If any check shows ✗, the builder fixes and re-runs. The script output does not need to be shown to the user — only the result matters (code is either presented or not).

---

## §5 — Exit Criteria Summary

| Gate | When | Zero-defect requirement | Who sees failures? |
|------|------|------------------------|-------------------|
| Gate 1 | Before code | All deps verified or waived | User sees the ask |
| Gate 2 | Before delivery | Layers 1-3 all pass | **Builder only** — user never sees |
| Gate 3 | After deploy | ≤2 cosmetic items as debt | User reviews visuals |

**A session is complete when Gate 3 passes.**

**The user should never say "do a QA audit" or "check for bugs."** If they do, the process has failed — Gate 2 was skipped or incomplete.

---

## §6 — Failure Modes This Spec Prevents

| Past failure | Which gate catches it | How |
|---|---|---|
| `escHtml` doesn't escape `"` → broken data-arg | Gate 1 | Dependency scan: "using escHtml for attribute context — need to verify implementation" |
| `zi('lightbulb')` not in icon set → broken SVG | Gate 2 Layer 1 | Bash grep against 52-icon list |
| Wrong CSS tokens (`--sage-50`, `--sp-1`) → unstyled elements | Gate 2 Layer 1 | Token validation grep |
| Missing dark mode for `:active` state | Gate 2 Layer 1 | Dark mode coverage check |
| Timer not cancelled on re-trigger → premature dismiss | Gate 2 Layer 2 | Timer lifecycle check |
| Duplicate word counting in dedup → inflated overlap | Gate 2 Layer 3 | Logic review of algorithm |
| `undoLastActivity` override drops original behavior | Gate 1 | "Overriding function — need to read original" |
| Icons cramped, groups too close | Gate 3 | Post-deploy visual review |

---

## §7 — Updating This Document

This spec evolves. After each session, if a bug escaped all three gates, add it:

1. Identify which gate should have caught it
2. Add a specific check to that gate's checklist
3. If it's a new failure class, add it to §6

The spec gets stricter over time, never looser.

---

*This document is attached to every SproutLab build session. It is read before the feature spec. It is non-negotiable.*
