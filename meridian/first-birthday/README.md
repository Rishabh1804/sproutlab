# Ziva's Frozen First Birthday — Invite Video

A 10-second frozen-theme invite for Ziva's first birthday, built as a keepsake
alongside [`meridian/birth-sky.html`](../birth-sky.html).

**The details on the card:** Friday, 4 September 2026 · 11:30 AM – 3:00 PM ·
Rishi Bhawan.

**The hidden thread:** the constellation twinkling in the upper-right sky is
**Lyra**, with Vega glinting at its head — the same stars that rode radiant
over Jamshedpur at 5:09 pm on 4 September 2025, the moment Ziva was born.
It breathes brighter while her name is on screen.

## Files

| File | What it is |
|------|-----------|
| `ziva-first-birthday-invite.mp4` | The final video — 1080×1920 @ 30fps, H.264 + AAC, WhatsApp-ready |
| `invite.html` | The animation itself — fully self-contained (fonts embedded), deterministic. Open in a browser to watch it loop; `?render=1` exposes `window.seek(t)` for frame rendering |
| `make-audio.py` | Synthesizes the soundtrack: a music-box "Twinkle, Twinkle, Little Star" (public-domain melody) with a glissando at the name reveal and a closing chime — pure numpy, nothing licensed |
| `render.mjs` | Steps `invite.html` through time via Playwright and screenshots every frame |
| `build-video.sh` | One-command pipeline: audio → frames → ffmpeg encode |

## Rebuilding (e.g. to change the date or venue)

Edit the text in `invite.html` (the `#card` rows), then:

```bash
bash meridian/first-birthday/build-video.sh
```

Requires `python3` + numpy, `node` with `playwright-core` on the module path,
a Chromium binary (`CHROMIUM` env, defaults to the Playwright install), and
`ffmpeg` (`FFMPEG` env).

## Design notes

- 0.0–2.4s — a hero snowflake crystallizes over the script line
  *"Our little snowflake is turning one"*
- 2.4–3.0s — a snow-gust wipe with a synced glissando
- 3.0–4.7s — **ZIVA** cascades in letter by letter with an ice-shimmer sweep,
  then **TURNS ONE**
- 4.7–7.3s — the frosted-glass card staggers in: date, time, venue
- 7.3–10s — *"See you there!"* with a sparkle burst, settling on a complete
  final frame (so the video's last frame works as a still invite too)

Scene: arctic-night gradient, aurora ribbons, crescent moon, 150 twinkling
stars + Lyra, three parallax snowfall layers, pine ridge and snow drifts,
frosted corners and an icy border frame. Type: Cormorant Garamond, Great
Vibes, Montserrat (embedded as data URIs). No Disney assets — the theme is
carried entirely by an original winter-wonderland treatment.
