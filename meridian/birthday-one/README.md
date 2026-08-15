# Ziva's Winter ONEderland — first birthday artwork

Party artwork for Ziva's first birthday, **4 September 2026**. Two print-ready
boards drawn entirely as vector, so one source scales from a phone preview to a
six-foot backdrop with no loss.

| File | What it is | Print size |
|------|-----------|-----------|
| `print-backdrop.pdf` | Photo-wall backdrop, landscape | 72 × 48 in (6 × 4 ft), 3:2 |
| `print-welcome-board.pdf` | Entrance / easel welcome board, portrait | 420 × 594 mm (A2) |
| `proof-backdrop.png`, `proof-welcome-board.png` | On-screen proofs for approval | — |
| `gallery.html` | Presentation page showing both boards + these specs | — |
| `backdrop.html`, `welcome-board.html` | The artwork sources (self-contained) | — |

**Send the printer the PDFs.** They are vector with all four fonts embedded as
subsets, so nothing can substitute a fallback face. The PNGs are proofs only.

## Design

A polar night over glacier peaks: aurora ribbons, procedurally generated
six-fold snow crystals, layered ridgelines, and a hero **ONE** carved as faceted
ice with a warm edge-light.

The constellation in the upper corner is **Lyra**, with **Vega** in gold — the
sky that rode over Jamshedpur at 5:09 pm IST on 4 September 2025, the moment
Ziva was born. *Ziva* means radiance; Vega blazed at that constellation's crown.
The winter theme and her name meet in the same image. See `../birth-sky.html`
for the full birth-sky keepsake.

**Type.** Poiret One (art-deco hairlines — the frost-filigree voice) for the
name, Gloock (high-contrast display serif) for the carved ONE, Jura (angular
geometric sans) for details.

**Palette.** `#0a1830` polar night · `#16345c` deep ice · `#6fb3d9` glacier ·
`#cfe8f7` frost · `#f6fbff` snow · `#8fe3c4`/`#b9a6e8` aurora · `#f4d79a` Vega
gold. The gold is reserved for starlight and the ice edge-light only.

**Composition note.** On the backdrop all lettering sits in the upper half and
the bottom third is deliberately quiet snowfield — that is the band guests stand
in front of, so nothing important ends up behind someone's head.

## Printing notes

- **Scaling is safe.** Any proportional scale of the backdrop's 3:2 prints
  identically — 8 × 5⅓ ft, 4½ × 3 ft, etc.
- **Ask for 2–3 in of bleed** on flex for the eyelet hem, and ask them to extend
  the background rather than shrink the artwork.
- **Matte, not glossy.** A dark night-sky print under party lighting mirrors
  every bulb if laminated glossy.
- **Colour.** Request a proof if they convert to CMYK — deep blues can go muddy
  on cheap flex.

## Changing the details

Time and venue are placeholders. Edit the `PARTY` block at the top of
`build-posters.mjs`, then:

```bash
node build-posters.mjs   # regenerate both boards
./render.sh              # regenerate proofs (PNG) + print files (PDF)
node build-gallery.mjs   # regenerate the presentation page
```

The snowfall is seeded, so nothing else shifts between one run and the next — a
poster that reshuffles itself between the proof and the print run is a liability.

## How it is built

- `make_fonts.py` — subsets the three faces and base64-embeds them as WOFF2
  (41 KB total) into `fonts.css`.
- `measure.py` — extracts real glyph advance widths into `metrics.json`, so the
  "Winter **ONE** derland" lockup is composed from true measurements and the
  words cannot collide.
- `build-posters.mjs` — draws both boards as one SVG each.
- `render.sh` — headless Chromium → proof PNGs (cropped to the exact aspect box)
  and print PDFs.
- `build-gallery.mjs` — embeds both boards as live vector into `gallery.html`.

Text styling lives on the SVG elements as presentation attributes rather than in
page CSS, so an SVG lifted out of these files into any other document arrives
fully styled.

## On the theme

This is an original winter-wonderland / ice-palace treatment — snow crystals,
aurora, glacier peaks, carved ice lettering. It deliberately contains no Disney
characters or logotype, so it is safe to hand to any print shop. If you want
Elsa and Olaf at the party, add them physically as cutouts, balloons or stickers
against this backdrop.
