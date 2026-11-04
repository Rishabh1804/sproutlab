// who-xlsx.mjs — dependency-free reader for the committed WHO xlsx sources (zip central directory +
// zlib + sheet XML), shared by audit-who-wfa-v1.mjs and audit-who-velocity-v1.mjs. readSheet() reads the
// sheet NAMED in workbook.xml, never the alphabetically first sheetN.xml (V-CA-287-3).
import fs from 'fs';
import zlib from 'zlib';

// ── minimal xlsx reader ──
export function unzip(buf) {
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
export const unxml = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
export function readSheet(file, wantName) {
  const z = unzip(fs.readFileSync(file));
  const shared = [];
  if (z['xl/sharedStrings.xml']) {
    for (const si of z['xl/sharedStrings.xml'].toString('utf8').match(/<si>[\s\S]*?<\/si>/g) || []) {
      shared.push(unxml((si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join('')));
    }
  }
  // The sheet named after the file (workbook.xml name → r:id → workbook.xml.rels target), never the
  // alphabetically first sheetN.xml (V-CA-287-3).
  const wb = (z['xl/workbook.xml'] || '').toString('utf8');
  const rels = (z['xl/_rels/workbook.xml.rels'] || '').toString('utf8');
  const sh = (wb.match(/<sheet [^>]*>/g) || []).find(t => (t.match(/name="([^"]+)"/) || [])[1] === wantName);
  const rid = sh && (sh.match(/r:id="([^"]+)"/) || [])[1];
  const rel = rid && (rels.match(new RegExp('<Relationship [^>]*Id="' + rid + '"[^>]*>')) || [])[0];
  const target = rel && (rel.match(/Target="([^"]+)"/) || [])[1];
  const sheetName = target && ('xl/' + target.replace(/^\/?xl\//, '').replace(/^\//, ''));
  if (!sheetName || !z[sheetName]) throw new Error('no worksheet named ' + wantName);
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
