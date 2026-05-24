#!/bin/bash
# build-safe.sh — canonical safe invocation of build.sh.
#
# Why this exists: build.sh writes the HTML payload to STDOUT and audit/log
# output to STDERR. When a caller invokes it with the WRONG redirection
# order — e.g. `bash build.sh > out.html 2>&1` — the `2>&1` merges STDERR
# into STDOUT *after* STDOUT has already been redirected to the file, so
# audit text gets prepended to the HTML and pollutes the rendered page.
# This was the live-production bug behind PR #118.
#
# This wrapper enforces the correct redirection pattern AND validates the
# output before declaring the build successful. Use `pnpm build` (which
# calls this script) instead of invoking build.sh directly.

set -euo pipefail

cd "$(dirname "$0")"
ROOT="$(cd .. && pwd)"
OUT="$ROOT/sproutlab.html"
INDEX="$ROOT/index.html"
LOG="$(mktemp -t sl-build.XXXXXX.log)"
# V-K-86 (Kael synth): single-quoted trap body — `$LOG` expands at exit time
# rather than registration time. Stylistic robustness against future refactors
# that might reassign LOG between trap and exit.
trap 'rm -f "$LOG"' EXIT

# Run build.sh with proper redirection: STDOUT → file, STDERR → log.
# `set -e` will trip if build.sh exits non-zero.
if ! bash build.sh > "$OUT" 2> "$LOG"; then
  echo "BUILD FAILED — build.sh exited non-zero. Tail of build log:" >&2
  tail -20 "$LOG" >&2
  exit 1
fi

# Validate output: must start with <!DOCTYPE html>.
# Catches the STDERR-leak class of bugs (PR #118) plus any future case
# where build.sh's STDOUT gets corrupted.
FIRST="$(head -1 "$OUT")"
if [ "$FIRST" != "<!DOCTYPE html>" ]; then
  echo "BUILD CORRUPTED — $OUT does not start with <!DOCTYPE html>." >&2
  echo "First line was: $FIRST" >&2
  echo "" >&2
  echo "First 10 lines of corrupted output:" >&2
  head -10 "$OUT" >&2
  echo "" >&2
  echo "Last 20 lines of build log (for diagnosis):" >&2
  tail -20 "$LOG" >&2
  exit 1
fi

# V-K-84 (Kael synth): also assert the document ends with </html>. Bounds the
# corruption surface at both ends — catches a class of leak where STDERR text
# arrives AFTER the DOCTYPE line (the first-line check above wouldn't see it)
# but lands somewhere inside the body or after the closing tag.
LAST="$(tail -1 "$OUT")"
if [ "$LAST" != "</html>" ]; then
  echo "BUILD CORRUPTED — $OUT does not end with </html>." >&2
  echo "Last line was: $LAST" >&2
  echo "" >&2
  echo "Last 10 lines of output (for diagnosis):" >&2
  tail -10 "$OUT" >&2
  exit 1
fi

# Validate size: a truncated build would be < 100KB. Real builds are several MB.
# Per Maren advisory: this is belt-and-braces alongside the DOCTYPE/closing-tag
# checks above — the structural checks are the primary corruption guard; size
# catches gross truncation that somehow preserves the bookends.
SIZE="$(wc -c < "$OUT")"
if [ "$SIZE" -lt 102400 ]; then
  echo "BUILD CORRUPTED — $OUT is suspiciously small ($SIZE bytes; expected > 100KB)." >&2
  exit 1
fi

# Mirror to index.html (the served path).
cp "$OUT" "$INDEX"

# Surface the audit-gate output (it was on STDERR, captured to log).
# Show the tail so the parent sees PASS lines without re-running the suite.
tail -10 "$LOG" >&2

echo "Build OK: $OUT ($SIZE bytes); mirrored to $INDEX." >&2
