// docs/*.html generator for prose reference docs — the /doc-render pattern (Lyra's Builder skill),
// generalized to a small manifest of Markdown reference docs that share one renderer.
//
// Each .md remains the SOURCE OF TRUTH; each .html is a generated VIEW, rebuilt every build from the
// .md, so it cannot drift. NEVER hand-edit the .html. Self-contained: Fraunces/Nunito (CDN), the design
// tokens inline, light + dark, a section TOC from the ## headings — the same house style as
// build-design-principles.mjs (the worked instance). To add a doc, append to DOCS below.
//
// Renderer is the worked instance's, with hardening for denser/arbitrary docs: a collision-safe NUL
// code-span sentinel (the worked instance's space-digit-space one can clash with bare numbers like
// "30K"/"2.5"), inline *italic* support, ordered-list ordinals preserved via <li value=N>, and a link
// protocol allow-list (http(s)/mailto/#/relative only; javascript:/data: dropped).
// Known coverage gaps (fine for the current corpus; mind them before adding a doc that uses them):
// no nested/indented lists (they flatten), no inline images, no HTML passthrough.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── the manifest: prose reference docs that get a styled, build-regenerated HTML twin ──
const DOCS = [
  { src: 'SESSION_CLOSE_SEQUENCE.md',     out: 'SESSION_CLOSE_SEQUENCE.html',     title: 'Session Close Sequence' },
  { src: 'QA_GATE_SPEC.md',               out: 'QA_GATE_SPEC.html',               title: 'QA Gate Spec' },
  { src: 'SPROUTLAB_QUICK_REFERENCE.md',  out: 'SPROUTLAB_QUICK_REFERENCE.html',  title: 'Quick Reference' },
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slug = s => s.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60);

// ── inline: protect `code` with a NUL sentinel, escape, then **bold** / *italic* / [links] ──
function inline(s) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (m, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
  s = esc(s);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(\S[^*\n]*?\S|\S)\*/g, '<em>$1</em>');           // *italic* (no leading/trailing space)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => {       // links — protocol allow-list (Cipher: drop javascript:/data: etc.)
    const url = u.trim(), safe = /^(https?:\/\/|mailto:|#)/i.test(url) || !url.includes(':');
    return safe ? '<a href="' + esc(url) + '">' + esc(t) + '</a>' : esc(t);
  });
  s = s.replace(/\u0000(\d+)\u0000/g, (m, idx) => '<code>' + esc(codes[idx]) + '</code>');
  return s;
}

function renderMarkdown(md) {
  const lines = md.split('\n');
  const toc = [];
  let out = '', i = 0;

  function tableBlock() {
    const rows = [];
    while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(lines[i]); i++; }
    if (rows.length < 2) return rows.map(r => '<p>' + inline(r) + '</p>').join('');
    const cells = r => r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim());
    const head = cells(rows[0]);
    let h = '<div class="tbl-wrap"><table><thead><tr>' + head.map(c => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>';
    for (let r = 2; r < rows.length; r++) {
      h += '<tr>' + cells(rows[r]).map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>';
    }
    return h + '</tbody></table></div>';
  }

  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {                                    // fenced code
      i++; let code = '';
      while (i < lines.length && !/^```/.test(lines[i])) { code += lines[i] + '\n'; i++; }
      i++;
      out += '<pre><code>' + esc(code.replace(/\n$/, '')) + '</code></pre>';
      continue;
    }
    if (/^\s*\|/.test(line)) { out += tableBlock(); continue; }  // table
    const hm = line.match(/^(#{1,4})\s+(.*)$/);                 // heading
    if (hm) {
      const lvl = hm[1].length, txt = hm[2].trim(), id = slug(txt);
      if (lvl === 2) toc.push({ id, txt });
      out += '<h' + lvl + ' id="' + id + '">' + inline(txt) + '</h' + lvl + '>';
      i++; continue;
    }
    if (/^---+\s*$/.test(line)) { out += '<hr>'; i++; continue; } // hr
    if (/^>\s?/.test(line)) {                                    // blockquote
      let q = '';
      while (i < lines.length && /^>\s?/.test(lines[i])) { q += lines[i].replace(/^>\s?/, '') + ' '; i++; }
      out += '<blockquote>' + inline(q.trim()) + '</blockquote>';
      continue;
    }
    if (/^[-*]\s+/.test(line)) {                                // ul
      out += '<ul>';
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) { out += '<li>' + inline(lines[i].replace(/^[-*]\s+/, '')) + '</li>'; i++; }
      out += '</ul>';
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {                               // ol
      out += '<ol>';
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        const n = lines[i].match(/^(\d+)\./)[1];   // keep the authored number (Vela V-V-1)
        out += '<li value="' + n + '">' + inline(lines[i].replace(/^\d+\.\s+/, '')) + '</li>'; i++;
      }
      out += '</ol>';
      continue;
    }
    if (/^\s*$/.test(line)) { i++; continue; }                  // blank

    let p = line; i++;                                          // paragraph
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,4}\s|>\s?|[-*]\s|\d+\.\s|```|\s*\||---+\s*$)/.test(lines[i])) {
      p += ' ' + lines[i]; i++;
    }
    out += '<p>' + inline(p) + '</p>';
  }
  return { body: out, toc };
}

function page({ title, srcRel, body, toc }) {
  const tocHtml = toc.map(t => '<a href="#' + t.id + '">' + esc(t.txt) + '</a>').join('');
  return `<!DOCTYPE html>
<!-- GENERATED from docs/${srcRel} by split/build-doc-views.mjs — do NOT hand-edit.
     The .md is the source of truth; this is a styled view, rebuilt each build. -->
<html lang="en" data-theme="">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>SproutLab — ${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --cream:#fffaf7;--warm:#fef6f0;--text:#3d2e2e;--mid:#6e5858;--light:#806c6c;--card:#fff;--line:#ece2dc;
    --sage:#b5d5c5;--sage-light:#e8f5ef;--tc-sage:#3a7060;--rose:#f2a8b8;--rose-light:#fde8ed;--tc-rose:#9e3e52;
    --amber:#e8b86d;--amber-light:#fef6e8;--tc-amber:#8a6520;--sky:#a8cfe0;--sky-light:#e8f4fa;--tc-sky:#336580;
    --lav:#c9b8e8;--lav-light:#f0ebf9;--tc-lav:#6e5e9a;--shadow:rgba(180,120,120,.13);--codebg:#f4ece8;--codefg:#9e3e52;
  }
  [data-theme="dark"]{
    --cream:#1a1520;--warm:#221c28;--text:#e8e0ec;--mid:#b0a0b8;--light:#9a8aa2;--card:#2a2230;--line:#3a3040;
    --sage-light:#1e3028;--rose-light:#3a2030;--amber-light:#352e1e;--sky-light:#1e2838;--lav-light:#241d33;
    --tc-sage:#7ac0a0;--tc-rose:#e090a8;--tc-amber:#d4a848;--tc-sky:#80b8d8;--tc-lav:#b8a8e0;--shadow:rgba(0,0,0,.3);--codebg:#2f2636;--codefg:#e090a8;
  }
  *{box-sizing:border-box;}
  body{margin:0;background:var(--warm);color:var(--text);font-family:'Nunito',sans-serif;line-height:1.6;}
  .wrap{max-width:1180px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:236px 1fr;gap:40px;}
  @media(max-width:880px){.wrap{grid-template-columns:1fr;}.toc{display:none;}}
  .toc{position:sticky;top:0;align-self:start;max-height:100vh;overflow:auto;padding:28px 0;}
  .toc-h{font-family:'Nunito';font-weight:800;font-size:.66rem;letter-spacing:.12em;text-transform:uppercase;color:var(--light);margin:0 0 10px;}
  .toc a{display:block;font-size:.8rem;color:var(--mid);text-decoration:none;padding:5px 10px;border-radius:8px;border-left:2px solid transparent;line-height:1.35;}
  .toc a:hover{background:var(--sage-light);color:var(--tc-sage);border-left-color:var(--sage);}
  main{padding:40px 0 90px;min-width:0;}
  .doc-head{border-bottom:2px solid var(--line);padding-bottom:20px;margin-bottom:8px;}
  .eyebrow{font-weight:800;font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--tc-lav);}
  .gennote{margin-top:12px;font-size:.72rem;color:var(--light);background:var(--lav-light);border-radius:999px;padding:6px 14px;display:inline-block;}
  .gennote code{background:none;color:var(--tc-lav);font-weight:700;}
  h1{font-family:'Fraunces',serif;font-weight:600;font-size:2.4rem;line-height:1.1;margin:.3em 0 .1em;}
  h2{font-family:'Fraunces',serif;font-weight:600;font-size:1.6rem;color:var(--text);margin:1.9em 0 .5em;padding-bottom:.25em;border-bottom:1px solid var(--line);scroll-margin-top:16px;}
  h3{font-family:'Fraunces',serif;font-weight:600;font-size:1.18rem;color:var(--tc-sage);margin:1.5em 0 .35em;}
  h4{font-family:'Nunito';font-weight:800;font-size:.95rem;color:var(--tc-rose);letter-spacing:.01em;margin:1.3em 0 .3em;}
  p{margin:.7em 0;}
  a{color:var(--tc-sky);}
  strong{font-weight:800;color:var(--text);}
  em{font-style:italic;color:var(--mid);}
  code{font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:.82em;background:var(--codebg);color:var(--codefg);border-radius:5px;padding:1px 6px;}
  pre{background:var(--codebg);border-radius:12px;padding:16px 18px;overflow:auto;border:1px solid var(--line);}
  pre code{background:none;color:var(--text);padding:0;font-size:.8rem;line-height:1.5;}
  ul,ol{margin:.6em 0;padding-left:1.4em;} li{margin:.3em 0;}
  blockquote{margin:1em 0;background:var(--amber-light);border-left:3px solid var(--amber);border-radius:10px;padding:12px 16px;color:var(--text);}
  blockquote strong{color:var(--tc-amber);}
  hr{border:none;border-top:1px solid var(--line);margin:2.2em 0;}
  .tbl-wrap{overflow-x:auto;margin:1em 0;border-radius:12px;border:1px solid var(--line);}
  table{border-collapse:collapse;width:100%;font-size:.84rem;}
  th{background:var(--sage-light);color:var(--tc-sage);font-weight:800;text-align:left;padding:10px 13px;border-bottom:2px solid var(--sage);white-space:nowrap;}
  td{padding:9px 13px;border-bottom:1px solid var(--line);vertical-align:top;color:var(--mid);}
  tr:last-child td{border-bottom:none;} td strong{color:var(--text);}
  tbody tr:nth-child(even){background:rgba(181,213,197,.06);}
  .theme-btn{position:fixed;top:16px;right:18px;z-index:10;font-family:'Nunito';font-weight:700;font-size:12px;color:var(--mid);background:var(--card);border:1px solid var(--line);border-radius:999px;padding:7px 14px;cursor:pointer;box-shadow:0 2px 10px var(--shadow);}
</style>
</head>
<body>
<button class="theme-btn" id="themeBtn">◐ Dark</button>
<div class="wrap">
  <nav class="toc"><div class="toc-h">On this page</div>${tocHtml}</nav>
  <main>
    <div class="doc-head">
      <div class="eyebrow">SproutLab</div>
      <span class="gennote">Generated from <code>docs/${srcRel}</code> — the source of truth. Rebuilt each build; don't hand-edit this HTML.</span>
    </div>
    ${body}
  </main>
</div>
<script>
  var btn=document.getElementById('themeBtn');
  btn.addEventListener('click',function(){var d=document.documentElement.getAttribute('data-theme')==='dark';document.documentElement.setAttribute('data-theme',d?'':'dark');btn.textContent=d?'◐ Dark':'◐ Light';});
</script>
</body>
</html>`;
}

for (const doc of DOCS) {
  const srcPath = join(ROOT, 'docs', doc.src);
  const outPath = join(ROOT, 'docs', doc.out);
  const md = readFileSync(srcPath, 'utf8');
  const { body, toc } = renderMarkdown(md);
  const html = page({ title: doc.title, srcRel: doc.src, body, toc });
  writeFileSync(outPath, html);
  console.error('[doc-views] wrote ' + relative(ROOT, outPath) + ' (' + (html.length / 1024).toFixed(1) + ' KB; ' + toc.length + ' sections)');
}
