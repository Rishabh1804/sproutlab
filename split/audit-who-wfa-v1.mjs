#!/usr/bin/env node
// audit-who-wfa-v1.mjs — PC-9 cited-registry gate (spec docs/specs/paracetamol-weight-check-v1.md §4.1).
// WHO_WFA_LMS (data.js) must be exactly the L, M, S columns of the committed WHO weight-for-age files,
// and WHO_GROWTH's weight columns (0–24 m) must sit on the same curve. Fail-closed: a missing file, an
// unreadable sheet, a header that is not what we expect, or any mismatch fails the build.
//   1. Re-extract Month / L / M / S / P3 / P15 / P50 / P85 / P97 from docs/research/who-growth/
//      tab_wfa_{girls,boys}_p_0_5.xlsx (dependency-free: zip central directory + zlib + sheet XML).
//   2. sha256 of each file equals the hash recorded in data.js beside WHO_WFA_LMS.
//   3. WHO_WFA_LMS[sex][m] === [L, M, S] of the file, months 0–60, exactly.
//   4. The P columns recomputed from L/M/S match the file's (rounded to 0.1) within 0.051 kg.
//   5. WHO_GROWTH[sex].W3/W15/W50/W85/W97[0..24] match the L/M/S curve within 0.051 kg.
// Self-test: the checker must reject a perturbed L, a perturbed M and a perturbed WHO_GROWTH cell.
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';
import vm from 'vm';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SRC_DIR = path.join(ROOT, 'docs/research/who-growth');
const FILES = { f: 'tab_wfa_girls_p_0_5.xlsx', m: 'tab_wfa_boys_p_0_5.xlsx' };
const Z = { P3: -1.880794, P15: -1.036433, P50: 0, P85: 1.036433, P97: 1.880794 };
const TOL = 0.051;

function fail(msg) { console.error('audit-who-wfa-v1: FAIL — ' + msg); process.exit(1); }

// ── minimal xlsx reader ──
function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('no zip end record');
  const n = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = {};
  for (let k = 0; k < n; k++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central directory');
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28), xlen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nlen);
    const lnlen = buf.readUInt16LE(local + 26), lxlen = buf.readUInt16LE(local + 28);
    const data = buf.subarray(local + 30 + lnlen + lxlen, local + 30 + lnlen + lxlen + csize);
    out[name] = method === 0 ? data : method === 8 ? zlib.inflateRawSync(data) : null;
    p += 46 + nlen + xlen + clen;
  }
  return out;
}
const unxml = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
function readSheet(file) {
  const z = unzip(fs.readFileSync(file));
  const shared = [];
  if (z['xl/sharedStrings.xml']) {
    for (const si of z['xl/sharedStrings.xml'].toString('utf8').match(/<si>[\s\S]*?<\/si>/g) || []) {
      shared.push(unxml((si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join('')));
    }
  }
  const sheetName = Object.keys(z).filter(k => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort()[0];
  if (!sheetName) throw new Error('no worksheet');
  const rows = [];
  for (const rx of z[sheetName].toString('utf8').match(/<row[^>]*>[\s\S]*?<\/row>/g) || []) {
    const row = {};
    for (const c of rx.match(/<c [^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || []) {
      const ref = (c.match(/r="([A-Z]+)\d+"/) || [])[1];
      const t = (c.match(/ t="([^"]+)"/) || [])[1];
      const v = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      const is = (c.match(/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>/) || [])[1];
      if (!ref) continue;
      row[ref] = t === 's' ? shared[+v] : t === 'inlineStr' ? unxml(is || '') : (v === undefined ? null : Number(v));
    }
    rows.push(row);
  }
  return rows;
}
function table(file) {
  const rows = readSheet(file);
  const head = rows[0];
  const col = {};
  for (const [ref, name] of Object.entries(head)) if (typeof name === 'string') col[name.trim()] = ref;
  for (const need of ['Month', 'L', 'M', 'S', 'P3', 'P15', 'P50', 'P85', 'P97']) if (!col[need]) throw new Error('missing column ' + need);
  const out = rows.slice(1).filter(r => typeof r[col.Month] === 'number').map(r => ({
    month: r[col.Month], L: r[col.L], M: r[col.M], S: r[col.S],
    P3: r[col.P3], P15: r[col.P15], P50: r[col.P50], P85: r[col.P85], P97: r[col.P97],
  }));
  if (out.length !== 61 || out.some((r, i) => r.month !== i)) throw new Error('expected months 0–60');
  return out;
}

// ── the registry as the app sees it ──
const dataSrc = fs.readFileSync(path.join(HERE, 'data.js'), 'utf8');
function grab(name) {
  const start = dataSrc.indexOf('const ' + name + ' = {');
  if (start < 0) fail(name + ' not found in data.js');
  let depth = 0, i = dataSrc.indexOf('{', start);
  for (; i < dataSrc.length; i++) { if (dataSrc[i] === '{') depth++; else if (dataSrc[i] === '}' && --depth === 0) break; }
  return vm.runInNewContext('(' + dataSrc.slice(dataSrc.indexOf('{', start), i + 1) + ')');
}
const pAt = (L, M, S, z) => Math.abs(L) < 1e-6 ? M * Math.exp(z * S) : M * Math.pow(1 + L * S * z, 1 / L);

function check(LMS, GROWTH, files) {
  const errs = [];
  for (const sex of ['f', 'm']) {
    const ref = files[sex];
    if (!Array.isArray(LMS[sex]) || LMS[sex].length !== 61) { errs.push(sex + ': WHO_WFA_LMS must hold 61 rows'); continue; }
    ref.forEach((r, m) => {
      const [L, M, S] = LMS[sex][m] || [];
      if (L !== r.L || M !== r.M || S !== r.S) errs.push(`${sex} month ${m}: registry [${L}, ${M}, ${S}] ≠ file [${r.L}, ${r.M}, ${r.S}]`);
      for (const [k, z] of Object.entries(Z)) {
        const d = Math.abs(pAt(r.L, r.M, r.S, z) - r[k]);
        if (!(d <= TOL)) errs.push(`${sex} month ${m}: ${k} from L/M/S off the file by ${d.toFixed(3)} kg`);
      }
      if (m <= 24) {
        for (const [k, z] of Object.entries({ W3: Z.P3, W15: Z.P15, W50: Z.P50, W85: Z.P85, W97: Z.P97 })) {
          const v = GROWTH[sex] && GROWTH[sex][k] ? GROWTH[sex][k][m] : undefined;
          const d = Math.abs(pAt(r.L, r.M, r.S, z) - v);
          if (!(d <= TOL)) errs.push(`${sex} month ${m}: WHO_GROWTH.${k} = ${v} is ${Number.isFinite(d) ? d.toFixed(3) + ' kg' : 'not a number'} off the L/M/S curve`);
        }
      }
    });
  }
  return errs;
}

let files;
try {
  files = {};
  for (const [sex, name] of Object.entries(FILES)) {
    const p = path.join(SRC_DIR, name);
    if (!fs.existsSync(p)) fail('missing source file docs/research/who-growth/' + name);
    const hash = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    if (!dataSrc.includes(hash)) fail(`${name} sha256 ${hash} is not the hash recorded beside WHO_WFA_LMS in data.js`);
    files[sex] = table(p);
  }
} catch (e) { fail('could not read the WHO source files: ' + e.message); }

const LMS = grab('WHO_WFA_LMS');
const GROWTH = grab('WHO_GROWTH');

// self-test: the checker must catch a wrong L, a wrong M and a drifted WHO_GROWTH cell
const clone = o => JSON.parse(JSON.stringify(o));
const t1 = clone(LMS); t1.f[13][0] += 0.0001;
const t2 = clone(LMS); t2.m[40][1] += 0.01;
const t3 = clone(GROWTH); t3.f.W50[12] += 0.2;
if (!check(t1, GROWTH, files).length || !check(t2, GROWTH, files).length || !check(LMS, t3, files).length) fail('self-test: the checker did not reject a perturbed table');

const errs = check(LMS, GROWTH, files);
if (errs.length) { errs.slice(0, 20).forEach(e => console.error('  ' + e)); fail(errs.length + ' mismatch(es)'); }
console.error('audit-who-wfa-v1: PASS (self-test ok; WHO_WFA_LMS = the committed WHO files, sha256 recorded, months 0–60 both sexes; WHO_GROWTH weight columns on the curve)');
