#!/usr/bin/env node
// audit-who-velocity-v1.mjs — PC-9 cited-registry gate for the #161 weight-jump check
// (spec docs/specs/paracetamol-weight-check-v1.md §4.2). Fail-closed: a missing file, a sha256 that is not
// the one recorded for that file, an unreadable sheet, a header that is not what we expect, or any
// mismatch fails the build.
//   1. Each committed source (docs/research/who-growth/) hashes to ITS line in data.js's provenance comment.
//   2. WHO_WT_VELOCITY[sex][2|3] === the rows of ttt-weight-{girls,boys}-{2,3}mon-p.xlsx exactly:
//      [start, P1, P99, L, M, S, Delta], starts 0..(24 − k), read from the sheet named after the file.
//   3. Every velocity row — the xlsx rows and the PDF-transcribed WHO_WT_VELOCITY_LONG rows — agrees with
//      its own L/M/S: P = M·(1 + L·S·z)^(1/L) − Delta at z = ±2.326 within 1 g. (The build cannot re-read a
//      PDF; this is the transcription check for those four rows.)
//   4. WHO_WT_DZ_KNOTS[sex] = [61|91|122|183, up, down], each recomputed from the rows above and
//      WHO_WFA_LMS (z0 = 0 at the start month, ending at 24 m, WHO restricted z), equal at 0.01.
// The real check runs first; then a self-test proves each path rejects a perturbation.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { readSheet } from './who-xlsx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(HERE, '../docs/research/who-growth');
const SEX = { f: 'girls', m: 'boys' };
const Z99 = 2.326348;
const KNOT_DAYS = { 2: 61, 3: 91, 4: 122, 6: 183 };

function fail(msg) { console.error('audit-who-velocity-v1: FAIL — ' + msg); process.exit(1); }

const dataSrc = fs.readFileSync(path.join(HERE, 'data.js'), 'utf8');
function grab(name) {
  const start = dataSrc.indexOf('const ' + name + ' = {');
  if (start < 0) fail(name + ' not found in data.js');
  let depth = 0, i = dataSrc.indexOf('{', start);
  for (; i < dataSrc.length; i++) { if (dataSrc[i] === '{') depth++; else if (dataSrc[i] === '}' && --depth === 0) break; }
  return vm.runInNewContext('(' + dataSrc.slice(dataSrc.indexOf('{', start), i + 1) + ')');
}
function recordedHash(label, src) {
  const block = src.slice(Math.max(0, src.indexOf('const WHO_WT_VELOCITY =') - 4000), src.indexOf('const WHO_WT_VELOCITY ='));
  const m = block.match(new RegExp('//\\s+' + label.replace(/-/g, '\\-') + '\\s+([0-9a-f]{64})'));
  return m ? m[1] : null;
}

// ── read the committed sources ──
function readVelocity(sex, k) {
  const name = `ttt-weight-${SEX[sex]}-${k}mon-p`;
  const file = path.join(SRC_DIR, name + '.xlsx');
  const rows = readSheet(file, name.replace(/-/g, '_'));
  const col = {};
  for (const [ref, v] of Object.entries(rows[0])) if (typeof v === 'string') col[v.trim()] = ref;
  for (const need of ['Interval', 'L', 'M', 'S', 'Delta', '1st', '99th']) if (!col[need]) throw new Error(name + ': missing column ' + need);
  const out = rows.slice(1).filter(r => typeof r[col.Interval] === 'string').map(r => {
    const m = String(r[col.Interval]).match(/^(\d+)-(\d+) mo$/);
    if (!m || +m[2] - +m[1] !== k) throw new Error(name + ': unexpected interval ' + r[col.Interval]);
    return [+m[1], r[col['1st']], r[col['99th']], r[col.L], r[col.M], r[col.S], r[col.Delta]];
  });
  if (out.length !== 25 - k || out.some((r, i) => r[0] !== i)) throw new Error(name + ': expected starts 0–' + (24 - k));
  return out;
}

const pInc = (L, M, S, Delta, z) => (Math.abs(L) < 1e-6 ? M * Math.exp(z * S) : M * Math.pow(1 + L * S * z, 1 / L)) - Delta;
function wfaZ(w, LMS) {
  const [L, M, S] = LMS;
  const x = k => M * Math.pow(1 + L * S * k, 1 / L);
  const z = (Math.pow(w / M, L) - 1) / (L * S);
  if (z > 3) return 3 + (w - x(3)) / (x(3) - x(2));
  if (z < -3) return -3 + (w - x(-3)) / (x(-2) - x(-3));
  return z;
}

function check(VEL, LONG, KNOTS, WFA, files) {
  const errs = [];
  for (const sex of ['f', 'm']) {
    for (const k of [2, 3]) {
      const reg = VEL[sex] && VEL[sex][k];
      if (!Array.isArray(reg) || reg.length !== 25 - k) { errs.push(`${sex} ${k}-month: WHO_WT_VELOCITY must hold ${25 - k} rows`); continue; }
      files[sex][k].forEach((r, i) => {
        if (JSON.stringify(reg[i]) !== JSON.stringify(r)) errs.push(`${sex} ${k}-month row ${i}: registry ${JSON.stringify(reg[i])} ≠ file ${JSON.stringify(r)}`);
        const [, p1, p99, L, M, S, D] = r;
        for (const [p, z] of [[p1, -Z99], [p99, Z99]]) {
          const d = Math.abs(pInc(L, M, S, D, z) - p);
          if (!(d <= 1)) errs.push(`${sex} ${k}-month row ${i}: P from L/M/S off the file by ${d.toFixed(1)} g`);
        }
      });
    }
    for (const k of [4, 6]) {
      const r = LONG[sex] && LONG[sex][k];
      if (!Array.isArray(r) || r.length !== 7) { errs.push(`${sex} ${k}-month: WHO_WT_VELOCITY_LONG row missing`); continue; }
      const [start, L, M, S, D, p1, p99] = r;
      if (start !== 24 - k) errs.push(`${sex} ${k}-month: LONG row must start at ${24 - k}`);
      for (const [p, z] of [[p1, -Z99], [p99, Z99]]) {
        const d = Math.abs(pInc(L, M, S, D, z) - p);
        if (!(d <= 1)) errs.push(`${sex} ${k}-month LONG row: P${z < 0 ? 1 : 99} ${p} is ${d.toFixed(1)} g off its own L/M/S`);
      }
    }
    const kn = KNOTS[sex];
    if (!Array.isArray(kn) || kn.length !== 4) { errs.push(`${sex}: WHO_WT_DZ_KNOTS must hold 4 knots`); continue; }
    [2, 3, 4, 6].forEach((k, i) => {
      const [days, up, down] = kn[i] || [];
      if (days !== KNOT_DAYS[k]) errs.push(`${sex} knot ${i}: day ${days} ≠ ${KNOT_DAYS[k]}`);
      let start, p1, p99;
      if (k <= 3) { const row = (VEL[sex][k] || []).find(r => r[0] === 24 - k) || []; [start, p1, p99] = row; }
      else { const r = LONG[sex][k] || []; start = r[0]; p1 = r[5]; p99 = r[6]; }
      if (!WFA[sex] || !WFA[sex][start] || !WFA[sex][24] || !Number.isFinite(p1) || !Number.isFinite(p99)) { errs.push(`${sex} ${KNOT_DAYS[k]}-day knot: no row to recompute it from`); return; }
      const w0 = WFA[sex][start][1];
      const upC = Math.round(wfaZ(w0 + p99 / 1000, WFA[sex][24]) * 100) / 100;
      const dnC = Math.round(-wfaZ(w0 + p1 / 1000, WFA[sex][24]) * 100) / 100;
      if (up !== upC || down !== dnC) errs.push(`${sex} ${KNOT_DAYS[k]}-day knot: stored [${up}, ${down}] ≠ recomputed [${upC}, ${dnC}]`);
    });
  }
  return errs;
}

// sha256 of every committed source, against its own recorded line
const SOURCES = [];
for (const sex of ['f', 'm']) {
  for (const k of [2, 3]) SOURCES.push([`${SEX[sex]}-${k}mon`, `ttt-weight-${SEX[sex]}-${k}mon-p.xlsx`]);
  for (const k of [4, 6]) SOURCES.push([`${SEX[sex]}-${k}mon-pdf`, `lms_weight_${SEX[sex]}_${k}mon_p.pdf`]);
}
const fileHash = {};
for (const [label, name] of SOURCES) {
  const p = path.join(SRC_DIR, name);
  if (!fs.existsSync(p)) fail('missing source file docs/research/who-growth/' + name);
  fileHash[label] = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}
// Every source's sha256 against ITS recorded line in a data.js text — a function, so the self-test can
// prove the rejection on a perturbed text (Cipher #288 nit 6).
function hashErrs(src) {
  const out = [];
  for (const [label, name] of SOURCES) {
    const rec = recordedHash(label, src);
    if (!rec) out.push(`${name}: no recorded sha256 ("${label}") in the WHO_WT_VELOCITY provenance comment`);
    else if (rec !== fileHash[label]) out.push(`${name}: sha256 ${fileHash[label]} ≠ the recorded ${rec}`);
  }
  return out;
}
{ const he = hashErrs(dataSrc); if (he.length) fail(he.join('; ')); }

let files;
try {
  files = { f: { 2: readVelocity('f', 2), 3: readVelocity('f', 3) }, m: { 2: readVelocity('m', 2), 3: readVelocity('m', 3) } };
} catch (e) { fail('could not read the WHO velocity files: ' + e.message); }

const VEL = grab('WHO_WT_VELOCITY'), LONG = grab('WHO_WT_VELOCITY_LONG'), KNOTS = grab('WHO_WT_DZ_KNOTS'), WFA = grab('WHO_WFA_LMS');
let errs;
try { errs = check(VEL, LONG, KNOTS, WFA, files); } catch (e) { fail('the registry is malformed: ' + e.message); }
if (errs.length) { errs.slice(0, 20).forEach(e => console.error('  ' + e)); fail(errs.length + ' mismatch(es)'); }

// Self-test, after the real check passed.
const clone = o => JSON.parse(JSON.stringify(o));
const bad = [];
const v1 = clone(VEL); v1.f[2][12][2] += 1; if (!check(v1, LONG, KNOTS, WFA, files).length) bad.push('velocity cell');
const l1 = clone(LONG); l1.m[6][6] += 5; if (!check(VEL, l1, KNOTS, WFA, files).length) bad.push('PDF row transcription');
const k1 = clone(KNOTS); k1.f[3][1] = Math.round((k1.f[3][1] + 0.01) * 100) / 100; if (!check(VEL, LONG, k1, WFA, files).length) bad.push('knot');
const f1 = clone(files); f1.m[3][5][1] += 10; if (!check(VEL, LONG, KNOTS, WFA, f1).length) bad.push('file vs registry');
if (!hashErrs(dataSrc.replace(/girls-2mon [0-9a-f]{64}/, 'girls-2mon ' + '0'.repeat(64))).length) bad.push('hash mismatch');
if (!hashErrs(dataSrc.replace(/boys-6mon-pdf\s+[0-9a-f]{64}/, '')).length) bad.push('missing hash line');
const v2 = clone(VEL); v2.f[2].pop(); if (!check(v2, LONG, KNOTS, WFA, files).length) bad.push('dropped row');
const l2 = clone(LONG); delete l2.f[6]; if (!check(VEL, l2, KNOTS, WFA, files).length) bad.push('missing long row');
if (bad.length) fail('self-test: the checker did not reject: ' + bad.join(', '));
console.error('audit-who-velocity-v1: PASS (WHO_WT_VELOCITY = the committed 2-/3-month files, per-file sha256 incl. the 4-/6-month PDFs, every row on its own L/M/S, Δz knots recomputed; self-test ok)');
