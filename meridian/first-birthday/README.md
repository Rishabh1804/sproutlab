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
  *"Our little snowflake is turning one"*; the **snow queen** fades in on
  the far ridge and raises her arm
- 2.4–3.0s — her conjuring sends a sparkle stream into the snow-gust wipe
  (synced glissando) with cartoon star-pops
- 3.0–4.7s — **ZIVA** pops in letter by letter (single-overshoot
  squash-and-stretch) with an ice-shimmer sweep, then **TURNS ONE**
- 4.7–7.3s — the frosted-glass card lands with one soft boing, rows stagger
  in and sit dead-still for the reading dwell; at 6.15s the **snowman**
  waddles in along the drifts carrying Ziva's candle-lit cake (synced
  boing-boing foley), the **arctic fox** trotting behind
- 7.3–10s — *"See you there!"* — the snowman waves with happy eyes, the fox
  swishes her tail, star-pops burst, and everything settles into a complete
  final frame (the video's last frame works as a still invite too)

Scene: arctic-night gradient, aurora ribbons, crescent moon, 150 twinkling
stars + Lyra, three parallax snowfall layers, pine ridge and snow drifts,
frosted corners and an icy border frame. Type: Cormorant Garamond, Great
Vibes, Montserrat (embedded as data URIs).

**Cartoon round (council-shaped, reference-calibrated).** The cartoon energy
lives in *motion and performers*, not in the art style: single-overshoot
entrances, confined star-pops, and three original characters — a coloured
ice queen (golden-platinum braid, fair skin, teal ice-gown; faceless at
distance, deliberately not any studio's character design), a classic
carrot-nose snowman in a sage scarf and amber knit cap, and an arctic fox.
A family-provided reference e-card informed the *composition only* (big
flanking characters, the snowflake date-medallion, "Join us for a Frozen
celebration" wording, ornate double card frame). No Disney assets or
on-model characters anywhere: the invite remains entirely the family's own
artwork, safe to share publicly.
