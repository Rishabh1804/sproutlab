#!/usr/bin/env node
/*
 * build-gallery.mjs — presentation page for the party artwork.
 *
 * Embeds the two boards as live vector SVG (not screenshots), so the preview
 * is the same artwork the printer receives, crisp at any zoom.
 *
 *   node build-gallery.mjs   ->  gallery.html
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FONTS = readFileSync(join(HERE, 'fonts.css'), 'utf8');

const svgOf = (file) => {
  const h = readFileSync(join(HERE, file), 'utf8');
  return h.slice(h.indexOf('<svg'), h.lastIndexOf('</svg>') + 6);
};
/* Both boards define the same gradient/filter ids. Namespace the second copy
   so the first one's <defs> cannot capture the second one's references. */
const namespaceIds = (svg, suffix) => {
  const ids = [...svg.matchAll(/\sid="([A-Za-z][\w-]*)"/g)].map((m) => m[1]);
  let out = svg;
  for (const id of new Set(ids)) {
    out = out.replaceAll(` id="${id}"`, ` id="${id}${suffix}"`);
    out = out.replaceAll(`url(#${id})`, `url(#${id}${suffix})`);
    out = out.replaceAll(`clip-path="url(#${id}${suffix})"`, `clip-path="url(#${id}${suffix})"`);
  }
  return out;
};

const backdrop = namespaceIds(svgOf('backdrop.html'), '-bd');
const welcome  = namespaceIds(svgOf('welcome-board.html'), '-wb');

const html = `<title>Ziva's Winter ONEderland</title>
<style>
${FONTS}
/* A deliberate single-world page: it is a night-sky press kit, so it commits
   to the poster's own palette in both host themes rather than inverting. */
:root{
  --night:#0a1830; --panel:#0f2240; --panel-2:#132a4d; --line:rgba(111,179,217,.22);
  --ink:#eaf4fb; --mid:#a8c6de; --dim:#7e9db8;
  --glacier:#6fb3d9; --frost:#cfe8f7; --gold:#f4d79a; --mint:#8fe3c4;
  --disp:'Poiret One',Georgia,serif;
  --sans:'Jura',system-ui,-apple-system,'Segoe UI',sans-serif;
  --serif:'Gloock',Georgia,serif;
}
*{box-sizing:border-box}
body{
  margin:0;background:var(--night);color:var(--ink);
  font-family:var(--sans);font-weight:300;line-height:1.62;
  background-image:radial-gradient(1200px 620px at 50% -12%,#16345c 0%,rgba(10,24,48,0) 68%);
}
.wrap{max-width:1140px;margin:0 auto;padding:clamp(32px,6vw,76px) clamp(18px,4vw,36px) 84px}

header{text-align:center;margin-bottom:clamp(34px,5vw,58px)}
.kicker{font-size:12px;font-weight:500;letter-spacing:.30em;text-transform:uppercase;
  color:var(--glacier);margin:0 0 18px}
h1{font-family:var(--disp);font-weight:400;font-size:clamp(38px,8vw,74px);
  letter-spacing:.055em;margin:0;line-height:1.06;text-wrap:balance}
h1 em{font-family:var(--serif);font-style:normal;letter-spacing:.01em}
.sub{color:var(--mid);font-size:clamp(15px,2vw,17px);max-width:60ch;margin:16px auto 0;text-wrap:balance}

.board{margin:clamp(34px,5vw,60px) 0 0}
.board-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:10px 16px;margin:0 0 16px}
.board-head h2{font-family:var(--disp);font-weight:400;font-size:clamp(22px,3.4vw,31px);
  letter-spacing:.05em;margin:0}
.tag{font-size:11px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;
  color:var(--gold);border:1px solid rgba(244,215,154,.34);border-radius:999px;padding:4px 12px;white-space:nowrap}
.board-note{color:var(--mid);font-size:15px;margin:0 0 18px;max-width:70ch}
.frame{border:1px solid var(--line);border-radius:14px;overflow:hidden;
  box-shadow:0 22px 60px rgba(0,0,0,.46);background:var(--night);line-height:0}
.frame svg{display:block;width:100%;height:auto}
.frame.portrait{max-width:620px}

.specs{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:1px;
  background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden;margin-top:20px}
.spec{background:var(--panel);padding:16px 18px}
.spec dt{font-size:10.5px;font-weight:500;letter-spacing:.17em;text-transform:uppercase;
  color:var(--dim);margin:0 0 6px}
.spec dd{margin:0;font-size:15.5px;color:var(--ink);font-variant-numeric:tabular-nums}

section.panel{margin-top:clamp(40px,6vw,68px);background:var(--panel);
  border:1px solid var(--line);border-radius:16px;padding:clamp(22px,3.4vw,34px)}
section.panel h3{font-family:var(--disp);font-weight:400;font-size:clamp(20px,2.8vw,26px);
  letter-spacing:.05em;margin:0 0 6px}
section.panel p{color:var(--mid);margin:10px 0 0;max-width:74ch}
section.panel p:first-of-type{margin-top:14px}
ul.checks{list-style:none;padding:0;margin:16px 0 0;display:grid;gap:11px}
ul.checks li{position:relative;padding-left:26px;color:var(--mid);font-size:15.5px}
ul.checks li::before{content:"";position:absolute;left:4px;top:.62em;width:7px;height:7px;
  border-radius:50%;background:var(--glacier);box-shadow:0 0 0 3px rgba(111,179,217,.16)}
ul.checks li strong{color:var(--ink);font-weight:500}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.9em;
  background:var(--panel-2);border:1px solid var(--line);border-radius:5px;padding:1px 6px;color:var(--frost)}
.lore{border-left:2px solid var(--gold);padding-left:20px;margin-top:16px}
.lore p{color:var(--frost)}
.palette{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.sw{display:flex;align-items:center;gap:9px;font-size:12.5px;color:var(--mid);
  background:var(--panel-2);border:1px solid var(--line);border-radius:999px;padding:5px 13px 5px 6px}
.sw i{width:19px;height:19px;border-radius:50%;display:block;border:1px solid rgba(255,255,255,.16)}
footer{margin-top:52px;text-align:center;color:var(--dim);font-size:13.5px}
@media (max-width:640px){ .frame{border-radius:10px} }
</style>

<div class="wrap">
<header>
  <p class="kicker">Party artwork · 4 September 2026</p>
  <h1>Ziva's Winter <em>ONE</em>derland</h1>
  <p class="sub">Two print-ready boards for a first birthday — a photo-wall backdrop and an
  entrance welcome board, drawn as vector so they stay sharp from a phone screen to six feet wide.</p>
</header>

<div class="board">
  <div class="board-head"><h2>The photo backdrop</h2><span class="tag">6 ft × 4 ft</span></div>
  <p class="board-note">Built for the photo wall. All the lettering sits in the upper half and the
  bottom third is left as quiet snowfield — that is the band people stand in front of, so nothing
  important ends up behind a guest's head.</p>
  <div class="frame">${backdrop}</div>
  <dl class="specs">
    <div class="spec"><dt>Print size</dt><dd>72 × 48 in</dd></div>
    <div class="spec"><dt>Ratio</dt><dd>3 : 2 landscape</dd></div>
    <div class="spec"><dt>Send to printer</dt><dd>print-backdrop.pdf</dd></div>
    <div class="spec"><dt>Material</dt><dd>Matte flex / vinyl</dd></div>
  </dl>
</div>

<div class="board">
  <div class="board-head"><h2>The welcome board</h2><span class="tag">A2 portrait</span></div>
  <p class="board-note">For the entrance, an easel, or the cake table. A greeting, not a briefing —
  no date, no venue, and an unlabelled sky. The stack ends on what her name stands for:
  <em>Ziva</em> means radiance, and the one gold word on the board is exactly that.</p>
  <div class="frame portrait">${welcome}</div>
  <dl class="specs">
    <div class="spec"><dt>Print size</dt><dd>420 × 594 mm</dd></div>
    <div class="spec"><dt>Ratio</dt><dd>A2 portrait</dd></div>
    <div class="spec"><dt>Send to printer</dt><dd>print-welcome-board.pdf</dd></div>
    <div class="spec"><dt>Material</dt><dd>300 gsm matte board</dd></div>
  </dl>
</div>

<section class="panel">
  <h3>The detail in the top corner</h3>
  <div class="lore">
    <p>The constellation beneath the gold star is <strong>Lyra</strong> — the pattern that rode
    high over Jamshedpur at 5:09 pm on the evening Ziva was born, Vega blazing at its crown.
    <em>Ziva</em> means radiance. So the sky on these boards is not decoration: it is her sky,
    and the theme and her name turn out to be the same word said twice.</p>
  </div>
  <p>The backdrop names it quietly (Vega, <em>her first sky</em>); the welcome board leaves the
  sky unlabelled and says it in words instead — <em>her name means Radiance</em>. Most guests
  will read a pretty constellation; the people who know will know.</p>
</section>

<section class="panel">
  <h3>Taking it to the printer</h3>
  <ul class="checks">
    <li><strong>Send the PDF, not the PNG.</strong> The PDFs are vector with the fonts embedded, so
    they scale to any size with no softness. The PNGs are proofs for approving on a screen.</li>
    <li><strong>Scaling is safe.</strong> The backdrop PDF is already 72 × 48 in. If your printer
    wants a different size, any proportional 3:2 scale prints identically — 8 × 5⅓ ft, 4½ × 3 ft.</li>
    <li><strong>Ask for 2–3 in of bleed</strong> on the flex backdrop for the eyelet hem, and tell
    them to extend the background rather than shrink the artwork.</li>
    <li><strong>Matte, not glossy.</strong> A dark night-sky print under party lighting will mirror
    every bulb if it is laminated glossy.</li>
    <li><strong>Colour.</strong> It is a deep-blue design; ask for a colour proof if they convert to
    CMYK, since dark blues can shift muddy on cheap flex.</li>
  </ul>
</section>

<section class="panel">
  <h3>Changing the details</h3>
  <p>Time and venue are placeholders. Open <code>build-posters.mjs</code>, edit the
  <code>PARTY</code> block at the top — name, date, time, place, and the wording of the two small
  lines — then run <code>node build-posters.mjs &amp;&amp; ./render.sh</code> to regenerate every file.
  The snow is seeded, so nothing else moves between one run and the next.</p>
  <div class="palette">
    <span class="sw"><i style="background:#0a1830"></i>Polar night</span>
    <span class="sw"><i style="background:#16345c"></i>Deep ice</span>
    <span class="sw"><i style="background:#6fb3d9"></i>Glacier</span>
    <span class="sw"><i style="background:#cfe8f7"></i>Frost</span>
    <span class="sw"><i style="background:#8fe3c4"></i>Aurora</span>
    <span class="sw"><i style="background:#f4d79a"></i>Vega gold</span>
  </div>
</section>

<footer>Poiret One · Gloock · Jura — subset and embedded, so no print shop can substitute a fallback face.</footer>
</div>
`;

writeFileSync(join(HERE, 'gallery.html'), html);
console.log('built  gallery.html  (%d KB)', Math.round(html.length / 1024));
