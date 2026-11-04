// ── FEVER EPISODE TRACKING (v2.9) ──

// ── Illness-episode sync: entry ids, tombstones and the one merge (#161 PR 3, spec §5A) ──
// Both phones merge the same way on receive and on push, so they converge (Carina V-CA-P3-1..14,
// Kael V-K-P3-1..18, Maren V-M-P3-1..8). Inputs are never mutated.
const FE_FEVER_START_F = 99;   // a fever episode starts at this reading — and a late reading this high reopens a resolved one (V-M-P3-1)
// The entry or its episode is gone from this phone's list (removed, or moved when two episodes merged).
const _EP_GONE = 'Not saved \u2014 the other phone removed or moved this entry. Close this and find it in the list again.';
const _EP_GONE_DEL = 'Not deleted \u2014 the other phone already removed or moved this entry. Check the list.';
// Per kind: the storage key, the nested entry arrays, and which late entries reopen a resolved episode
// (an entry the parent's Resolve question rules out, or a red flag only checked on an active card — Maren).
const _EP_SYNC = {
  fever:     { key: 'feverEpisodes',     arrays: ['readings', 'doses', 'actions'],
               reopens: (arr, e) => arr === 'readings' && Number(e.temp) >= FE_FEVER_START_F },
  diarrhoea: { key: 'diarrhoeaEpisodes', arrays: ['stools', 'fluids', 'wetDiapers', 'actions'],
               reopens: (arr, e) => arr === 'stools' && (!!e.blood || !!e.mucus || ['soft', 'normal', 'hard'].indexOf(String(e.consistency || '').replace(/'/g, '')) < 0) },
  vomiting:  { key: 'vomitingEpisodes',  arrays: ['episodes', 'fluids', 'wetDiapers', 'actions'],
               reopens: (arr, e) => arr === 'episodes' && e.type !== 'spit-up' },
  cold:      { key: 'coldEpisodes',      arrays: ['actions'], logs: 'dailyLogs',
               reopens: (arr, e) => arr === 'dailyLogs' && ((Array.isArray(e.symptoms) && e.symptoms.length > 0) || Number(e.severity) >= 4) }
};
function _epKindOfKey(keyName) { for (const k in _EP_SYNC) if (_EP_SYNC[k].key === keyName) return k; return null; }
// A new entry id: never changes on edit, so it — not the entry's time — is the identity.
function _epNewId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function _epStable(v) {
  if (Array.isArray(v)) return '[' + v.map(_epStable).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).filter(k => k.indexOf('__sync_') !== 0).sort().map(k => JSON.stringify(k) + ':' + _epStable(v[k])).join(',') + '}';
  return JSON.stringify(v);
}
function _epHash(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(36); }
const _epT = t => { const x = new Date(t).getTime(); return Number.isFinite(x) ? x : 0; };
const _epMin = t => Math.floor(_epT(t) / 60000);
// An entry's instant: its time, or — a legacy cold day-log with only a date — local midnight of that date (HR-12, V-K-289-9).
const _epEntryT = e => e.time ? _epT(e.time) : (e.date && typeof _epLocalToISO === 'function' ? _epT(_epLocalToISO(e.date, '00:00')) : 0);
// Lazy, idempotent: arrays exist; legacy entries get a deterministic id both phones compute alike
// ('L:<array>:<time>#<n>', n by stable JSON among same-time entries). Never stamps edit/resolve times.
function _epNormalize(kind, list) {
  const cfg = _EP_SYNC[kind];
  return (Array.isArray(list) ? list : []).filter(ep => ep && typeof ep === 'object' && ep.id).map(ep => {
    const out = Object.assign({}, ep);
    cfg.arrays.forEach(arr => {
      const src = Array.isArray(ep[arr]) ? ep[arr] : [];
      const groups = {};
      src.forEach(e => { if (e && !e.id) (groups[String(e.time)] = groups[String(e.time)] || []).push(e); });
      // The id carries a hash of the entry's content (plus a count among identical copies), not its position:
      // phones holding different same-time sets still name the same entry alike (Kael V-K-289-6).
      const legacyId = new Map();
      Object.keys(groups).forEach(t => { const seen = {}; groups[t].forEach(e => {
        const h = _epHash(_epStable(e)); const k = seen[h] = (seen[h] || 0) + 1;
        legacyId.set(e, 'L:' + arr + ':' + t + '#' + h + (k > 1 ? '.' + (k - 1) : ''));
      }); });
      out[arr] = src.filter(e => e && typeof e === 'object').map(e => e.id ? e : Object.assign({}, e, { id: legacyId.get(e) }));
    });
    if (cfg.logs) out[cfg.logs] = (Array.isArray(ep[cfg.logs]) ? ep[cfg.logs] : []).filter(e => e && e.date);
    out._del = Array.isArray(ep._del) ? ep._del.filter(t => t && t.arr && t.id) : [];
    if (ep.absorbed !== undefined) out.absorbed = Array.isArray(ep.absorbed) ? ep.absorbed.filter(x => typeof x === 'string') : [];
    if (ep.resolveSuperseded !== undefined) out.resolveSuperseded = Array.isArray(ep.resolveSuperseded) ? ep.resolveSuperseded.filter(x => x && typeof x === 'object') : [];
    return out;
  });
}
// The one save for the four episode keys: any entry still without an id is new — it gets a random one.
function _epSave(keyName, list) {
  const kind = _epKindOfKey(keyName);
  if (kind) (list || []).forEach(ep => _EP_SYNC[kind].arrays.forEach(arr => (ep[arr] || []).forEach(e => { if (e && !e.id) e.id = _epNewId(); })));
  save(KEYS[keyName], list);
}
function _epList(kind) {
  return kind === 'fever' ? _feverEpisodes : kind === 'diarrhoea' ? _diarrhoeaEpisodes : kind === 'vomiting' ? _vomitingEpisodes : _coldEpisodes;
}
// A row's data-arg: the entry id (V-CA-P3-2); a numeric position only for an entry somehow without one.
function _epRowArg(arr, i) { const e = arr && arr[i]; return escAttr(String(e && e.id ? e.id : i)); }
function _epIdxOf(ep, arr, arg) {
  const a = (ep && ep[arr]) || [];
  const byId = a.findIndex(e => e && String(e.id) === String(arg));
  if (byId >= 0) return byId;
  const n = Number(arg);
  return Number.isInteger(n) && n >= 0 && n < a.length && !a[n].id ? n : -1;
}
// The live episode and entry at commit time, by ids — never the objects captured when a sheet opened.
function _epLive(kind, epId, arr, eid) {
  if (!epId || !eid) return null;   // an entry without an id must never match 'the first id-less entry' (V-CA-289-3)
  const ep = _epList(kind).find(e => e && e.id === epId);
  if (!ep || !Array.isArray(ep[arr])) return null;
  const i = ep[arr].findIndex(e => e && e.id === eid);
  return i < 0 ? null : { ep: ep, i: i };
}
// An active episode whose resolve the merge overrode (symptoms logged after it on the other phone) says so,
// so the parent isn't left wondering why a fever she marked better is open again (Maren V-M-P3-7).
function _epCameBackHtml(ep) {
  const sup = (ep && ep.status === 'active' && Array.isArray(ep.resolveSuperseded)) ? ep.resolveSuperseded : [];
  const last = sup.reduce((m, x) => (!m || _epT(x && x.resolvedAt) > _epT(m.resolvedAt) ? x : m), null);
  if (!last || !_epT(last.resolvedAt)) return '';
  const dayOf = iso => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const fmt = iso => dayOf(iso) + ', ' + _feverTimeShort(iso);
  // Name what reopened it, so the parent can check it — and fix it if it was a typo (Vela V-V-289-6, Maren
  // V-M-289-8) — but only while that entry still reopens: a corrected or removed one is not named as the
  // reason (V-V-289-7). The date shows when it differs from the resolve's (V-V-289-8, V-M-289-15).
  const by = last.by || {}, list = by.arr && Array.isArray(ep[by.arr]) ? ep[by.arr] : [];
  const e = by.id ? list.find(x => x && x.id === by.id) : null;
  const kind = { readings: 'fever', stools: 'diarrhoea', episodes: 'vomiting', dailyLogs: 'cold' }[by.arr];
  let what = 'New symptoms were logged after that';
  if (by.id && (!e || !kind || !_EP_SYNC[kind].reopens(by.arr, e))) what = 'An entry logged after that reopened it; it has since been changed or removed';
  else if (e && _epT(e.time)) {
    const at = ' at ' + (dayOf(e.time) === dayOf(last.resolvedAt) ? _feverTimeShort(e.time) : fmt(e.time));
    if (by.arr === 'readings') what = 'A ' + Number(e.temp).toFixed(1) + '\u00b0F reading was logged' + at;
    else if (by.arr === 'stools') {
      const c = String(e.consistency || '').replace(/'/g, '');
      const adj = ['soft', 'normal', 'hard'].indexOf(c) >= 0 ? '' : (c || 'loose');
      const withs = [e.blood ? 'blood' : '', e.mucus ? 'mucus' : ''].filter(Boolean);
      what = 'A ' + (adj ? adj + ' ' : '') + 'stool' + (withs.length ? ' with ' + withs.join(' and ') : '') + ' was logged' + at;   // e.g. "A watery stool", "A stool with blood"
    }
    else if (by.arr === 'episodes') what = 'A vomiting episode was logged' + at;
    else if (by.arr === 'dailyLogs') what = 'Cold symptoms were logged' + at;
  }
  return '<div class="ep-edit-hint">Marked resolved on ' + escHtml(fmt(last.resolvedAt)) + '. ' + escHtml(what) + ', so this is open again. Tap Mark Resolved again once symptoms settle.</div>';
}
// A delete leaves a tombstone so the other phone's copy can't bring the entry back (V-CA-P3-5).
function _epTombstone(ep, arr, idx) {
  const e = ep[arr] && ep[arr][idx];
  if (!e || !e.id) return;
  if (!Array.isArray(ep._del)) ep._del = [];
  const base = _epBaseId(e.id);
  // What the delete protects is the OTHER copies the parent saw and kept (conflict copies of the same
  // entry) — not the deleted copy's content: any other version of the deleted entry still dies, so an
  // edit-then-delete, or an earlier edit on the other phone, can't bring it back (Carina V-CA-289-12).
  const keep = ep[arr].filter((x, i) => i !== idx && x && x.id && _epBaseId(x.id) === base)
    .map(x => _epStable(Object.assign({}, x, { id: base }))).sort();
  const t = { arr: arr, id: base, at: new Date().toISOString() };
  if (keep.length) t.keep = keep;
  ep._del.push(t);
}
function _epBaseId(id) { return String(id).replace(/~\d+$/, ''); }
// A tombstone kills every copy of its entry (keyed arr|baseId, the copy passed with its base id) unless
// the copy was edited after the delete, or is a conflict copy the parent kept when deleting.
function _epKilled(delMap, arr, e) {
  const ts = delMap && delMap.get(arr + '|' + e.id);
  return !!ts && ts.some(t => !((e.editedAt || '') > (t.at || '')) && !(Array.isArray(t.keep) && t.keep.indexOf(_epStable(e)) >= 0));
}
function _epDelMap(lists) {
  const m = new Map();
  lists.forEach(l => (l || []).forEach(t => { if (!t || !t.arr || !t.id) return; const k = t.arr + '|' + t.id; if (!m.has(k)) m.set(k, []); m.get(k).push(t); }));
  return m;
}
// Tombstones from both sides, one of each, in a stable order (so the merge stays commutative).
function _epUnionDel() {
  const m = new Map();
  Array.prototype.slice.call(arguments).forEach(l => (l || []).forEach(t => { if (t && t.arr && t.id) m.set(_epStable(t), t); }));
  return Array.from(m.entries()).sort((x, y) => x[0] < y[0] ? -1 : 1).map(x => x[1]);
}
// Keep every active episode, every fever episode holding a dose in the last 24 h (the 4-in-24 gather),
// then the newest up to 20 — by (startedAt, id), so both phones keep the same set (V-K-P3-6, V-CA-P3-11).
function _epPrune(kind, list, nowMs) {
  const now = nowMs || Date.now();
  const sorted = list.slice().sort(_epCmpEp);
  const keep = new Set();
  sorted.forEach(ep => {
    if (ep.status === 'active') keep.add(ep);
    if (kind === 'fever' && (ep.doses || []).some(d => now - _epT(d.time) < 24 * 3600000)) keep.add(ep);
  });
  for (let i = sorted.length - 1; i >= 0 && keep.size < 20; i--) keep.add(sorted[i]);
  return sorted.filter(ep => keep.has(ep));
}
function _epCmpEp(a, b) { return (_epT(a.startedAt) - _epT(b.startedAt)) || (String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0); }
function _epCmpEntry(a, b) { return (_epT(a.time) - _epT(b.time)) || (String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0); }
// Two copies of one entry: the later editedAt wins whole; equal content is one; differing content with
// no edit stamp keeps both (a duplicate over-counts — the safe direction, V-K-P3-1).
function _epMergeEntryArrays(arr, A, B, delMap) {
  const byId = new Map();
  [A, B].forEach(src => (src || []).forEach(e0 => {
    const base = String(e0.id).replace(/~\d+$/, '');
    const e = base === e0.id ? e0 : Object.assign({}, e0, { id: base });
    const cur = byId.get(e.id);
    if (!cur) { byId.set(e.id, [e]); return; }
    if (cur.some(c => _epStable(c) === _epStable(e))) return;
    const ea = e.editedAt || '', best = cur.reduce((m, c) => ((c.editedAt || '') > (m.editedAt || '') ? c : m), cur[0]);
    if (ea || best.editedAt) {
      if (ea > (best.editedAt || '') || (ea === (best.editedAt || '') && _epStable(e) < _epStable(best))) byId.set(e.id, [e]);
      else byId.set(e.id, [best]);
    } else cur.push(e);
  }));
  const out = [];
  byId.forEach(v0 => {
    const v = v0.filter(e => !_epKilled(delMap, arr, e));
    v.sort((x, y) => _epStable(x) < _epStable(y) ? -1 : 1).forEach((e, n) => out.push(n === 0 ? e : Object.assign({}, e, { id: e.id + '~' + n })));
  });
  return out;
}
function _epMergePair(kind, a, b) {
  const cfg = _EP_SYNC[kind];
  const out = Object.assign({}, a, b);
  ['startedAt', 'triggerSource', 'notes'].forEach(f => { const v = a[f] !== undefined && a[f] !== null && a[f] !== '' ? (b[f] && _epStable(b[f]) < _epStable(a[f]) ? b[f] : a[f]) : b[f]; out[f] = v === undefined ? null : v; });   // never undefined (Kael V-K-289-8)
  if (kind === 'fever') { const pk = [Number(a.peakTemp), Number(b.peakTemp)].filter(Number.isFinite); out.peakTemp = pk.length ? Math.max.apply(null, pk) : 0; }   // the larger side (V-K-289-7)
  out._del = _epUnionDel(a._del, b._del);
  const delMap = _epDelMap([out._del]);
  cfg.arrays.forEach(arr => { out[arr] = _epMergeEntryArrays(arr, a[arr], b[arr], delMap).sort(_epCmpEntry); });
  if (cfg.logs) {
    const byDate = new Map();
    (a[cfg.logs] || []).concat(b[cfg.logs] || []).forEach(l => {
      const c = byDate.get(l.date);
      if (!c || _epT(l.time) > _epT(c.time) || (_epT(l.time) === _epT(c.time) && _epStable(l) < _epStable(c))) byDate.set(l.date, l);
    });
    out[cfg.logs] = Array.from(byDate.values()).sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : _epT(x.time) - _epT(y.time)));
  }
  // The resolve group moves together, from the side with the later resolvedUpdatedAt (V-CA-P3-3, V-K-P3-2).
  const ra = a.resolvedUpdatedAt || '', rb = b.resolvedUpdatedAt || '';
  const pickA = ra > rb || (ra === rb && _epStable([a.resolvedAt, a.resolvedNotes]) <= _epStable([b.resolvedAt, b.resolvedNotes]));
  const R = pickA ? a : b;
  ['resolvedAt', 'resolvedNotes', 'resolvedEditedAt', 'resolvedUpdatedAt'].forEach(f => { out[f] = R[f] !== undefined ? R[f] : null; });
  // The original press time moves with the resolve group: a stale copy from before a reopen must not bring
  // back an old one and drop the move bound below the new press (Maren V-M-289-18).
  out.resolvedAtOriginal = R.resolvedAtOriginal || null;
  const sup = new Map();
  (a.resolveSuperseded || []).concat(b.resolveSuperseded || []).forEach(x => sup.set(_epStable(x), x));
  out.resolveSuperseded = Array.from(sup.values()).sort((x, y) => _epStable(x) < _epStable(y) ? -1 : 1);
  out.absorbed = Array.from(new Set((a.absorbed || []).concat(b.absorbed || []))).sort();
  return out;
}
function _epAllEntries(kind, ep) {
  const cfg = _EP_SYNC[kind], all = [];
  cfg.arrays.forEach(arr => (ep[arr] || []).forEach(e => all.push({ arr: arr, e: e, t: _epT(e.time) })));
  if (cfg.logs) (ep[cfg.logs] || []).forEach(e => all.push({ arr: cfg.logs, e: e, t: _epEntryT(e) }));
  return all;
}
function _epMoveEntries(kind, from, to, sinceMs, alsoMove) {
  const cfg = _EP_SYNC[kind];
  cfg.arrays.concat(cfg.logs ? [cfg.logs] : []).forEach(arr => {
    const keep = [], move = [];
    (from[arr] || []).forEach(e => (_epEntryT(e) >= sinceMs || (alsoMove && alsoMove(arr, e)) ? move : keep).push(e));
    if (!move.length) return;
    from[arr] = keep;
    to[arr] = cfg.logs === arr ? _epMergePair(kind, { [arr]: to[arr] || [] }, { [arr]: move })[arr]
      : _epMergeEntryArrays(arr, to[arr], move, _epDelMap([to._del, from._del])).sort(_epCmpEntry);
  });
  to._del = _epUnionDel(to._del, from._del);
}
// Receive hooks (SYNC_RENDER_DEPS mergeOnReceive, resolved by name on window — so function declarations).
// A joining device takes the household's copy outright on its first receive (V-CA-P3-8).
function _epMergeReceive(kind, remote, local) {
  const key = KEYS[_EP_SYNC[kind].key];
  if (typeof _epJoinPending === 'function' && _epJoinPending(key)) return _epMergeLists(kind, remote, []);
  return _epMergeLists(kind, remote, local);
}
function _epMergeReceiveFever(remote, local) { return _epMergeReceive('fever', remote, local); }
function _epMergeReceiveDiarrhoea(remote, local) { return _epMergeReceive('diarrhoea', remote, local); }
function _epMergeReceiveVomiting(remote, local) { return _epMergeReceive('vomiting', remote, local); }
function _epMergeReceiveCold(remote, local) { return _epMergeReceive('cold', remote, local); }
// A fever the other phone started runs this phone's check countdown too (V-K-P3-8).
function _epPostReceiveFever() { if (getActiveFeverEpisode()) _startFeverCountdown(); }
// The one merge: commutative and idempotent; receive and push both call it (spec §5A).
function _epMergeLists(kind, A, B, nowMs) {
  const cfg = _EP_SYNC[kind];
  const a = _epNormalize(kind, JSON.parse(JSON.stringify(A || []))), b = _epNormalize(kind, JSON.parse(JSON.stringify(B || [])));
  const byId = new Map();
  a.concat(b).forEach(ep => {
    const cur = byId.get(ep.id);
    byId.set(ep.id, cur ? (_epStable(cur) <= _epStable(ep) ? _epMergePair(kind, cur, ep) : _epMergePair(kind, ep, cur)) : ep);
  });
  // An absorbed episode is folded into its absorber, never dropped: an entry the other phone logged into it
  // after the fold moves into the survivor (Carina V-CA-289-2, Maren V-M-289-2). Chains are followed;
  // the lowest absorber id wins a tie, so both phones pick the same one.
  const absorberOf = new Map();
  Array.from(byId.values()).sort(_epCmpEp).forEach(ep => (ep.absorbed || []).forEach(id => {
    if (id !== ep.id && (!absorberOf.has(id) || String(ep.id) < String(absorberOf.get(id)))) absorberOf.set(id, ep.id);
  }));
  const rootOf = id => { const seen = new Set([id]); let r = id; while (absorberOf.has(r) && !seen.has(absorberOf.get(r))) { r = absorberOf.get(r); seen.add(r); } return r; };
  Array.from(absorberOf.keys()).sort().forEach(id => {
    const x = byId.get(id), root = rootOf(id), surv = byId.get(root);
    if (!x) return;
    if (surv && root !== id) {
      _epMoveEntries(kind, x, surv, -Infinity);
      surv.absorbed = Array.from(new Set((surv.absorbed || []).concat([id], x.absorbed || []))).sort();
    }
    if (root !== id) byId.delete(id);
  });
  let list = Array.from(byId.values()).sort(_epCmpEp);
  // Derived status (V-K-P3-2, Maren V-M-P3): resolved iff resolvedAt is set and no reopening entry is
  // later than it (to the minute). A newer same-kind episode started after the resolve keeps the old one
  // resolved and takes its later entries instead (V-M-P3-5).
  list.forEach(ep => {
    if (!ep.resolvedAt) { ep.status = 'active'; return; }
    const newer = list.find(x => x !== ep && _epT(x.startedAt) > _epT(ep.resolvedAt));
    // Bounded by when Resolve was first pressed, not by an edited end time: an entry logged before that press
    // was logged while the episode was active and belongs to it (Cipher A1; Maren V-M-289-3 otherwise).
    const resolvedBound = Math.max(_epT(ep.resolvedAt), _epT(ep.resolvedAtOriginal));
    // A red flag later than the (edited) end also moves, wherever it falls: only an entry that arrived late
    // can sit between an edited end and the press, and the active card's severity must see it (Maren V-M-289-16).
    const endMin = _epMin(ep.resolvedAt);
    if (newer) { _epMoveEntries(kind, ep, newer, (Math.floor(resolvedBound / 60000) + 1) * 60000, (arr, e) => cfg.reopens(arr, e) && Math.floor(_epEntryT(e) / 60000) > endMin); ep.status = 'resolved'; return; }
    const late = _epAllEntries(kind, ep).filter(x => cfg.reopens(x.arr, x.e) && Math.floor(x.t / 60000) > _epMin(ep.resolvedAt)).sort((x, y) => x.t - y.t)[0];
    if (!late) { ep.status = 'resolved'; return; }
    const rec = { resolvedAt: ep.resolvedAt, resolvedNotes: ep.resolvedNotes || '', resolvedAtOriginal: ep.resolvedAtOriginal || null,
      supersededAt: new Date(late.t).toISOString(), by: { arr: late.arr, id: late.e.id || null } };
    const sup = new Map((ep.resolveSuperseded || []).map(x => [_epStable(x), x])); sup.set(_epStable(rec), rec);
    ep.resolveSuperseded = Array.from(sup.values()).sort((x, y) => _epStable(x) < _epStable(y) ? -1 : 1);
    ep.resolvedAt = null; ep.resolvedNotes = ''; ep.resolvedAtOriginal = null; ep.resolvedEditedAt = null;
    ep.status = 'active';
  });
  // Fold concurrent actives (V-CA-P3-6, V-K-P3-3): the earliest survives; the others move in and are absorbed.
  const actives = list.filter(ep => ep.status === 'active').sort(_epCmpEp);
  if (actives.length > 1) {
    const surv = actives[0];
    actives.slice(1).forEach(x => {
      _epMoveEntries(kind, x, surv, -Infinity);
      surv.absorbed = Array.from(new Set((surv.absorbed || []).concat([x.id], x.absorbed || []))).sort();
    });
    const gone = new Set(actives.slice(1).map(x => x.id));
    list = list.filter(ep => !gone.has(ep.id));
  }
  // A delete recorded on the episode an entry came from still applies after the entry moved (Kael V-K-289-5).
  const kindDel = _epDelMap(list.map(ep => ep._del));
  list.forEach(ep => cfg.arrays.forEach(arr => { if (Array.isArray(ep[arr])) ep[arr] = ep[arr].filter(e => !_epKilled(kindDel, arr, Object.assign({}, e, { id: String(e.id).replace(/~\d+$/, '') }))); }));
  // One shape whether an episode came from one side or both, so a single-side merge equals a pair merge
  // of the same content (else every receive would read as divergent and push back).
  list.forEach(ep => {
    ['absorbed', 'resolveSuperseded', '_del'].forEach(f => { if (!Array.isArray(ep[f])) ep[f] = []; });
    ['resolvedAt', 'resolvedNotes', 'resolvedEditedAt', 'resolvedUpdatedAt', 'resolvedAtOriginal', 'startedAt', 'triggerSource', 'notes'].forEach(f => { if (ep[f] === undefined) ep[f] = null; });   // (Carina D-2)
  });
  if (kind === 'fever') list.forEach(ep => {
    const temps = (ep.readings || []).map(r => Number(r.temp)).filter(Number.isFinite);
    const side = Number(ep.peakTemp);
    ep.peakTemp = temps.length ? Math.max.apply(null, temps) : (Number.isFinite(side) ? side : 0);
  });
  return _epPrune(kind, list, nowMs);
}


let _feverEpisodes = [];
try { _feverEpisodes = JSON.parse(localStorage.getItem(KEYS.feverEpisodes)) || []; } catch { _feverEpisodes = []; }
if (!Array.isArray(_feverEpisodes)) _feverEpisodes = [];
_feverEpisodes = _epNormalize('fever', _feverEpisodes);   // ids for legacy entries, in memory only (V-CA-P3-14)

let _feverCountdownInterval = null;
// Readings timeline expand/collapse state for the active-episode card.
// Render-only; not persisted. Reset when an episode resolves.
let _feShowAllReadings = false;

function getActiveFeverEpisode() {
  return _feverEpisodes.find(e => e.status === 'active') || null;
}

function getFeverSeverity(tempF) {
  if (tempF >= 104) return { tier: 'critical', label: 'Critical — seek care', checkMins: 15, color: 'var(--tc-danger)' };
  if (tempF >= 102.1) return { tier: 'high', label: 'High fever', checkMins: 30, color: 'var(--tc-danger)' };
  if (tempF >= 100.5) return { tier: 'moderate', label: 'Moderate', checkMins: 60, color: 'var(--tc-caution)' };
  if (tempF >= 99.1) return { tier: 'mild', label: 'Mild fever', checkMins: 120, color: 'var(--tc-amber)' };
  return { tier: 'low-grade', label: 'Low-grade', checkMins: 240, color: 'var(--tc-amber)' };
}

// Paracetamol: 10–15 mg/kg per dose (WHO Pocket Book of Hospital Care for Children, 2nd ed. 2013,
// Annex 2; BNF for Children); at least 4 h between doses and no more than 4 doses in 24 h (BNF for
// Children; NHS "Paracetamol for children"). Give it for distress, not to chase the number (NICE NG143 §1.6).
// The ml depends entirely on the bottle, so the parent picks it (Architect, 2026-11-03):
// paediatric drops 100 mg/ml, suspension 120 mg/5 ml (24 mg/ml), suspension 250 mg/5 ml (50 mg/ml).
const PARACETAMOL_FORMS = [
  // Labels say "in 1 ml" / "in 5 ml" as the bottle does: at 2 AM "mg/ml" and "mg/5 ml" look alike (V-M-284-1d).
  { id: 'drops100', label: 'Drops · 100 mg in 1 ml', short: 'drops (100 mg in 1 ml)', mgPerMl: 100 },
  { id: 'syrup120', label: 'Syrup · 120 mg in 5 ml', short: 'syrup (120 mg in 5 ml)', mgPerMl: 24 },
  { id: 'syrup250', label: 'Syrup · 250 mg in 5 ml', short: 'syrup (250 mg in 5 ml)', mgPerMl: 50 },
];
const PARA_STALE_DAYS = 28;   // a month-old weight is already behind a growing toddler
let _feParaForm = null;       // the parent's pick in THIS episode (cleared when the episode changes)
let _feParaFormEp = null;

function _paraFormById(id) { return PARACETAMOL_FORMS.find(f => f.id === id) || null; }

// The bottle last logged, read from the dose records themselves (no new storage key).
function _paraLastFormIn(ep) {
  const ds = (ep && ep.doses) || [];
  for (let i = ds.length - 1; i >= 0; i--) if (ds[i] && _paraFormById(ds[i].form)) return ds[i].form;
  return null;
}
// The bottle is carried only WITHIN the active episode (Maren V-M-284-1, Kael V-K-284-3, Vela V-V-284a-2):
// months later the household may hold a different bottle, and a remembered syrup read against drops
// is a 2–4x overdose. A new episode has NO bottle until the parent taps one, so no ml is shown and no
// unconfirmed default is ever written to a dose record. Returns null when nothing is picked yet.
function _paraCurrentForm() {
  const ep = getActiveFeverEpisode();
  const epId = ep ? ep.id : null;
  if (_feParaFormEp !== epId) { _feParaForm = null; _feParaFormEp = epId; }
  return _paraFormById(_feParaForm) || _paraFormById(_paraLastFormIn(ep)) || null;
}
// For a hint only: the bottle used in an earlier fever, when this episode has no pick of its own.
function _paraEarlierFormHint() {
  const ep = getActiveFeverEpisode();
  if (_paraCurrentForm()) return null;
  for (let e = _feverEpisodes.length - 1; e >= 0; e--) {
    if (_feverEpisodes[e] === ep) continue;
    const f = _paraFormById(_paraLastFormIn(_feverEpisodes[e]));
    if (f) return f;
  }
  return null;
}

// Is this weight believable for her age at the weigh-in? WHO's biologically-implausible flags for
// weight-for-age: z < −6 or z > +5 (WHO Anthro manual, 2011), on the exact LMS z to 60 months
// (whoWfaZ, core.js). Outside that it is almost certainly a typo (95 kg for 9.5 kg), so no dose is
// offered. This read the 0–24 m percentile table and clamped at its last row, so from age 2 every
// weight was judged against a 2-year-old's chart (BUGS #162, V-K-284-4). Fail closed: a NaN z (age
// past 60 months, a bad date) is not plausible. With the sex not yet given (the one-question gate is
// up), the weight must pass on both the girls' and the boys' table.
function paraWeightPlausible(weightKg, dateStr) {
  if (!(weightKg > 0)) return false;
  const mo = whoAgeMoAt(dateStr);
  const ok = sex => { const z = whoWfaZ(weightKg, mo, sex); return z >= -6 && z <= 5; };
  const sex = childSex();
  return sex ? ok(sex) : (ok('f') && ok('m'));
}
// The interim ceiling (#287) is gone (#161 PR 4b): the weight-jump confirm (PR 4a) makes a believable typo be
// retyped before it is dosed. What stays exposed is the accepted residual (spec §6, decision C): the same wrong
// number retyped. After that confirm W_ref = the latest weight, so no mg/kg rule of the leftover-risk flow sees
// doses that follow the chip; the flow catches doses beyond the packet, oversized doses, unreadable amounts and
// long courses (Kael V-K-291-D9, Maren V-M-291-D12).

// Dose range for a weight and a bottle. Low end rounds UP and high end DOWN to 0.1 ml,
// so what is shown never goes past 15 mg/kg.
function getParacetamolDose(weightKg, form) {
  if (!weightKg || weightKg < 3) return null;
  const f = form || PARACETAMOL_FORMS[0];
  const tidy = x => Math.round(x * 1e6) / 1e6;   // strip float noise before ceil/floor (V-K-284-8)
  const lowMg = Math.ceil(tidy(weightKg * 10));
  const highMg = Math.floor(tidy(weightKg * 15));
  const lowMl = (Math.ceil(tidy(weightKg * 10 / f.mgPerMl * 10)) / 10).toFixed(1);
  const highMl = (Math.floor(tidy(weightKg * 15 / f.mgPerMl * 10)) / 10).toFixed(1);
  return { lowMg, highMg, lowMl, highMl, form: f, display: lowMl + '–' + highMl + ' ml' };
}

// Everything the dose chip needs, from the latest weight row ({ wt, date }).
function getParacetamolChip(weightRow) {
  const form = _paraCurrentForm();
  const wt = weightRow && weightRow.wt;
  const date = weightRow && weightRow.date;
  // Under 3 months, paracetamol is the doctor's call, not a weight sum (NHS; V-M-284-5).
  if (ageMonthsAt(today()) < 3) return { state: 'askdoctor', form };
  if (!wt || !date) return { state: 'noweight', form };
  const ageDays = gvDaysBetween(date, today());   // the one shared day count (V-CA-284-2)
  if (!Number.isFinite(ageDays) || ageDays < 0) return { state: 'baddate', form, wt, date };
  // A weigh-in dated before the birth date is a date error, not a weight error (Vela V-V-287-2); one past
  // the WHO table (60 months, day 1826) is out of range, not "off for her age" — a correct 5-year-old's
  // weight must not be blamed (Kael V-K-287-2, Maren V-M-287-4, Vela V-V-287-1). Both still give no dose.
  const lifeDays = gvDaysBetween(toDateStr(DOB), date);
  if (Number.isFinite(lifeDays) && lifeDays < 0) return { state: 'baddate', why: 'beforebirth', form, wt, date };
  if (Number.isFinite(lifeDays) && lifeDays > WHO_WFA_MAX_DAY) return { state: 'outofrange', form, wt, date };
  if (!paraWeightPlausible(wt, date)) return { state: 'implausible', form, wt, date };
  // A weight under 3 kg can reach this: under 3 months returns 'askdoctor' above, but at 3 months 2.5 kg
  // is z ≈ −5.7 on the girls' table (whoWfaZ), inside the flags, so the gate passes it (on the boys'
  // table it is −6.3 and the gate stops it). It has no dose here: one decision, never 'ok' without a
  // dose (V-K-284-1). Keep this after the gate.
  if (!getParacetamolDose(wt, PARACETAMOL_FORMS[0])) return { state: 'nodose', form, wt, date };
  // The weight-jump check (#161 §4.2/§4.4): a weight that jumped, dropped, can't be compared, or shares
  // its date with a different weight gives no dose until the parent retypes it (decision B). No dose
  // object in this state; it carries the bottle.
  const check = gvWeightNeedsConfirm(weightRow);
  if (check) return { state: 'confirm', form, wt, date, check };
  const lossConfirmed = gvWeightConfirmedVariant(weightRow) === 'jump-down';
  if (!form) return { state: 'pick', form, wt, date, lossConfirmed };
  const dose = getParacetamolDose(wt, form);
  const day = _parseLocalDate(date);
  const sameYear = day.getFullYear() === _parseLocalDate(today()).getFullYear();
  const dateLabel = day.toLocaleDateString('en-IN', sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
  return { state: 'ok', form, wt, date, dateLabel, ageDays, stale: ageDays > PARA_STALE_DAYS, dose, lossConfirmed };
}
// Every chip state, each with its own render branch (a test checks the list against the card).
const PARA_CHIP_STATES = ['askdoctor', 'noweight', 'baddate', 'outofrange', 'implausible', 'nodose', 'confirm', 'pick', 'ok'];

// ── The weight confirm block (#161 §4.4) ──
// A weigh-in date as the chip shows it (HR-12: parsed as a local date).
function _paraDateLabel(dateStr) {
  const day = _parseLocalDate(dateStr);
  if (!day) return '';
  const sameYear = day.getFullYear() === _parseLocalDate(today()).getFullYear();
  return day.toLocaleDateString('en-IN', sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
}
// "9.5 kg" with a no-break space, inserted BEFORE escaping (a literal &nbsp; would double-escape).
function _paraKgText(w) { return String(w) + '\u00a0kg'; }
function _paraGapWords(days) {
  if (!(days >= 0)) return '';
  if (days < 14) return days + (days === 1 ? ' day' : ' days');
  if (days < 61) { const w = Math.round(days / 7); return w + ' weeks'; }
  const m = Math.round(days / 30.4375); return m + (m === 1 ? ' month' : ' months');
}
// After a confirmed drop: tell the doctor today (Maren V-M-290-2 — a drop past WHO's 1st-percentile velocity
// during an illness is not a next-visit note), and keep the milk going — milk feeds under 6 months (WHO:
// milk only before 6 months; "fluids" could read as water — Ceres V-C-290-2). Shown only when the drop was
// weighed during this illness or the week before it, so an old drop isn't read as this fever's (Kael
// V-K-290-5, Maren V-M-290-5).
function _paraLossLineHtml(chip, ep) {
  if (!chip || !chip.lossConfirmed || !ep) return '';
  const startDay = toDateStr(new Date(ep.startedAt));
  const before = gvDaysBetween(chip.date, startDay);
  if (!Number.isFinite(before) || before > 7) return '';
  // Cow's milk as a drink waits until 12 months (iron), so "other milk" only from then (Ceres V-C-290-2).
  const mo = ageMonthsAt(today());
  const feeds = mo < 6 ? 'Keep offering milk feeds often.'
    : mo < 12 ? 'Keep offering breast milk or formula, and fluids, often.'
    : 'Keep offering breast milk or other milk, and fluids, often.';
  return '<div class="fe-para-note">A real drop in weight while ' + pron('subj') + ' is unwell is worth telling your doctor today. ' + feeds + '</div>';
}
// "she", or neutral words when the sex isn't set (Kael V-K-290-7, Vela V-V-290-7, Maren V-M-290-11).
function _paraSubjOr(fallback) { return childSex() ? pron('subj') : fallback; }
// A weight change in words: grams under 100 g, so a small loss never prints "0.0 kg" beside "more than
// usual" (Vela V-V-290-1).
function _paraChangeWords(changeG, gapDays) {
  if (!Number.isFinite(changeG) || changeG === 0) return '';
  const g = Math.abs(changeG);
  const amt = g < 100 ? g + ' g' : (g / 1000).toFixed(1) + ' kg';
  return amt + ' ' + (changeG > 0 ? 'more' : 'less') + ' in ' + _paraGapWords(gapDays);
}
// Why the check asked, for a tired parent: what it compared and what to do. Jump, loss and conflict
// read amber; "couldn't compare" reads calm. The escape line is always there (Vela, Maren). Every claim
// comes from the check's own pairs (spec §9, Cipher #288 finding 9 — Maren V-M-290-3).
function _paraConfirmHtml(chip) {
  const jc = chip.check || {};
  const v = jc.variant, p = jc.pair;
  const amber = v === 'jump-up' || v === 'jump-down' || v === 'samedate' || v === 'implausible';
  const okPair = (jc.pairs || []).find(x => x && x.ok);
  let html = '<div class="fe-para-confirm' + (amber ? '' : ' fe-para-confirm--calm') + '">';
  html += '<div class="fe-para-confirm-title">' + (amber ? zi('warn') + ' ' : '') + 'Check the weight before working out a dose</div>';
  const dated = (label, r) => '<span>' + escHtml(label) + ' <span class="fe-para-pair-wt">' + escHtml(_paraKgText(r.wt)) + '</span> · ' + escHtml(_paraDateLabel(r.date)) + '</span>';
  if (p && p.a && p.b && v === 'samedate') {
    // One flex item, so "and" and the comma stay with their weights (Vela V-V-290-2).
    html += '<div class="fe-para-pair"><span><span class="fe-para-pair-wt">' + escHtml(_paraKgText(p.b.wt)) + '</span> and <span class="fe-para-pair-wt">' + escHtml(_paraKgText(p.a.wt)) + '</span>, both on ' + escHtml(_paraDateLabel(p.b.date)) + '</span></div>';
  } else if (p && p.a && p.b && p.a.date !== p.b.date) {
    // Labelled, so the order can't be misread (Vela V-V-290-4).
    const change = _paraChangeWords(p.changeG, p.gapDays);
    html += '<div class="fe-para-pair">' + dated('Newest', p.b) + dated('Before', p.a) + (change ? '<span class="fe-para-pair-change">' + escHtml(change) + '</span>' : '') + '</div>';
  } else {
    html += '<div class="fe-para-pair">' + dated('Newest', { wt: chip.wt, date: chip.date }) + '</div>';
  }
  let why;
  if (v === 'jump-up') why = 'That is more than children usually gain in that time, so one of the numbers may be a typo.';
  else if (v === 'jump-down') why = 'That is a bigger drop than usual for that time. It may be a typo, or a real drop while ' + _paraSubjOr('your child') + ' is unwell.';
  else if (v === 'samedate') why = 'Growth has two different weights on the same day, so the dose can\'t tell which is right. If ' + _paraKgText(p && p.a ? p.a.wt : '') + ' is the right one, tap Change the weight and remove ' + _paraKgText(chip.wt) + '.';
  else if (v === 'implausible') {
    // Only an off EARLIER row, or a row dated before the birth date, reaches here: the chip's own gate
    // stops an off newest weight first (Kael V-K-290-2).
    why = p && p.reason === 'dob' ? 'An earlier weigh-in is dated before ' + pron('poss') + ' birth date. Check its date in Growth.'
      : p && p.badRow === 'a' ? 'The earlier weight looks off for ' + pron('poss') + ' age. Check it in Growth.'
      : p && p.badRow === 'b' ? 'The newest weight looks off for ' + pron('poss') + ' age.'
      : p && p.badRow === 'both' ? 'Both weights look off for ' + pron('poss') + ' age.'
      : 'One of these weights looks off. Check them in Growth.';
  }
  else if ((jc.reason === 'gap' || jc.reason === 'age') && okPair && p && p.a) {
    why = 'The ' + _paraDateLabel(okPair.a.date) + ' weigh-in matches, but the one on ' + _paraDateLabel(p.a.date) + ' is too long ago to compare with, so the check can\'t finish.';
  }
  else if (jc.reason === 'noprev') why = 'There is no earlier weight to check it against.';
  else if (jc.reason === 'gap' && p && p.a) why = 'The weigh-in on ' + _paraDateLabel(p.a.date) + ' is too long ago to check it against.';
  else if (jc.reason === 'gap') why = 'The weigh-in before it was too long ago to check it against.';
  else if (jc.reason === 'age') why = 'These weigh-ins are too far apart to check at ' + pron('poss') + ' age.';
  else if (jc.reason === 'nosex') why = 'The weight can\'t be checked until your child\'s sex is set in Settings.';
  else why = 'The weight couldn\'t be checked against an earlier one.';
  html += '<div class="fe-para-confirm-text">' + escHtml(why) + '</div>';
  html += '<div class="fe-para-confirm-text">If ' + escHtml(_paraKgText(chip.wt)) + ' is right, type it here to confirm it.</div>';
  html += '<div class="fe-para-retype"><input id="feWtRetype" class="ep-edit-input" type="text" inputmode="decimal" autocomplete="off" placeholder="kg" aria-label="Type the newest weight in kilograms">'
    + '<button type="button" class="btn btn-soft btn-soft--peach" data-action="feConfirmWeight" data-arg="' + escAttr(chip.date) + '" data-arg2="' + escAttr(String(chip.wt)) + '" data-arg3="' + escAttr(jc.askKind || '') + '">Confirm</button></div>';
  html += '<div id="feWtRetypeErr" class="fe-para-retype-err" role="alert"></div>';
  html += '<div class="fe-para-confirm-actions"><button type="button" class="btn btn-peach" data-action="switchTab" data-arg="growth">Change the weight</button></div>';
  html += '<div class="fe-para-confirm-text">If ' + _paraSubjOr('your child') + ' needs medicine now, ask your doctor or chemist for the dose.</div>';
  html += '</div>';
  return html;
}
// The retype (decision B): the parent types the weight the chip SHOWED; it is compared at 0.01 kg
// (comma decimals accepted) and must still be the weight on that date in Growth. Writes only the
// confirmation map — never the growth row — recording what the check asked (gvConfirmRecord).
function feConfirmWeight(date, wtStr, shownKind) {
  const input = document.getElementById('feWtRetype');
  const say = msg => { const err = document.getElementById('feWtRetypeErr'); if (err) err.textContent = msg; };
  const typed = parseFloat(String(input ? input.value : '').trim().replace(',', '.'));
  const shown = Number(wtStr);
  if (!Number.isFinite(typed) || typed <= 0) { say('Type the weight in kg, for example 9.5.'); return; }
  const row = gvMeasureRows('wt').find(r => r.date === date && r.wt === shown);
  // Re-render first, then say it, or the redraw wipes the message (Kael V-K-290-6, Vela V-V-290-3).
  if (!row) { renderFeverEpisodeCard(); showQLToast('That weight has changed in Growth. Check it there.'); return; }
  if (Math.round(typed * 100) !== Math.round(shown * 100)) {
    say('You typed ' + _paraKgText(typed) + '; Growth has ' + _paraKgText(shown) + ' on that date. If Growth is wrong, tap Change the weight.');
    return;
  }
  const latest = getLatestWeight();
  if (!gvConfirmRecord(row, shownKind || null) && gvWeightNeedsConfirm(row)) {
    // The check changed since the card was drawn: show the new question rather than record the old one.
    renderFeverEpisodeCard(); showQLToast('The weight check has changed. Look again.'); return;
  }
  renderFeverEpisodeCard();
  // The toast only when this was the weight the dose reads (a newer one may now be asking).
  if (latest && latest.date === row.date && latest.wt === row.wt && !gvWeightNeedsConfirm(latest)) showQLToast(zi('check') + ' Weight confirmed');
}

function feSetParaForm(id) {
  if (!_paraFormById(id)) return;
  const ep = getActiveFeverEpisode();
  _feParaForm = id;
  _feParaFormEp = ep ? ep.id : null;
  renderFeverEpisodeCard();
}

// One prune for create, receive and push (_epPrune): actives and recent-dose episodes always kept (V-K-P3-6).
function pruneFeverEpisodes() { _feverEpisodes = _epPrune('fever', _feverEpisodes); }

function startFeverEpisode(tempF, source) {
  // Don't create if one is already active
  if (getActiveFeverEpisode()) return getActiveFeverEpisode();
  const now = new Date().toISOString();
  const episode = {
    id: 'fe-' + Date.now(),
    status: 'active',
    startedAt: now,
    resolvedAt: null,
    readings: [{ time: now, temp: tempF, notes: '' }],
    doses: [],
    actions: [],
    peakTemp: tempF,
    triggerSource: source || 'manual',
    notes: '',
    resolvedNotes: ''
  };
  _feverEpisodes.push(episode);
  pruneFeverEpisodes();   // after the push, so the stored list is the 20 the merge also keeps (V-K-P3-6)
  _epSave('feverEpisodes', _feverEpisodes);
  _startFeverCountdown();
  return episode;
}

function logFeverReading(tempF, timeStr, notes) {
  const ep = getActiveFeverEpisode();
  if (!ep) return;
  const time = timeStr || new Date().toISOString();
  ep.readings.push({ time: time, temp: tempF, notes: notes || '' });
  if (tempF > ep.peakTemp) ep.peakTemp = tempF;
  _epSave('feverEpisodes', _feverEpisodes);
  renderFeverEpisodeCard();
  renderHomeFeverBanner();
}

function logFeverDose(medicine, dose, timeStr, notes, form) {
  const ep = getActiveFeverEpisode();
  if (!ep) return;
  ep.doses.push({
    time: timeStr || new Date().toISOString(),
    medicine: medicine || 'Paracetamol',
    dose: dose || '',
    notes: notes || '',
    ...(form ? { form } : {})
  });
  _epSave('feverEpisodes', _feverEpisodes);
  renderFeverEpisodeCard();
}

function logFeverAction(action, timeStr) {
  const ep = getActiveFeverEpisode();
  if (!ep) return;
  ep.actions.push({
    time: timeStr || new Date().toISOString(),
    action: action
  });
  _epSave('feverEpisodes', _feverEpisodes);
  renderFeverEpisodeCard();
}

function resolveFeverEpisode(notes) {
  const ep = getActiveFeverEpisode();
  if (!ep) return;
  ep.status = 'resolved';
  ep.resolvedAt = new Date().toISOString(); ep.resolvedUpdatedAt = ep.resolvedAt;   // the resolve group's merge stamp (V-CA-P3-3)
  ep.resolvedNotes = notes || '';
  _epSave('feverEpisodes', _feverEpisodes);
  _stopFeverCountdown();
  _feShowAllReadings = false;
  renderFeverEpisodeCard();
  renderFeverHistory();
  renderHomeFeverBanner();
  renderHome();
}

function getFeverCheckCountdown() {
  const ep = getActiveFeverEpisode();
  if (!ep || ep.readings.length === 0) return null;
  const lastReading = ep.readings[ep.readings.length - 1];
  const sev = getFeverSeverity(lastReading.temp);
  const lastTime = new Date(lastReading.time).getTime();
  const elapsed = (Date.now() - lastTime) / 60000; // minutes
  const remaining = sev.checkMins - elapsed;
  return { remaining: Math.round(remaining), total: sev.checkMins, overdue: remaining <= 0, elapsed: Math.round(elapsed) };
}

// When can the next paracetamol dose go in? Two rules, one answer (Kael V-K-284-2):
// at least 4 h after the LATEST dose (by time, not array order — an edited time can reorder),
// and no more than 4 doses in any 24 h, counted across every fever episode (a dose logged in a
// just-resolved episode still counts).
const PARA_MIN_GAP_MIN = 240;
const PARA_MAX_PER_24H = 4;
function getFeverDoseCountdown() {
  // No early return on an empty episode: a fever that comes back after "resolved" starts a new episode
  // with no doses, and the dose given an hour ago in the old one must still hold the gap (Cipher, #284).
  if (!getActiveFeverEpisode()) return null;
  const now = Date.now();
  const times = [];
  _feverEpisodes.forEach(e => ((e && e.doses) || []).forEach(d => {
    const t = d && new Date(d.time).getTime();   // HR-12: d.time is a full ISO instant
    if (Number.isFinite(t)) times.push(Math.min(t, now));   // a fast-clock device's dose counts as "now", never dropped
  }));
  // Nothing in the last 24 h: no limit applies (and no "dose available" alert for a months-old dose).
  if (!times.some(t => t > now - 24 * 3600000)) return null;
  times.sort((a, b) => b - a);   // newest first
  const lastTime = times[0];
  const gapAt = lastTime + PARA_MIN_GAP_MIN * 60000;
  const in24 = times.filter(t => t > now - 24 * 3600000);
  const capAt = in24.length >= PARA_MAX_PER_24H ? in24[PARA_MAX_PER_24H - 1] + 24 * 3600000 : 0;
  const nextAt = Math.max(gapAt, capAt);
  const reason = capAt > gapAt ? 'daily-max' : 'gap';
  const remaining = Math.ceil((nextAt - now) / 60000);
  return { remaining, available: remaining <= 0, elapsed: Math.round((now - lastTime) / 60000),
    lastTime, nextAt, reason, n24: in24.length };
}

// ── The leftover-risk flow (#161 spec §5, decision C; ratified rules R0–R3) ──
// Decision C accepts the residual — a believable wrong weight confirmed by retyping — with no dose cap,
// on condition the app watches the doses actually given. Sources:
//   RCH Melbourne CPG "Paracetamol poisoning" (updated July 2023; adapted from Chiew et al., MJA 2020;212(4)):
//     > 200 mg/kg or 10 g in 24 h; > 300 mg/kg or 12 g in 48 h; "greater than a daily therapeutic dose per day
//     for more than 48 hours in patients who also have abdominal pain, nausea or vomiting".
//   NHS "Paracetamol for children" (reviewed 2 Oct 2025): at most 4 doses in 24 h, 4 h apart; not more than
//     3 days without a doctor or pharmacist; more than the packet says → urgent advice (NHS 111).
//   BNF "Poisoning, emergency treatment" / TOXBASE: 75 mg/kg in 24 h assessment line (read via the Sheffield
//     Children's and NHS GGC protocols).
// Judgment, labelled (spec §3): 60 mg/kg/day (15 × 4, the app's ceiling) read as RCH's "daily therapeutic dose";
// call-now at ≥ 75; "more than 48 hours" read as a continuous stretch; R2b counts calendar dates; R0b's 2× cut.
// Accepted residual: a typo confirmed by retyping doses from the wrong weight, and this flow's mg/kg rules can't
// see it (W_ref = the confirmed latest weight). Also accepted: the 75 mg/kg line computed on the dosing weight can
// sit just above a true 75 on the real weight (V-M-C161F-7). The ANZ lines (200 / 300 mg/kg, 10 / 12 g) lead with
// the emergency department (Architect, 2026-11-04).
const PARA_LOAD_THRESHOLDS = Object.freeze({ dailyMaxMgKg: 60, assessMgKg: 75, anz24MgKg: 200, anz24Mg: 10000, anz48MgKg: 300, anz48Mg: 12000, multiDayHours: 48, windowHours: 72 });
const PARA_TIER = { calm: 0, amber: 1, red: 2, now: 3 };
// Paracetamol by name, combination products included (Combiflam carries 325 mg); a renamed ibuprofen is not.
// Indian brands and cold syrups that carry it (Maren V-M-291-D11, Kael V-K-291-D3): Pacimol, Paracip, P-125/250/
// 500/650, Febrex Plus, Ibugesic Plus (plain Ibugesic is ibuprofen), Sumo, Sinarest; common misspellings.
const PARA_NAME_RE = /paracetamol|paracetmol|paracitamol|acetaminophen|calpol|crocin|panadol|tylenol|dolo|combiflam|pacimol|paracip|febrex\s*plus|ibugesic\s*plus|\bsumo\b|sinarest|\bp[- ]?(?:125|250|500|650)\b|\bpcm\b/i;
function _paraIsParacetamol(name) { return PARA_NAME_RE.test(String(name || '')); }
// One dose → [lo, hi] mg (spec §5.2). Read the label's strength ("120 mg/5 ml", "100 mg/ml") apart from the
// amount given, so "5 ml (120 mg/5 ml)" is 120 mg, never 5 (Kael V-K-291-2, Maren V-M-291-5):
//   an amount in mg → exact; ml with a strength or a bottle → exact; ml with neither → 24..100 mg/ml (the weakest
//   syrup to the drops); a bare number, alone, with a bottle → [n, n × mg/ml] (mg or ml, Kael V-K-291-13/-14); more than one
//   quantity ("2 x 1.5 ml", "then") or nothing readable → [0, ∞]. Comma decimals ("1,5 ml"), leading-dot
//   decimals (".8 ml"), a thousands comma on mg ("1,000 mg"), ranges ("1-1.4 ml").
function _paraDoseMg(d) {
  const unread = { lo: 0, hi: Infinity, readable: false };
  let s = String((d && d.dose) || '').toLowerCase().trim();
  s = s.replace(/(\d),(\d{3})(?=\s*mg)/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2');
  const N = '(\\d*\\.\\d+|\\d+)', R = N + '\\s*(?:-|–|—|to)\\s*' + N;
  const str = s.match(new RegExp(N + '\\s*mg\\s*(?:/|per|in)\\s*' + N + '?\\s*ml'));
  const strength = str ? parseFloat(str[1]) / (str[2] ? parseFloat(str[2]) : 1) : null;
  const rest = (str ? s.replace(str[0], ' ') : s).replace(/\bcc\b/g, 'ml');
  // More than one quantity is never one dose (Kael V-K-291-15): "2 x 1.5 ml", "5 ml x2", "2x5ml", "then", "+",
  // "twice", "and", a separator comma (decimal commas are already dots), or two amounts in the same unit.
  if (/\bx\b|\d\s*x|x\s*\d|×|\bthen\b|\+|\btwice\b|\bthrice\b|\band\b|,/.test(rest)) return unread;
  if (/mg\s*\/\s*kg|per\s*kg/.test(rest)) return unread;   // a dose per kg is not an amount given (Kael V-K-291-D26)
  if ((rest.match(/\d\s*mg\b/g) || []).length > 1 || (rest.match(/\d\s*ml\b/g) || []).length > 1) return unread;
  const pick = (re1, reR) => { const r = rest.match(new RegExp(reR)); if (r) return [parseFloat(r[1]), parseFloat(r[2])]; const m = rest.match(new RegExp(re1)); return m ? [parseFloat(m[1]), parseFloat(m[1])] : null; };
  const mg = pick(N + '\\s*mg', R + '\\s*mg'), ml = pick(N + '\\s*ml', R + '\\s*ml');
  const ok = v => v && v[0] >= 0 && v[1] >= v[0];
  if (ok(mg)) return { lo: mg[0], hi: mg[1], readable: true };   // the mg given, written out
  const f = d && d.form ? _paraFormById(d.form) : null;
  if (ok(ml)) {
    const per = strength || (f ? f.mgPerMl : null);
    return per ? { lo: ml[0] * per, hi: ml[1] * per, readable: true } : { lo: ml[0] * 24, hi: ml[1] * 100, readable: false };
  }
  // A bare number only when nothing else is written: "1 tsp", "1 spoon", "half" are unread (Kael V-K-291-14).
  const bare = new RegExp('^\\s*(?:' + R + '|' + N + ')\\s*$').test(rest) ? pick(N, R) : null;
  if (ok(bare) && f) return { lo: bare[0], hi: bare[1] * f.mgPerMl, readable: false };
  return unread;
}
// Every paracetamol dose across every fever episode, newest last; a fast-clock device's dose counts as now (t),
// its own time kept for keys (tRaw — Carina V-CA-291-5).
function _paraDosesAll(nowMs) {
  const out = [];
  (_feverEpisodes || []).forEach(e => ((e && e.doses) || []).forEach(d => {
    if (!d || !_paraIsParacetamol(d.medicine)) return;
    const t = new Date(d.time).getTime();
    if (!Number.isFinite(t)) return;
    const mg = _paraDoseMg(d);
    out.push({ t: Math.min(t, nowMs), tRaw: t, lo: mg.lo, hi: mg.hi, readable: mg.readable, form: d.form || null, medicine: d.medicine });
  }));
  return out.sort((a, b) => a.t - b.t);
}
// The reference weight W_ref (spec §5.1): the latest weight if the parent confirmed it by retyping, or with no
// earlier weigh-in in the last 184 days; otherwise the lowest of the latest and every earlier in-window weigh-in
// carried along its own weight-for-age z to the latest date. Earlier weigh-ins that look off for their age are
// left out (Maren V-M-291-6). No sex, or a projection that fails → the lowest of the latest and the previous
// plausible weigh-in. { w, src: { date, wt } | null, confirmed? } or null when there is no weight.
function _paraRefWeight() {
  const rows = gvMeasureRows('wt');
  const latest = rows[rows.length - 1];
  if (!latest) return null;
  if (gvWeightConfirmed(latest) && !gvWeightNeedsConfirm(latest)) return { w: latest.wt, src: null, confirmed: true };
  const earlier = rows.filter(r => r.date < latest.date && gvDaysBetween(r.date, latest.date) <= GV_JUMP_DZ_MAX_DAYS && paraWeightPlausible(r.wt, r.date));
  if (!earlier.length) return { w: latest.wt, src: null };
  const sex = childSex(), moL = whoAgeMoAt(latest.date);
  let best = { w: latest.wt, src: null };
  const prev = earlier[earlier.length - 1];
  const fallback = () => (prev.wt < latest.wt ? { w: prev.wt, src: { date: prev.date, wt: prev.wt } } : { w: latest.wt, src: null });
  if (sex !== 'f' && sex !== 'm' || !Number.isFinite(moL)) return fallback();
  for (const r of earlier) {
    const p = whoWfaWeightAtZ(whoWfaZ(r.wt, whoAgeMoAt(r.date), sex), moL, sex);
    if (!(p > 0)) return fallback();
    if (p < best.w) best = { w: p, src: { date: r.date, wt: r.wt } };
  }
  return best;
}
// The rolling-24 h total (mg) at instant t: doses in (t − 24 h, t].
function _paraSum24(doses, t, key) { let x = 0; doses.forEach(d => { if (d.t <= t && d.t > t - 864e5) x += d[key]; }); return x; }
// The longest continuous stretch in the window [now − 72 h, now] with the rolling-24 h total above a mass (R2).
function _paraLongestOver(doses, nowMs, massMg, key) {
  const start = nowMs - PARA_LOAD_THRESHOLDS.windowHours * 36e5;
  const pts = new Set([start, nowMs]);
  doses.forEach(d => { [d.t, d.t + 864e5].forEach(x => { if (x > start && x < nowMs) pts.add(x); }); });
  const P = Array.from(pts).sort((a, b) => a - b);
  let best = 0, run = 0;
  for (let i = 0; i < P.length - 1; i++) {
    if (_paraSum24(doses, P[i], key) > massMg) { run += P[i + 1] - P[i]; best = Math.max(best, run); } else run = 0;
  }
  return best;
}
// When the rolling-24 h total next falls to or under a mass (the oldest doses leave the window).
function _paraUnderAt(doses, nowMs, massMg) {
  const in24 = doses.filter(d => d.t > nowMs - 864e5 && d.t <= nowMs);
  let total = in24.reduce((x, d) => x + d.lo, 0);
  for (const d of in24) { if (total <= massMg) break; total -= d.lo; if (total <= massMg) return d.t + 864e5; }
  return total <= massMg ? nowMs : NaN;
}
function _paraOrdinal(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
function _paraMgText(lo, hi) {
  const r = x => Math.round(x);
  if (!Number.isFinite(hi)) return 'at least ' + r(lo) + ' mg';
  return r(lo) === r(hi) ? r(lo) + ' mg' : r(lo) + '–' + r(hi) + ' mg';
}
// A GI sign in the last 48 h (R2): a vomit (not a spit-up) in any vomiting episode, or a tummy-pain / retching
// answer logged on a fever episode ('Seems sick' kept so answers already logged still count — PC-8). A fast-clock
// entry counts as now. An empty log is never "no".
const PARA_GI_ACTIONS = ['Tummy pain', 'Retching or off food'];
const PARA_GI_MATCH = PARA_GI_ACTIONS.concat(['Seems sick']);
function _paraGiSign(nowMs) {
  const since = nowMs - 48 * 36e5, inWin = t => { const x = new Date(t).getTime(); return Number.isFinite(x) && Math.min(x, nowMs) > since; };
  const vom = (_vomitingEpisodes || []).some(e => ((e && e.episodes) || []).some(v => v && v.type !== 'spit-up' && inWin(v.time)));
  const act = (_feverEpisodes || []).some(e => ((e && e.actions) || []).some(a => a && PARA_GI_MATCH.indexOf(a.action) >= 0 && inWin(a.time)));
  return vom || act;
}
const PARA_GI_YES = ' If so, call your doctor now.';   // R2's own answer (RCH, spec §5.3), where the chips can't be shown
const PARA_ER = ' If you can\'t reach your doctor now, go to the emergency department.';
// The pure engine (spec §5.3/§5.4, as amended in the PR 4b round): doses + weights + context → the rules that
// fire, each with its tier and copy, plus the one "until" and whether anything says stop.
function _paraLoadFrom(o) {
  const T = PARA_LOAD_THRESHOLDS, now = o.nowMs, doses = o.doses || [];
  const in24 = doses.filter(d => d.t > now - 864e5 && d.t <= now);
  const in48 = doses.filter(d => d.t > now - 1728e5 && d.t <= now);
  const lo24 = in24.reduce((x, d) => x + d.lo, 0), hi24 = in24.reduce((x, d) => x + d.hi, 0);
  const lo48 = in48.reduce((x, d) => x + d.lo, 0), hi48 = in48.reduce((x, d) => x + d.hi, 0);
  const out = { n24: in24.length, lo24, hi24, n48: in48.length, lo48, hi48, rules: [], tier: 'calm', check: false, under: false, known: true, reasons: [], until: null, stop: false };
  const fire = (rule, tier, lines, extra) => { out.rules.push(Object.assign({ rule, tier, lines }, extra || {})); if (PARA_TIER[tier] > PARA_TIER[out.tier]) out.tier = tier; };
  const subj = o.subj || 'your child', obj = o.obj || 'your child', pos = o.pos || 'your child\'s', Subj = subj.charAt(0).toUpperCase() + subj.slice(1);
  const when = ms => o.fmtWhen ? o.fmtWhen(ms) : (o.fmtTime ? o.fmtTime(ms) : new Date(ms).toISOString());
  // An active paracetamol medicine in the medicines list: the total may miss doses — even with nothing logged
  // here (Kael V-K-291-6c). Load unknown, reason named.
  if (o.medName) {
    out.known = false; out.check = true; out.reasons.push('med');
    fire('MED', 'amber', [o.medName + ' is on ' + pos + ' medicines list, and doses given from there aren\'t counted here. Ask your doctor or chemist before the next dose.'], { fact: o.medName + ' is on ' + pos + ' medicines list, and doses given from there aren\'t counted here.' });
  }
  if (!doses.some(d => d.t > now - T.windowHours * 36e5)) { if (!o.medName) out.none = true; return out; }
  const last = in24.length ? in24[in24.length - 1] : null;
  // R0 — beyond the packet: a dose under 4 h after the one before, or a 5th+ in 24 h. Red and holding only until
  // {nextTime} (the later of 4 h after the last dose and the oldest of 4 leaving the window); after that the same
  // facts in amber, with no stale "until" (Kael V-K-291-3, Maren V-M-291-3, Vela V-V-291-3). Never call-now alone;
  // runs with no weight.
  let close = null;
  for (let i = in24.length - 1; i >= 1; i--) { if (in24[i].t - in24[i - 1].t < 4 * 36e5) { close = { d: in24[i], gap: in24[i].t - in24[i - 1].t }; break; } }
  if (close || in24.length >= 5) {
    const desc = in24.map(d => d.t).sort((a, b) => b - a);
    const nextT = Math.max(desc[0] + 4 * 36e5, desc.length >= 4 ? desc[3] + 864e5 : 0);
    const active = now < nextT;
    const fact = close
      ? 'The dose at ' + when(close.d.t) + ' was ' + Math.floor(close.gap / 36e5) + ' h ' + Math.floor((close.gap % 36e5) / 6e4) + ' min after the one before.' + (close.gap <= 2 * 6e4 ? ' If one dose was logged twice, delete the extra. If two people each gave a dose, keep both.' : ' Doses close together happen, especially at night.')   // same minute only: two carers minutes apart is a real double dose (Maren V-M-291-13)
      : 'That\'s ' + in24.length + ' doses in 24 hours. The packet allows 4.';
    const tell = (active ? 'Call your doctor today' : 'If you haven\'t yet, call your doctor today') + ' and tell them: ' + in24.length + ' doses, ' + _paraMgText(lo24, hi24) + ' in the last 24 hours, the last at ' + when(desc[0]) + '.';
    fire('R0', active ? 'red' : 'amber', [fact + ' NHS advice is to check with a doctor whenever a dose goes beyond what the packet says. ' + tell], { fact, until: active ? nextT : null });
  }
  if (in24.length) out.extra = 'Check other medicines\' labels. Some cold syrups also contain paracetamol.';
  // R2b — more than 3 days (NHS): runs with no weight too (Kael V-K-291-11); a question to put to someone → check.
  if (last) {
    const days = new Set(doses.map(d => toDateStr(new Date(d.t))));
    let n = 0; const cur = new Date(last.t); cur.setHours(12, 0, 0, 0);
    while (days.has(toDateStr(cur))) { n++; cur.setDate(cur.getDate() - 1); }
    if (n >= 4) { out.check = true; fire('R2b', 'amber', ['This is the ' + _paraOrdinal(n) + ' day of paracetamol. NHS advice is to speak to a doctor or pharmacist before giving it for more than 3 days.']); }
  }
  const wRef = o.wRef && o.wRef.w, wDose = o.wDose;
  if (!(wRef > 0) || !(wDose > 0)) {
    out.known = false; out.check = true; out.reasons.push('weight');
    if (in24.length) fire('NOWT', 'amber', ['Add a weight so the day\'s total can be checked. Last 24 h: ' + in24.length + (in24.length === 1 ? ' dose, ' : ' doses, ') + _paraMgText(lo24, hi24) + '.'], { addWeight: true });
    return _paraFinish(out, now, when);
  }
  const wtTxt = (Math.round(wDose * 10) / 10) + ' kg';
  const src = o.wRef.src, srcTxt = src ? pos + ' weigh-in on ' + o.fmtDate(src.date) + ' (' + src.wt + ' kg)' : 'an earlier weigh-in';
  const checkWt = 'Check the weight before the next dose: weigh ' + obj + ' again, or check the number.';
  // The 6-second lead (DESIGN_PRINCIPLES §11; Architect, 2026-11-04): the short forms the block leads with.
  out.wq = { q: 'Is ' + wtTxt + ' right?', d: srcTxt.charAt(0).toUpperCase() + srcTxt.slice(1) + ' suggests less.' };
  // ANZ (RCH): over 200 mg/kg or 10 g in 24 h, or 300 mg/kg or 12 g in 48 h → the emergency department (Maren
  // V-M-291-7; Architect, 2026-11-04).
  const anz24 = lo24 >= T.anz24MgKg * wDose || lo24 >= T.anz24Mg, anz48 = lo48 >= T.anz48MgKg * wDose || lo48 >= T.anz48Mg;
  if (anz24 || anz48) {
    fire('ANZ', 'now', ['Go to the emergency department now. That\'s more paracetamol than is safe: ' + (anz24 ? _paraMgText(lo24, hi24) + ' in 24 hours' : _paraMgText(lo48, hi48) + ' in 48 hours') + ' for ' + wtTxt + '. Take the bottle with you.'], { er: true, stop: true });
  }
  // R0b — one dose bigger than one dose, split like R1 (Architect, 2026-11-04; Kael V-K-291-1, Maren V-M-291-1):
  // over the top dose for the dosing weight + one 0.1 ml step → red (2× → call now); over only for W_ref → the
  // weight question. One line, naming the biggest dose.
  const topOf = w => Math.floor(Math.round(w * 15 * 1e6) / 1e6);
  const topD = topOf(wDose), topR = topOf(wRef);
  const stepOf = d => 0.1 * (d.form && _paraFormById(d.form) ? _paraFormById(d.form).mgPerMl : 100);
  const bigD = in24.filter(d => d.lo > topD + stepOf(d)), bigR = in24.filter(d => d.lo > topR + stepOf(d) && !(d.lo > topD + stepOf(d)));
  if (bigD.length) {
    const max = bigD.reduce((m, d) => (d.lo > m.lo ? d : m), bigD[0]);
    out.bigDoseMg = Math.round(max.lo);
    const now2 = max.lo >= 2 * topD;
    const fact = 'That dose is bigger than one dose for ' + wtTxt + ': ' + Math.round(max.lo) + ' mg, where the most for one dose is ' + topD + ' mg.' + (bigD.length > 1 ? ' ' + bigD.length + ' doses in the last 24 hours were that big.' : '');
    fire('R0b', now2 ? 'now' : 'red', [fact + ' Call your doctor ' + (now2 ? 'now' : 'today') + ' and tell them the amount and the bottle. Give no more paracetamol until they say.' + (now2 ? PARA_ER : '')], { stop: true, fact });
  } else if (bigR.length) {
    out.check = true;
    fire('R0b', 'amber', ['That dose fits ' + pos + ' newest weight, ' + wtTxt + '. But if ' + wtTxt + ' is too high (' + srcTxt + ' suggests less), it was bigger than one dose. ' + checkWt], { weightQ: true });
  }
  // R1 — the rolling 24 h, escalating on lo only; a hi-only crossing asks for the mg. Copy per branch, so no line
  // says the doses fit a weight they don't (Kael V-K-291-5, Maren V-M-291-D1).
  const D = lo24 / wDose, R = lo24 / wRef, Rhi = hi24 / wRef;
  const hasWq = () => out.rules.some(r => r.weightQ);
  if (D >= T.assessMgKg) {
    fire('R1', 'now', ['That\'s more paracetamol in 24 hours than is safe for ' + wtTxt + ': ' + _paraMgText(lo24, hi24) + '. Call your doctor now and tell them: ' + in24.length + ' doses, the last at ' + when(last.t) + '. Give no more paracetamol.' + PARA_ER], { stop: true, fact: 'In the last 24 hours: ' + in24.length + ' doses, the last at ' + when(last.t) + '.' });
  } else if (R >= T.assessMgKg) {
    out.check = true;
    fire('R1', 'red', [(D > T.dailyMaxMgKg
      ? 'That\'s more than the usual most for a day for ' + wtTxt + '. And if ' + wtTxt + ' is too high (' + srcTxt + ' suggests less), it\'s more than is safe in a day.'
      : 'These doses fit ' + pos + ' newest weight, ' + wtTxt + '. But if ' + wtTxt + ' is too high (' + srcTxt + ' suggests less), the last 24 hours are more than is safe in a day.') + ' Call your doctor today, or confirm the weight below.'], { weightQ: !hasWq() });
  } else if (D > T.dailyMaxMgKg) {
    const at = _paraUnderAt(in24, now, T.dailyMaxMgKg * wDose);
    fire('R1', 'amber', ['That\'s more than the usual most for a day for ' + wtTxt + '.'], { until: Number.isFinite(at) ? at : null });
  } else if (R > T.dailyMaxMgKg) {
    out.check = true;
    if (!hasWq()) fire('R1', 'amber', ['These doses fit ' + pos + ' newest weight, ' + wtTxt + '. But if ' + wtTxt + ' is too high (' + srcTxt + ' suggests less), the last 24 hours are over the usual most for a day. ' + checkWt], { weightQ: true });
  } else if (Rhi > T.dailyMaxMgKg) {
    out.check = true;
    fire('R1', 'amber', ['We can\'t tell how much paracetamol was in some doses. Check the bottle\'s label, then tap each dose above and write the mg given (for example 120 mg).']);
  } else if (in24.length) {
    out.under = Number.isFinite(hi24);
    fire('R1', 'calm', ['Last 24 h: ' + in24.length + (in24.length === 1 ? ' dose, ' : ' doses, ') + _paraMgText(lo24, hi24) + '.']);
  } else out.under = true;
  // R2 — more than 48 hours over a day's usual most (RCH), by the longest continuous stretch in the 72 h window.
  const H48 = T.multiDayHours * 36e5;
  const metRef = _paraLongestOver(doses, now, T.dailyMaxMgKg * wRef, 'lo') > H48;
  const metDose = _paraLongestOver(doses, now, T.dailyMaxMgKg * wDose, 'lo') > H48;
  const maybe = !metRef && _paraLongestOver(doses.map(d => Object.assign({}, d, { hiF: Number.isFinite(d.hi) ? d.hi : 1e12 })), now, T.dailyMaxMgKg * wRef, 'hiF') > H48;
  if (metRef && !metDose) {
    out.check = true;
    if (!hasWq()) fire('R2', 'amber', ['These doses fit ' + pos + ' newest weight, ' + wtTxt + ', day by day. But if ' + wtTxt + ' is too high (' + srcTxt + ' suggests less), each of the last 2 days was over the usual most. ' + checkWt], { weightQ: true });
  } else if (metRef && o.gi) {
    fire('R2', 'now', ['That\'s more than a day\'s usual most, every day, for over 48 hours, and ' + subj + ' has vomited, retched or had tummy pain. Call your doctor now. ' + Subj + ' may need a blood test. Tell them: ' + in48.length + ' doses, ' + _paraMgText(lo48, hi48) + ' in the last 48 hours.' + PARA_ER], { stop: true, fact: 'That\'s more than a day\'s usual most, every day, for over 48 hours, and ' + subj + ' has vomited, retched or had tummy pain. Tell them: ' + in48.length + ' doses, ' + _paraMgText(lo48, hi48) + ' in the last 48 hours.' });
  } else if (metRef) {
    out.check = true;   // a question is open: an empty log is never "no" (Kael V-K-291-6a)
    fire('R2', 'amber', ['That\'s more than a day\'s usual most, every day, for over 48 hours. Has ' + subj + ' vomited, retched, or had tummy pain?',
      'Call your doctor now if ' + subj + ' seems to feel sick (gagging, retching, or won\'t eat and won\'t drink, even breastfeeds or milk), or if ' + pos + ' skin or the whites of ' + pos + ' eyes look yellow. Yellow skin is harder to see on brown skin, so check the whites of the eyes.' + PARA_ER], { giChips: true });   // a conditional call-now line carries the fallback too (Vela V-V-291-17)
  } else if (maybe) {
    out.check = true;
    fire('R2', 'amber', ['We couldn\'t read every dose amount, so we can\'t tell if the last 2 days were over the usual most. Check the bottle\'s label, then tap each dose above and write the mg given.']);
  }
  // R3 — weigh again: a long or draining illness, a dose in 24 h, and the latest weigh-in from before it began.
  if (last && o.illnessStart && o.latestWtDate && o.latestWtDate < o.illnessStart) {
    fire('R3', 'amber', ['If you can, weigh ' + obj + ' again before the next dose.'], { addWeight: true });
  }
  out.obj = obj;
  out.giQ = 'Has ' + subj + ' vomited, retched, or had tummy pain?';
  out.giWatch = 'Call your doctor now if ' + pos + ' skin or the whites of ' + pos + ' eyes look yellow, or ' + subj + ' won\'t eat and won\'t drink, even breastfeeds or milk.' + PARA_ER;
  const r2now = (out.rules.some(r => r.rule === 'R2' && r.tier === 'now') || anz48) && !anz24;   // the 48 h figure when the 48 h rule drives
  const last48 = in48.length ? in48[in48.length - 1] : null;   // the 48 h rules can fire with every dose over 24 h old (Kael V-K-291-18)
  if (r2now ? last48 : last) out.tellText = r2now
    ? 'Tell them: ' + in48.length + ' doses, ' + _paraMgText(lo48, hi48) + ' in the last 48 hours. The last at ' + when(last48.t) + '.'
    : 'Tell them: ' + in24.length + (in24.length === 1 ? ' dose, ' : ' doses, ') + _paraMgText(lo24, hi24) + ' in the last 24 hours. The last at ' + when(last.t) + '.';
  if (out.tellText && out.bigDoseMg) out.tellText += ' The biggest dose was ' + out.bigDoseMg + '\u00a0mg' + (out.rules.some(r => r.er) ? '.' : ': have the bottle with you.');   // the ER lead already says take it (Vela V-V-291-26)   // the doctor needs the dose and the strength (Maren D20)
  return _paraFinish(out, now, when);
}
// One block, one "until" (Kael V-K-291-4): when a rule at red or above (other than R0) fires, R0 keeps only its
// facts; the one "until" is the latest any rule names, and none when a rule says stop.
function _paraFinish(out, now, when) {
  out.stop = out.rules.some(r => r.stop);
  if (out.rules.some(r => r.rule !== 'R0' && PARA_TIER[r.tier] >= PARA_TIER.red)) out.rules.forEach(r => { if (r.rule === 'R0' && r.fact) r.lines = [r.fact]; });
  // One instruction per block (Kael V-K-291-4/-17): the "can't reach your doctor" fallback leaves the lines here
  // and is said once per surface at render (_paraSurface — Kael V-K-291-16, Maren V-M-291-10). Under the
  // emergency-department lead every other rule keeps only its fact, with no question, chips or retype; with a
  // call-now rule, a red rule keeps only its fact (Kael D15, Maren D16).
  out.rules.forEach(r => { if (r.lines.some(l => l.endsWith(PARA_ER))) { r.callNow = true; r.lines = r.lines.map(l => l.endsWith(PARA_ER) ? l.slice(0, -PARA_ER.length) : l); } });
  if (out.rules.some(r => r.er)) {
    out.rules = out.rules.filter(r => r.er || r.fact).map(r => r.er ? r : Object.assign({}, r, { lines: [r.fact], callNow: false, giChips: false, weightQ: false, addWeight: false }));
  } else if (out.rules.some(r => r.tier === 'now')) {
    out.rules.forEach(r => { if (r.tier === 'red' && r.fact) r.lines = [r.fact]; });
  }
  const untils = out.rules.map(r => r.until).filter(t => Number.isFinite(t) && t > now);
  if (untils.length && !out.stop) { out.until = Math.max.apply(null, untils); out.untilText = 'Give no more paracetamol until ' + when(out.until) + '.'; }
  return out;
}
// A time, with its day when it isn't today (HR-12, local): "9:00 pm", "yesterday at 9:00 pm", "3 Nov, 9:00 pm".
function _paraWhen(ms) {
  const d = new Date(ms), t = _feverTimeShort(d.toISOString()), ds = toDateStr(d), td = today();
  if (ds === td) return t;
  const y = new Date(); y.setHours(12, 0, 0, 0); y.setDate(y.getDate() - 1);
  if (ds === toDateStr(y)) return 'yesterday at ' + t;
  const tm = new Date(); tm.setHours(12, 0, 0, 0); tm.setDate(tm.getDate() + 1);
  if (ds === toDateStr(tm)) return 'tomorrow at ' + t;
  return _paraDateLabel(ds) + ', ' + t;
}
// The live inputs → _paraLoadFrom (spec §5.4). A weight the chip rejects (looks off, bad date, past 5 years) is
// no weight here (Kael V-K-291-12, Maren V-M-291-6). The medicines list is read by name and brand (V-K-291-10).
function getParacetamolLoad(nowMs) {
  const now = nowMs || Date.now();
  const latest = getLatestWeight();
  let usable = !!latest;
  if (latest) { try { const st = getParacetamolChip(latest).state; if (st === 'implausible' || st === 'baddate' || st === 'outofrange') usable = false; } catch (e) { usable = false; } }
  const med = ((typeof meds !== 'undefined' && Array.isArray(meds)) ? meds : []).find(m => m && m.active && _paraIsParacetamol(String(m.name || '') + ' ' + String(m.brand || '')));
  const fe = getActiveFeverEpisode(), de = typeof getActiveDiarrhoeaEpisode === 'function' ? getActiveDiarrhoeaEpisode() : null, vo = getActiveVomitingEpisode();
  const starts = [];
  if (fe && now - new Date(fe.startedAt).getTime() > 48 * 36e5) starts.push(fe.startedAt);
  if (de) starts.push(de.startedAt);
  if (vo) starts.push(vo.startedAt);
  const illnessStart = starts.length ? toDateStr(new Date(starts.map(x => new Date(x).getTime()).filter(Number.isFinite).sort((a, b) => a - b)[0])) : null;
  return _paraLoadFrom({
    nowMs: now, doses: _paraDosesAll(now), wDose: usable ? latest.wt : NaN, wRef: usable ? _paraRefWeight() : null,
    medName: med ? String(med.name || med.brand) : null, gi: _paraGiSign(now), illnessStart, latestWtDate: latest ? latest.date : null,
    subj: childSex() ? pron('subj') : 'your child', obj: childSex() ? pron('obj') : 'your child', pos: childSex() ? pron('poss') : 'your child\'s',
    fmtWhen: _paraWhen, fmtDate: _paraDateLabel
  });
}
// The one answer for the next dose (spec §5.4): hold (red / call now), check (a question open), wait (the 4 h gap,
// 4-in-24, or a time a rule names), or available. "Safe to give" only when available and nothing warns —
// tier calm and under (Kael V-K-291-6, Maren V-M-291-2, Vela V-V-291-2). Logging is never blocked.
function getParacetamolNextDose(nowMs) {
  const now = nowMs || Date.now();
  const load = getParacetamolLoad(now);
  const cd = getFeverDoseCountdown();
  let verdict = 'available';
  if (PARA_TIER[load.tier] >= PARA_TIER.red) verdict = 'hold';
  else if (load.check) verdict = 'check';
  else if ((cd && !cd.available) || (load.until && load.until > now)) verdict = 'wait';
  return { verdict, load, countdown: cd, safe: verdict === 'available' && load.tier === 'calm' && (load.under || !!load.none) };
}

// The leftover-risk block (spec §5.3): the rules that fired, highest tier first, folded into one block. Calm
// reads as a plain note. where: 'fever' (everything) or 'gi' (the vomiting / diarrhoea cards: R2 only).
const PARA_TIER_TITLE = { now: 'Call your doctor now', red: 'Call your doctor today', amber: 'Check before the next dose' };
// The rules one surface shows, in its order (the emergency lead, then tier). It also re-adds the fallback once on
// the first call-now line, for the engine-level text the tests read; the rendered surfaces (the block's lead,
// Home's body) say the fallback themselves and the Why strips it (Kael V-K-291-D25).
function _paraSurface(rules) {
  const list = (rules || []).slice().sort((a, b) => (b.er ? 1 : 0) - (a.er ? 1 : 0) || PARA_TIER[b.tier] - PARA_TIER[a.tier]).map(r => Object.assign({}, r, { lines: r.lines.slice() }));
  if (!list.some(r => r.er)) { const c = list.find(r => r.callNow && r.lines.length); if (c) c.lines[c.lines.length - 1] += PARA_ER; }
  return list;
}
// One rule's teaser for the "Why" row, and its action line when it asks the parent to do something.
function _paraWhy(r) {
  const l0 = (r.lines && r.lines[0]) || '';
  const unread = /^We can'?t tell|^We couldn't read/.test(l0);
  switch (r.rule) {
    case 'ANZ': return { t: 'Far more than is safe' };
    case 'R0': return { t: /^That's \d+ doses/.test(r.fact || '') ? 'More than 4 doses in 24 hours' : /logged twice/.test(r.fact || '') ? 'Two doses logged at the same time' : 'Two doses less than 4 h apart', act: r.tier === 'amber' && r.lines.length && r.lines[0] !== r.fact ? 'If you haven\'t yet, call your doctor today.' : '' };
    case 'R0b': return { t: r.weightQ ? 'One dose may be too big' : 'One dose bigger than the most for one dose' };
    case 'R1': return unread ? { t: 'Some dose amounts unclear', act: 'Check the bottle\'s label, then tap each dose above and write the mg given.' }
      : { t: r.tier === 'now' ? 'More than is safe in 24 hours' : r.tier === 'red' ? 'May be more than is safe in 24 hours' : r.weightQ ? 'May be over the daily most' : 'Over the usual most for a day' };
    case 'R2': return unread ? { t: 'Some dose amounts unclear', act: 'Check the bottle\'s label, then tap each dose above and write the mg given.' }
      : { t: r.weightQ ? 'May be over the daily most for 2 days' : 'Over the daily most for 2 days' };
    case 'R2b': { const m = l0.match(/the (\w+) day/); return { t: (m ? m[1] : '4th') + ' day of paracetamol', gate: 'speak to a doctor or pharmacist' }; }
    case 'R3': return { t: 'Weighed before the illness', act: l0 };
    case 'MED': return { t: 'Also on the medicines list', act: r.fact || l0, gate: 'ask your doctor or chemist' };
    case 'NOWT': return { t: 'No weight to check against', act: 'Add a weight so the day\'s total can be checked.' };
    default: return { t: '' };
  }
}
// "Tell them:" / "Call your doctor now" in bold, as the lead of their line (both halves escaped, HR-4).
function _paraLeadBold(text, lead) {
  const t = String(text || '');
  return t.indexOf(lead) === 0 ? '<strong>' + escHtml(lead) + '</strong>' + escHtml(t.slice(lead.length)) : escHtml(t);
}
// The one instruction (6-second lead). A rule that gates the next dose on asking someone folds into it, so the
// time is never read without its condition (Vela V-V-291-19): "…until 7:24 pm, and speak to a doctor or
// pharmacist first." / "Speak to a doctor or pharmacist before the next dose."
function _paraDoLine(load, live, where) {
  const er = live.some(r => r.er), stop = live.some(r => r.stop) || !!load.stop;   // a stop leads every surface, shown rule or not (Kael V-K-291-D27)
  if (er) return 'Give no more paracetamol. Take the bottle with you.';
  if (stop) return 'Give no more paracetamol until your doctor says.';
  const until = load.untilText && where !== 'gi' ? load.untilText.replace(/\.$/, '') : '';
  // A red rule with no stop and no time of its own (R1 red: unsafe only on the earlier weigh-in) gates the next
  // dose on the doctor or the weight, with or without a countdown time beside it (Kael V-K-291-19, Vela V-V-291-24).
  const redGate = live.some(r => PARA_TIER[r.tier] >= PARA_TIER.red && !r.stop && !Number.isFinite(r.until));
  if (redGate) {
    // The doctor leads, the time follows; "weighed again", not "confirmed" — a typed typo is what R1 red catches
    // (Maren V-M-291-16, ruling on Kael V-K-291-19).
    const g = live.some(r => r.weightQ) ? 'spoken to your doctor or weighed ' + (load.obj || 'your child') + ' again' : 'spoken to your doctor';
    const at = until ? until.replace(/^Give no more paracetamol until /, '') : '';
    return 'Give no more paracetamol until you\'ve ' + g + (at ? ', and not before ' + at : '') + '.';
  }
  let gates = [];
  live.forEach(r => { const g = _paraWhy(r).gate; if (g && gates.indexOf(g) < 0) gates.push(g); });
  if (gates.length > 1) gates = ['speak to a doctor or pharmacist'];   // one ask, not two (Vela V-V-291-25)
  if (gates.length) return until ? until + ', and ' + gates.join(' and ') + ' first.' : gates.join(' and ').replace(/^./, c => c.toUpperCase()) + ' before the next dose.';
  return until ? until + '.' : '';
}
// The block carries the next-dose time itself: the later of the 4-hour gap / 4-in-24 countdown and any rule's
// time, so a question never hides the countdown (Maren V-M-291-14; Vela V-V-291-13 — one time, the later).
function _paraWithGap(load, cd) {
  if (!load || !cd || cd.available || !Number.isFinite(cd.nextAt) || load.stop) return load;
  if (Number.isFinite(load.until) && load.until >= cd.nextAt) return load;
  return Object.assign({}, load, { until: cd.nextAt, untilText: 'Give no more paracetamol until ' + _paraWhen(cd.nextAt) + '.' });
}
let _feLoadWhyOpen = {};   // the "Why" row stays as the parent left it across re-renders, per surface
function feLoadWhy(btn) {
  const row = btn && btn.closest('.fe-load-prow');
  if (!row) return;
  const open = !row.classList.contains('open');
  row.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  _feLoadWhyOpen[row.getAttribute('data-where') || ''] = open;
}
// The load block, to the 6-second rule (DESIGN_PRINCIPLES §11; Architect, 2026-11-04): the action as the title,
// one instruction, "Tell them" when a call is needed, then only what asks the parent to act (a question with its
// chips, the weight retype, a button); every reason folds into one "Why" row. The full rule text lives there.
function _paraLoadHtml(load, where, card) {
  if (!load || load.none) return '';
  const rules = _paraSurface((load.rules || []).filter(r => where !== 'gi' || r.rule === 'R2' || r.er || PARA_TIER[r.tier] >= PARA_TIER.red));   // and any red or call-now rule: one tier for one state (Maren V-M-291-11, D18, D21)   // the GI cards carry the emergency lead too (Maren V-M-291-11)
  if (!rules.length) return '';
  const tier = rules.reduce((t, r) => PARA_TIER[r.tier] > PARA_TIER[t] ? r.tier : t, 'calm');
  if (tier === 'calm') {
    return rules.map(r => r.lines.map(l => '<div class="fe-para-note t-light">' + escHtml(l) + '</div>').join('')).join('')
      + (where === 'fever' && load.extra ? '<div class="fe-para-note t-light">' + escHtml(load.extra) + '</div>' : '');
  }
  const live = rules.filter(r => r.tier !== 'calm');
  const er = live.some(r => r.er), stop = live.some(r => r.stop);
  const title = er ? 'Go to the emergency department now' : PARA_TIER_TITLE[tier];
  let html = '<div class="fe-load fe-load--' + tier + '" role="' + (PARA_TIER[tier] >= PARA_TIER.red ? 'alert' : 'status') + '">';
  html += '<div class="fe-load-title">' + zi('warn') + ' ' + escHtml(title) + '</div>';
  // 1. The one instruction.
  const doLine = _paraDoLine(load, live, where);
  if (doLine) html += '<div class="fe-load-do">' + escHtml(doLine) + '</div>';
  // 2. What to tell them, when a call is the action; the fallback once, when the call is now.
  if (PARA_TIER[tier] >= PARA_TIER.red && load.tellText) html += '<div class="fe-load-tell">' + _paraLeadBold(load.tellText, 'Tell them:') + '</div>';
  if (tier === 'now' && !er) html += '<div class="fe-load-tell">' + escHtml(PARA_ER.trim()) + '</div>';
  // 3. Only what asks the parent to act.
  let chipState = null;
  try { chipState = getParacetamolChip(getLatestWeight()).state; } catch (e) { chipState = null; }
  const acts = [];
  live.forEach(r => { const a = _paraWhy(r).act; if (a && acts.indexOf(a) < 0) acts.push(a); });
  if (live.some(r => r.weightQ)) {
    const lw = getLatestWeight();
    if (load.wq) html += '<div class="fe-load-q">' + escHtml(load.wq.q) + ' Check before the next dose.</div><div class="fe-load-tell">' + escHtml(load.wq.d) + '</div>';
    if (where === 'gi') {
      // One retype, on the fever card: the same ids twice on a page reads the wrong box (Vela V-V-291-4).
      html += '<div class="fe-load-tell">Answer the weight question on the fever card.</div>';
    } else if (chipState === 'confirm') {
      // The chip below is already asking about this weight: one question at a time (Kael V-K-291-9a).
      html += '<div class="fe-load-tell">Confirm the weight in the box below first.</div>';
    } else if (lw) {
      html += '<div class="fe-para-retype"><input id="feLoadRetype" class="ep-edit-input" type="text" inputmode="decimal" autocomplete="off" placeholder="kg" aria-label="Type the newest weight in kilograms to confirm it">'
        + '<button type="button" class="btn btn-soft btn-soft--peach" data-action="feConfirmLoadWeight" data-arg="' + escAttr(lw.date) + '" data-arg2="' + escAttr(String(lw.wt)) + '" aria-label="' + escAttr(_paraKgText(lw.wt) + ' is the right weight') + '">' + escHtml(_paraKgText(lw.wt)) + ' is right</button></div>';
      html += '<div id="feLoadRetypeErr" class="fe-para-retype-err" role="alert"></div>';
    }
    html += '<div class="fe-para-confirm-actions"><button type="button" class="btn btn-peach" data-action="switchTab" data-arg="growth">Fix the weight or add a weight</button></div>';
  }
  if (live.some(r => r.giChips) && load.giQ) {
    const chips = !!getActiveFeverEpisode();
    html += '<div class="fe-load-q">' + escHtml(load.giQ + (chips ? '' : PARA_GI_YES)) + '</div>';   // no chips to tap → say what "yes" means (Maren V-M-291-15)
    if (chips) html += '<div class="fe-action-chips fe-load-chips">' + PARA_GI_ACTIONS.map(a => '<button type="button" class="fe-action-chip" data-action="feLogGiSign" data-arg="' + escAttr(a) + '">' + escHtml(a) + '</button>').join('') + '</div>';
    const watch = (tier === 'now' && !er && load.giWatch.endsWith(PARA_ER)) ? load.giWatch.slice(0, -PARA_ER.length) : load.giWatch;   // one fallback per block (Vela V-V-291-21)
    html += '<div class="fe-load-watch">' + _paraLeadBold(watch, 'Call your doctor now') + '</div>';
  }
  acts.forEach(a => { html += '<div class="fe-load-tell">' + escHtml(a) + '</div>'; });
  if (live.some(r => r.addWeight)) html += '<div class="fe-para-confirm-actions"><button type="button" class="btn btn-soft btn-soft--peach" data-action="switchTab" data-arg="growth">Add a weight</button></div>';
  // 4. Why: the reasons, folded, with a teaser.
  const teasers = [];
  const shown = r => (r.giChips || r.weightQ || _paraWhy(r).gate) ? 0 : 1;
  live.slice().sort((a, b) => shown(a) - shown(b)).forEach(r => { const t = _paraWhy(r).t; if (t && teasers.indexOf(t) < 0) teasers.push(t); });
  if (teasers.length > 2) teasers.splice(2, teasers.length - 2, '+' + (teasers.length - 2) + ' more');
  let body = '';
  const whyLine = (r, l) => {
    let t = l.endsWith(PARA_ER) ? l.slice(0, -PARA_ER.length) : l;   // the fallback is in the lead
    if (r.rule === 'R0') t = t.replace(/ (?:If you haven't yet, call|Call) your doctor today and tell them:.*$/, '');   // "Tell them" is in the lead (Vela V-V-291-20)
    return t;
  };
  live.forEach(r => r.lines.forEach(l => { body += '<p class="fe-load-text">' + escHtml(whyLine(r, l)) + '</p>'; }));
  if (where === 'fever' && load.extra) body += '<p class="fe-load-text">' + escHtml(load.extra) + '</p>';
  const whyKey = where + (card ? '-' + card : '');   // per card: the vomiting and diarrhoea cards fold apart (Vela V-V-291-23)
  const open = !!_feLoadWhyOpen[whyKey];
  html += '<div class="fe-load-prow' + (open ? ' open' : '') + '" data-where="' + escAttr(whyKey) + '">'
    + '<button type="button" class="fe-load-prow-head" data-action="feLoadWhy" aria-expanded="' + (open ? 'true' : 'false') + '">'
    + '<span class="fe-load-prow-txt"><span class="fe-load-prow-t">Why</span><span class="fe-load-prow-d">' + escHtml(teasers.join(' · ')) + '</span></span>'
    + '<span class="fe-load-prow-chev">' + zi('arrow-right') + '</span></button>'
    + '<div class="fe-load-prow-body">' + body + '</div></div>';
  html += '</div>';
  return html;
}
// R1's weight question: "{wt} kg is right" is a retype, as everywhere (decision B). It records a confirm even
// when the jump check passed, so the latest weight becomes the reference weight (§5.1).
function feConfirmLoadWeight(date, wtStr) {
  const input = document.getElementById('feLoadRetype');
  const say = msg => { const e = document.getElementById('feLoadRetypeErr'); if (e) e.textContent = msg; };
  const typed = parseFloat(String(input ? input.value : '').trim().replace(',', '.'));
  const shown = Number(wtStr);
  if (!Number.isFinite(typed) || typed <= 0) { say('Type the weight in kg, for example 9.5.'); return; }
  const row = gvMeasureRows('wt').find(r => r.date === date && r.wt === shown);
  const redraw = () => { renderFeverEpisodeCard(); ['renderVomitingEpisodeCard', 'renderDiarrhoeaEpisodeCard', 'renderHome'].forEach(f => { try { if (typeof window[f] === 'function') window[f](); } catch (e) {} }); };
  if (!row) { redraw(); showQLToast('That weight has changed in Growth. Check it there.'); return; }
  if (Math.round(typed * 100) !== Math.round(shown * 100)) { say('You typed ' + _paraKgText(typed) + '; Growth has ' + _paraKgText(shown) + ' on that date. If Growth is wrong, tap Fix the weight.'); return; }
  // While the jump check is asking, the chip's own box records the answer — never this one (Kael V-K-291-9a,
  // Carina V-CA-291-4). Otherwise a confirm, even though the check passed, makes the latest weight W_ref.
  if (gvWeightNeedsConfirm(row)) { redraw(); showQLToast('Confirm the weight in the box on the fever card first.'); return; }
  const done = gvConfirmRecord(row, null, 'calm');
  redraw();
  if (done && _paraRefWeight() && _paraRefWeight().confirmed) showQLToast(zi('check') + ' Weight confirmed');
  else showQLToast('The weight check has changed. Look again.');
}
// R2's question: "Tummy pain" / "Retching or off food" logged on the active fever episode, now ("Seems sick",
// the earlier chip, still counts when already logged — PARA_GI_MATCH; Ceres V-C-291-6).
function feLogGiSign(label) {
  if (PARA_GI_ACTIONS.indexOf(label) < 0 || !getActiveFeverEpisode()) return;
  logFeverAction(label);
  if (typeof renderVomitingEpisodeCard === 'function') try { renderVomitingEpisodeCard(); } catch (e) {}
  if (typeof renderDiarrhoeaEpisodeCard === 'function') try { renderDiarrhoeaEpisodeCard(); } catch (e) {}
}
// Home alerts for the leftover-risk flow (spec §5.4): while any dose is under 72 h old, whatever the episode's
// status. Keyed on the latest dose time; dismissal keyed on (dose time, tier), so a higher tier shows again.
// Home's alert says what the block leads with: the instruction, "Tell them", the fallback when the call is now
// (the hold time travels with it — Vela V-V-291-12; one fallback — Kael V-K-291-16).
function _paraHomeBody(load, top, er) {
  const live = (load.rules || []).filter(r => r.tier !== 'calm');
  const parts = [_paraDoLine(load, live, 'home')];
  if (PARA_TIER[load.tier] >= PARA_TIER.red && load.tellText) parts.push(load.tellText);
  if (load.tier === 'now' && !er) parts.push(PARA_ER.trim());
  // R2's question turns "today" into "now": it travels at red too (Maren D24).
  if (load.tier === 'red' && live.some(r => r.giChips) && load.giQ) parts.push(load.giQ + PARA_GI_YES);
  if (load.tier === 'amber') {
    // At amber the question or check travels with the time: Home's title never says what to check (Vela V-V-291-19).
    if (live.some(r => r.giChips) && load.giQ) parts.push(load.giQ + PARA_GI_YES);
    else if (live.some(r => r.weightQ) && load.wq) parts.push(load.wq.q);   // the title already says check (Vela V-V-291-27)
    else if (!parts[0] && top) parts.push(_paraWhy(top).act || _paraWhy(top).t || '');
  }
  return parts.filter(Boolean).join(' ');
}
function computeParacetamolLoadAlerts() {
  const alerts = [];
  const load = getParacetamolLoad();
  if (!load || load.none || PARA_TIER[load.tier] < PARA_TIER.amber) return alerts;
  const doses = _paraDosesAll(Date.now());
  const lastT = doses.length ? doses.reduce((m, d) => Math.max(m, d.tRaw), 0) : 0;   // the dose's own time: a fast clock can't move the key
  const top = _paraSurface(load.rules)[0];
  const er = (load.rules || []).some(r => r.er);
  // Home's words: 'action' for red and call-now (no clear control — they stay until the dose state changes),
  // 'watch' for amber. Home's own expiry-aware dismiss/snooze check clears it (computeAlerts) — Carina V-CA-291-1/-6,
  // Kael V-K-291-8, Maren V-M-291-4, Vela V-V-291-1.
  alerts.push({
    id: 'para-load', key: 'para-load-' + lastT + '-' + load.tier,
    severity: PARA_TIER[load.tier] >= PARA_TIER.red ? 'action' : 'watch', icon: zi('pill'),
    title: er ? 'Paracetamol: go to the emergency department now' : load.tier === 'now' ? 'Paracetamol: call your doctor now' : load.tier === 'red' ? 'Paracetamol: call your doctor today' : 'Paracetamol: check before the next dose',
    // The hold time travels with it: Home hides the dose-available alert on a hold, so this is the only place on
    // Home that says how long to wait (Vela V-V-291-12).
    body: _paraHomeBody(_paraWithGap(load, (typeof getFeverDoseCountdown === 'function') ? getFeverDoseCountdown() : null), top, er),
    tab: 'medical'
  });
  return alerts;
}

function _feverDurationStr(ep) {
  const start = new Date(ep.startedAt).getTime();
  const end = ep.resolvedAt ? new Date(ep.resolvedAt).getTime() : Date.now();
  const mins = Math.round((end - start) / 60000);
  if (mins < 60) return mins + 'm';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 24) return h + 'h ' + (m > 0 ? m + 'm' : '');
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return d + 'd ' + (rh > 0 ? rh + 'h' : '');
}

function _feverTimeAgo(isoStr) {
  const mins = Math.round((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const h = Math.floor(mins / 60);
  if (h < 24) return h + 'h ' + (mins % 60 > 0 ? (mins % 60) + 'm' : '') + ' ago';
  return Math.floor(h / 24) + 'd ago';
}

function _feverTimeShort(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function _feverSparklineSVG(readings) {
  if (!readings || readings.length < 2) return '';
  const w = 200, h = 40, pad = 4;
  const temps = readings.map(r => r.temp);
  const minT = Math.min(...temps) - 0.5;
  const maxT = Math.max(...temps) + 0.5;
  const range = maxT - minT || 1;
  const points = readings.map((r, i) => {
    const x = pad + (i / (readings.length - 1)) * (w - pad * 2);
    const y = h - pad - ((r.temp - minT) / range) * (h - pad * 2);
    return x + ',' + y;
  });
  // Threshold lines
  const y99 = h - pad - ((99 - minT) / range) * (h - pad * 2);
  const y102 = h - pad - ((102 - minT) / range) * (h - pad * 2);
  let svg = '<svg class="fe-sparkline" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">';
  // Reference lines
  if (y99 > pad && y99 < h - pad) {
    svg += '<line x1="' + pad + '" y1="' + y99 + '" x2="' + (w - pad) + '" y2="' + y99 + '" stroke="rgba(240,180,80,0.3)" stroke-width="1" stroke-dasharray="4,3"/>';
  }
  if (y102 > pad && y102 < h - pad) {
    svg += '<line x1="' + pad + '" y1="' + y102 + '" x2="' + (w - pad) + '" y2="' + y102 + '" stroke="rgba(224,112,112,0.3)" stroke-width="1" stroke-dasharray="4,3"/>';
  }
  // Line
  svg += '<polyline points="' + points.join(' ') + '" fill="none" stroke="var(--tc-caution)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  // Dots
  readings.forEach((r, i) => {
    const x = pad + (i / (readings.length - 1)) * (w - pad * 2);
    const y = h - pad - ((r.temp - minT) / range) * (h - pad * 2);
    const sev = getFeverSeverity(r.temp);
    const dotColor = sev.color;
    svg += '<circle cx="' + x + '" cy="' + y + '" r="3" fill="' + dotColor + '"/>';
  });
  svg += '</svg>';
  return svg;
}

function renderFeverEpisodeCard() {
  const card = document.getElementById('feverEpisodeCard');
  if (!card) return;
  const ep = getActiveFeverEpisode();
  if (!ep) {
    card.style.display = 'none';
    return;
  }
  card.style.display = '';

  if (ep.readings.length === 0) {
    // All readings deleted — show minimal card with just the log input
    const nowTime = new Date().toTimeString().slice(0, 5);
    card.style.borderLeft = '4px solid var(--tc-amber)';
    card.innerHTML = '<div class="card-header"><div class="card-title"><div class="icon icon-rose"><svg class="zi"><use href="#zi-medical"/></svg></div> Active Fever Episode</div><span class="t-sm t-light">' + _feverDurationStr(ep) + '</span></div>' +
      '<div style="text-align:center;padding:var(--sp-8);font-size:var(--fs-sm);color:var(--light);">No readings logged yet</div>' +
      '<div class="fe-input-row"><span class="t-sm">'+zi('flame')+'</span><input type="number" id="feverTempInput" step="0.1" min="95" max="108" placeholder="°F" inputmode="decimal"><input type="time" id="feverTimeInput" value="' + nowTime + '"><button class="btn btn-sage" data-action="feLogReadingFromInput" data-arg="" style="padding:8px 14px;">Log</button></div>' +
      '<div class="fe-resolve"><button class="btn btn-ghost w-full" data-action="feResolvePrompt" data-arg="" >' + zi('check') + ' Mark Resolved</button></div>';
    return; // feverTempInput/feverTimeInput reused — mutually exclusive with full card below
  }

  const lastReading = ep.readings[ep.readings.length - 1];
  const sev = getFeverSeverity(lastReading.temp);
  const checkCD = getFeverCheckCountdown();
  const doseCD = getFeverDoseCountdown();
  const duration = _feverDurationStr(ep);

  // Card border color
  card.style.borderLeft = '4px solid ' + sev.color;

  // Get weight for dose calc
  // The latest WEIGHT, not the last row: a height-only last row made the dose silently vanish (Carina V-CA-282f-5).
  const paraChip = getParacetamolChip(getLatestWeight());

  let html = '';

  // Header
  html += '<div class="card-header"><div class="card-title"><div class="icon icon-rose"><svg class="zi"><use href="#zi-medical"/></svg></div> Active Fever Episode</div>';
  html += '<span class="t-sm t-light">' + duration + '</span></div>';
  html += _epCameBackHtml(ep);

  // Temperature display
  html += '<div class="fe-temp-display" style="color:' + sev.color + ';">' + lastReading.temp.toFixed(1) + '°F</div>';
  html += '<div class="text-center"><span class="fe-severity fe-severity-' + sev.tier + '">' + sev.label + '</span></div>';
  html += '<div class="fe-last-reading">Last reading: ' + _feverTimeShort(lastReading.time) + ' (' + _feverTimeAgo(lastReading.time) + ')</div>';

  // Sparkline
  if (ep.readings.length >= 2) {
    html += _feverSparklineSVG(ep.readings);
  }

  // Quick temp input
  const nowTime = new Date().toTimeString().slice(0, 5);
  html += '<div class="fe-input-row">';
  html += '<span class="t-sm">' + zi('flame') + '</span>';
  html += '<input type="number" id="feverTempInput" step="0.1" min="95" max="108" placeholder="°F" inputmode="decimal">';
  html += '<input type="time" id="feverTimeInput" value="' + nowTime + '">';
  html += '<button class="btn btn-sage" data-action="feLogReadingFromInput" data-arg="" style="padding:8px 14px;">Log</button>';
  html += '</div>';

  // Countdown
  if (checkCD) {
    const pct = Math.max(0, Math.min(100, ((checkCD.total - Math.max(0, checkCD.remaining)) / checkCD.total) * 100));
    const isOverdue = checkCD.overdue;
    let cdText = '';
    if (isOverdue) {
      cdText = '<span style="color:var(--tc-danger);font-weight:700;">Overdue — ' + Math.abs(checkCD.remaining) + 'm</span>';
    } else if (checkCD.remaining <= 15) {
      cdText = '<span class="t-amber">' + checkCD.remaining + 'm</span>';
    } else {
      const h = Math.floor(checkCD.remaining / 60);
      const m = checkCD.remaining % 60;
      cdText = (h > 0 ? h + 'h ' : '') + m + 'm';
    }
    html += '<div class="fe-countdown" id="feverCheckCountdown">';
    html += '<div class="fe-countdown-text">Next check: ' + cdText + '</div>';
    html += '<div class="fe-countdown-bar"><div class="fe-countdown-fill' + (isOverdue ? ' fe-overdue' : '') + '" style="width:' + pct + '%;' + (isOverdue ? '' : 'background:' + sev.color + ';') + '"></div></div>';
    html += '</div>';
  }

  // Readings timeline
  html += '<div class="fe-section-title">Readings</div>';
  const showReadings = ep.readings.slice().reverse();
  const collapsedMax = 5;
  const hasMore = showReadings.length > collapsedMax;
  // Normalize: once the list shrinks to the cap (readings deleted), drop the
  // expanded state so regrowth past the cap opens collapsed, not expanded.
  if (!hasMore) _feShowAllReadings = false;
  const maxShow = _feShowAllReadings ? showReadings.length : collapsedMax;
  const visibleCount = Math.min(showReadings.length, maxShow);
  html += '<div class="fe-timeline">';
  showReadings.slice(0, maxShow).forEach((r, i) => {
    const rs = getFeverSeverity(r.temp);
    const origIdx = ep.readings.length - 1 - i;
    html += '<div class="fe-tl-entry ep-entry-tap" data-action="feEditReading" data-arg="' + _epRowArg(ep.readings, origIdx) + '">';
    html += '<div class="fe-tl-dot" style="background:' + rs.color + ';"></div>';
    if (i < visibleCount - 1) html += '<div class="fe-tl-line"></div>';
    html += '<div class="fe-tl-time">' + _feverTimeShort(r.time) + '</div>';
    html += '<div class="fe-tl-temp" style="color:' + rs.color + ';">' + r.temp.toFixed(1) + '°F</div>';
    if (r.notes) html += '<div class="fe-tl-notes">' + escHtml(r.notes) + '</div>';
    html += '</div>';
  });
  html += '</div>';
  if (hasMore) {
    html += _feShowAllReadings
      ? '<div class="fe-more-toggle" data-action="feToggleAllReadings">Show fewer ' + zi('chevron-up') + '</div>'
      : '<div class="fe-more-toggle" data-action="feToggleAllReadings">Show ' + (showReadings.length - collapsedMax) + ' earlier ' + zi('chevron-down') + '</div>';
  }

  // Medicine section
  html += '<div class="fe-section-title">Medicine</div>';
  if (ep.doses.length > 0) {
    ep.doses.slice().reverse().forEach((d, i) => {
      const origIdx = ep.doses.length - 1 - i;
      html += '<div class="fe-dose-row ep-entry-tap" data-action="feEditDose" data-arg="' + _epRowArg(ep.doses, origIdx) + '">'+zi('pill')+' ' + (d.dose ? escHtml(d.dose) + ' of ' : '') + escHtml(d.medicine) + ' at ' + _feverTimeShort(d.time) + '</div>';
    });
  }
  // The one answer for the next dose (spec §5.4): the countdown line reads the verdict, never the gap alone.
  // A throw fails closed to "check" and never blanks the card (Maren V-M-291-D8).
  let paraNext;
  try { paraNext = getParacetamolNextDose(); } catch (e) { paraNext = { verdict: 'check', load: null, countdown: doseCD, safe: false }; }
  if (doseCD) {
      // In a new episode the countdown counts from a dose this card doesn't list: name it, or the
      // line reads as a glitch beside "No medicine logged" (Maren V-M-284-11).
      const from = ep.doses.length === 0
        ? 'Last paracetamol at ' + _feverTimeShort(new Date(doseCD.lastTime).toISOString()) + ', in ' + pron('poss') + ' earlier fever. '
        : '';
      // The load block below leads with the instruction (6-second rule, Architect 2026-11-04): no second line here.
      // Only when a block renders (amber or above); an engine throw (load null) keeps the countdown (Maren V-M-291-14).
      const blockLeads = !!(paraNext.load && PARA_TIER[paraNext.load.tier] >= PARA_TIER.amber) && (paraNext.verdict === 'hold' || paraNext.verdict === 'check' || (paraNext.verdict === 'wait' && paraNext.load.untilText));
      if (blockLeads) {
        if (from) html += '<div class="fe-dose-next fe-dose-next--hold">' + from.trim() + '</div>';
      } else if (doseCD.available && paraNext.verdict === 'wait' && paraNext.load && paraNext.load.untilText) {
        html += '<div class="fe-dose-next fe-dose-next--hold">' + from + escHtml(paraNext.load.untilText) + '</div>';
      } else if (doseCD.available) {
        const canDose = (paraChip.state === 'ok' || paraChip.state === 'pick') && paraNext.safe;
        html += canDose
          ? '<div class="fe-dose-next">' + from + 'Next dose can be given now, if needed, as your doctor advised.</div>'
          : '<div class="fe-dose-next fe-dose-next--hold">' + from + (paraChip.state === 'confirm'
            ? 'The 4-hour gap has passed. A dose can be given, if needed, as your doctor advised, once the weight below is checked.'
            : 'The 4-hour gap has passed. See below before giving a dose.') + '</div>';
      } else {
        const dh = Math.floor(doseCD.remaining / 60);
        const dm = doseCD.remaining % 60;
        const at = _feverTimeShort(new Date(doseCD.nextAt).toISOString());
        html += '<div class="fe-dose-next t-light">' + from + (doseCD.reason === 'daily-max'
          ? PARA_MAX_PER_24H + ' doses in the last 24 h, the most allowed. Next dose not before ' + at + ' (in ' + (dh > 0 ? dh + 'h ' : '') + dm + 'm).'
          : 'Next dose not before ' + at + ' (in ' + (dh > 0 ? dh + 'h ' : '') + dm + 'm, 4 h gap).') + '</div>';
      }
  }
  if (ep.doses.length === 0) {
    html += '<div class="fe-dose-row fe-dose-empty">No medicine logged since this fever started</div>';
  }
  html += _paraLoadHtml(_paraWithGap(paraNext.load, doseCD), 'fever');
  // Paracetamol: which bottle, then the dose for HER weight — named, dated, sanity-checked (Maren V-M-282g-6).
  // A weight the check flagged leads the section (#161 §4.4).
  if (paraChip.state === 'confirm') html += _paraConfirmHtml(paraChip);
  html += '<div class="fe-para-q">Which paracetamol bottle do you have?</div>';
  html += '<div class="fe-para-forms" role="group" aria-label="Paracetamol bottle">';
  PARACETAMOL_FORMS.forEach(f => {
    const on = !!paraChip.form && f.id === paraChip.form.id;
    html += '<span class="fe-para-form' + (on ? ' active' : '') + '" role="button" aria-pressed="' + (on ? 'true' : 'false') + '" data-action="feSetParaForm" data-arg="' + escAttr(f.id) + '">' + (on ? zi('check') + ' ' : '') + escHtml(f.label) + '</span>';
  });
  html += '</div>';
  const earlier = _paraEarlierFormHint();
  if (earlier) {
    html += '<div class="fe-para-note">Last fever you used ' + escHtml(earlier.short) + '. Check the bottle in your hand and tap it.</div>';
  }
  if (paraChip.state === 'ok' && paraNext && paraNext.verdict === 'hold') {
    // The chip never shows a dose under a stop (spec §5.4: the card reads only the verdict — Kael V-K-291-7).
    html += '<div class="fe-para-note">The dose is hidden while the box above says to stop. ' + ((paraNext.load && (paraNext.load.rules || []).some(r => r.er)) ? 'Follow the box above first.' : 'Speak to your doctor first.') + '</div>';
  } else if (paraChip.state === 'ok') {
    if (paraNext && paraNext.verdict === 'check') html += '<div class="fe-para-note">Check the box above before giving this.</div>';
    // mg first, so the line can be checked against any label or prescription (V-M-284-1c).
    html += '<div class="fe-para-dose">' + escHtml(paraChip.dose.display) + ' <span class="t-light">of ' + escHtml(paraChip.form.short) + '</span></div>';
    html += '<div class="fe-para-note t-light">' + paraChip.dose.lowMg + '–' + paraChip.dose.highMg + ' mg, for ' + escHtml(String(paraChip.wt)) + ' kg, weighed ' + escHtml(paraChip.dateLabel) + '</div>';
    if (paraChip.stale) {
      html += '<div class="fe-para-note">That weight is ' + Math.floor(paraChip.ageDays / 7) + ' weeks old. The dose follows weight, so weigh ' + pron('obj') + ' again when you can, and check with your doctor.</div>';
    }
    html += _paraLossLineHtml(paraChip, ep);
  } else if (paraChip.state === 'confirm') {
    // The block above says it all; nothing more here.
  } else if (paraChip.state === 'pick') {
    html += '<div class="fe-para-note">Tap the bottle you have to see the dose for ' + escHtml(String(paraChip.wt)) + ' kg.</div>';
    html += _paraLossLineHtml(paraChip, ep);
  } else if (paraChip.state === 'askdoctor') {
    html += '<div class="fe-para-note fe-para-warn">' + zi('warn') + ' Under 3 months, ask your doctor before giving paracetamol.</div>';
  } else if (paraChip.state === 'nodose') {
    html += '<div class="fe-para-note fe-para-warn">' + zi('warn') + ' The last weight, ' + escHtml(String(paraChip.wt)) + ' kg, is too old to dose from. Weigh ' + pron('obj') + ' again, or ask your doctor for the dose.</div>';
  } else if (paraChip.state === 'baddate') {
    html += '<div class="fe-para-note fe-para-warn">' + zi('warn') + (paraChip.why === 'beforebirth' ? ' The last weight is dated before ' + pron('poss') + ' birth date.' : ' The last weight has a date in the future.') + ' Check it in Growth before working out a dose.</div>';
  } else if (paraChip.state === 'outofrange') {
    // Calm, not the warn style: nothing is wrong with the weight (V-M-287-4).
    html += '<div class="fe-para-note">The weight check here covers children up to age 5, so it can\'t work out a dose from ' + pron('poss') + ' weight. Ask your doctor or chemist for the dose.</div>';
  } else if (paraChip.state === 'implausible') {
    html += '<div class="fe-para-note fe-para-warn">' + zi('warn') + ' The last weight, ' + escHtml(String(paraChip.wt)) + ' kg, looks off for ' + pron('poss') + ' age. Check it in Growth before working out a dose. If ' + pron('subj') + ' needs medicine now, ask your doctor or chemist for the dose.</div>';
  } else if (paraChip.state === 'noweight') {
    html += '<div class="fe-para-note">Add a weight in Growth to see a dose. Dosing is by weight.</div>';
  } else {
    // A state with no branch never shows a dose (fail closed).
    html += '<div class="fe-para-note">The dose can\'t be worked out here. Ask your doctor or chemist for the dose.</div>';
  }
  html += '<div class="fe-para-note t-light">Give it if ' + pron('subj') + ' seems uncomfortable or your doctor advised it, not just to lower the number. Your doctor\'s dose comes first. Measure with the dropper or an oral syringe, never a kitchen spoon. At least 4 h apart, no more than 4 doses in 24 h.</div>';
  html += '<div class="fe-para-log"><span class="fe-action-chip" data-action="feLogDosePrompt">+ Log paracetamol dose</span></div>';

  // Actions section
  html += '<div class="fe-section-title">Actions</div>';
  html += _epTimePickerHTML('feAction');
  const ACTION_CHIPS = ['Lukewarm sponging', 'Breastfed', 'Fluids given', 'Changed clothes', 'Doctor called'];
  html += '<div class="fe-action-chips">';
  ACTION_CHIPS.forEach(a => {
    html += '<span class="fe-action-chip" data-action="logFeverAction" data-arg="feAction" data-arg2="' + escAttr(a) + '">' + escHtml(a) + '</span>';
  });
  html += '</div>';
  if (ep.actions.length > 0) {
    ep.actions.slice().reverse().slice(0, 5).forEach((a, i) => {
      const origIdx = ep.actions.length - 1 - i;
      html += '<div class="fe-action-entry ep-entry-tap" data-action="feEditAction" data-arg="' + _epRowArg(ep.actions, origIdx) + '">' + _feverTimeShort(a.time) + ' — ' + escHtml(a.action) + '</div>';
    });
  }

  // Guidance
  html += '<div class="fe-section-title">Guidance</div>';
  html += '<div class="fe-guidance"><ul class="ep-list">';
  html += '<li>Keep ' + childNameHtml() + ' lightly dressed — do not over-bundle</li>';
  html += '<li>Offer breast milk or fluids frequently</li>';
  html += '<li>Sponge with lukewarm water (never cold)</li>';
  // Under 3 months any temperature of 38°C (100.4°F) or more needs a doctor the same day (NHS
  // 'High temperature (fever) in children': "Call 111 if your child is under 3 months old and has
  // a temperature of 38C or higher"; V-M-282-2). The 102°F / 48 h line is for older babies.
  if (ageAt().months < 3 && lastReading.temp >= 100.4) {
    html += '<li class="status-action">'+zi('siren')+' Under 3 months: call the doctor now, the same day — temperature is ' + lastReading.temp.toFixed(1) + '°F</li>';
  } else if (sev.tier === 'high' || sev.tier === 'critical') {
    html += '<li class="status-action">'+zi('siren')+' Call doctor — temperature is ' + lastReading.temp.toFixed(1) + '°F</li>';
  } else if (ageAt().months < 3) {
    html += '<li>Under 3 months: call the doctor the same day for any temperature of 100.4°F (38°C) or more</li>';
  } else {
    html += '<li>Call doctor if fever exceeds 102°F or lasts > 48 hours</li>';
  }
  // child-sex S3 fever-triage hint (Kael + Maren co-own). Under 2, a UTI is "an important cause
  // for fever without a focus" (ISPN, Indian Pediatr 2011;48:709) and may be the only sign
  // (AAP HealthyChildren 'Detecting UTIs'); only a urine test tells (RCH Melbourne UTI CPG);
  // ISPN 2023 starts its urine pathway at fever > 48 h without focus under 24 months.
  // Sources + quotes: docs/specs/care-guidance-s3-sources.md §X3.
  if (ageAt().months < 24) {
    html += '<li>No clear cause, like a cold or tummy bug? Ask the doctor whether a urine test is needed — under 2, a urine infection can show only as fever.</li>';
  }
  html += '</ul></div>';

  // Escalation warnings
  const escalations = _computeFeverEscalations(ep);
  if (escalations.length > 0) {
    escalations.forEach(e => {
      html += '<div style="padding:8px 12px;border-radius:var(--r-md);margin:var(--sp-4) 0;background:' + (e.severity === 'emergency' ? 'var(--surface-rose)' : 'var(--surface-caution)') + ';font-size:var(--fs-sm);font-weight:600;color:' + (e.severity === 'emergency' ? 'var(--tc-danger)' : 'var(--tc-caution)') + ';">' + e.icon + ' ' + escHtml(e.text) + '</div>';
    });
  }

  // Breaking check: 2 consecutive readings below the fever start (FE_FEVER_START_F)
  const recentTwo = ep.readings.slice(-2);
  if (recentTwo.length >= 2 && recentTwo.every(r => r.temp < FE_FEVER_START_F)) {
    html += '<div style="padding:10px 12px;border-radius:var(--r-md);margin:var(--sp-8) 0;background:rgba(58,112,96,0.08);font-size:var(--fs-sm);color:var(--tc-sage);font-weight:600;">' + zi('check') + ' Temperature normalizing — continue monitoring for 6 hours before resolving</div>';
  }

  // Resolve button
  html += '<div class="fe-resolve"><button class="btn btn-ghost w-full" data-action="feResolvePrompt" data-arg="" >' + zi('check') + ' Mark Resolved</button></div>';

  // Disclaimer
  html += '<div class="source-attribution">Guidance only — not medical advice. Trust your instincts and call your paediatrician when in doubt.</div>';

  card.innerHTML = html;
}

function _computeFeverEscalations(ep) {
  const warnings = [];
  if (ep.readings.length === 0) return warnings;
  const lastReading = ep.readings[ep.readings.length - 1];

  // Temp >= 104
  if (lastReading.temp >= 104) {
    warnings.push({ severity: 'emergency', icon: zi('siren'), text: 'Temperature is critically high — seek immediate medical attention' });
  }

  // Temp >= 102 for 2+ readings
  const highReadings = ep.readings.filter(r => r.temp >= 102);
  if (highReadings.length >= 2 && lastReading.temp < 104) {
    warnings.push({ severity: 'warning', icon: zi('warn'), text: 'Multiple readings above 102°F — consider calling doctor' });
  }

  // Episode > 48 hours
  const durationH = (Date.now() - new Date(ep.startedAt).getTime()) / 3600000;
  if (durationH > 48) {
    // Fold, don't duplicate (spec §5.3): the call names the paracetamol given.
    let paraTell = '';
    try { const L = getParacetamolLoad(); if (L && L.n24) paraTell = '. Tell them about the paracetamol: ' + L.n24 + (L.n24 === 1 ? ' dose, ' : ' doses, ') + _paraMgText(L.lo24, L.hi24) + ' in the last 24 h'; } catch (e) {}
    warnings.push({ severity: 'warning', icon: zi('warn'), text: 'Fever persisting > 48 hours — call your paediatrician' + paraTell });
  }

  // 3+ doses in 12 hours
  const last12h = Date.now() - 12 * 3600000;
  const recentDoses = ep.doses.filter(d => new Date(d.time).getTime() > last12h);
  if (recentDoses.length >= 3) {
    warnings.push({ severity: 'warning', icon: zi('warn'), text: 'Multiple doses in 12 hours — verify dosing frequency with doctor' });
  }

  // Temperature rising across 3 consecutive readings
  if (ep.readings.length >= 3) {
    const last3 = ep.readings.slice(-3);
    if (last3[2].temp > last3[1].temp && last3[1].temp > last3[0].temp) {
      warnings.push({ severity: 'warning', icon: zi('chart'), text: 'Temperature trending upward across last 3 readings' });
    }
  }

  return warnings;
}

function feLogReadingFromInput() {
  const tempInput = document.getElementById('feverTempInput');
  const timeInput = document.getElementById('feverTimeInput');
  if (!tempInput) return;
  const tempF = parseFloat(tempInput.value);
  if (isNaN(tempF) || tempF < 95 || tempF > 108) {
    tempInput.focus();
    return;
  }
  // Build ISO time from time input
  const timeVal = timeInput ? timeInput.value : '';
  let isoTime = new Date().toISOString();
  if (timeVal) {
    const [hh, mm] = timeVal.split(':');
    const d = new Date();
    d.setHours(parseInt(hh), parseInt(mm), 0, 0);
    isoTime = d.toISOString();
  }

  // If no active episode, start one
  if (!getActiveFeverEpisode()) {
    if (tempF >= FE_FEVER_START_F) {
      startFeverEpisode(tempF, 'manual');
      renderFeverEpisodeCard();
      renderHomeFeverBanner();
      renderFeverHistory();
      showQLToast(zi('flame') + ' Fever episode started — ' + tempF.toFixed(1) + '°F');
    } else {
      showQLToast('Temperature is normal (' + tempF.toFixed(1) + '°F)');
    }
  } else {
    logFeverReading(tempF, isoTime, '');
    showQLToast(zi('flame') + ' Reading logged — ' + tempF.toFixed(1) + '°F');
  }
  tempInput.value = '';
}

function feLogDosePrompt() {
  const ep = getActiveFeverEpisode();
  if (!ep) return;
  // The latest WEIGHT, not the last row: a height-only last row made the dose silently vanish (Carina V-CA-282f-5).
  const chip = getParacetamolChip(getLatestWeight());
  // Prefill only from a believable weight; otherwise the parent types what they gave.
  const defaultDose = chip.state === 'ok' ? chip.dose.lowMl + ' ml' : '';
  // The bottle goes on the record only when the parent picked it (V-M-284-1: no unconfirmed default saved).
  const label = chip.form ? 'Paracetamol ' + chip.form.short : 'Paracetamol';
  const dose = prompt(label + ', amount given:', defaultDose);
  if (dose === null) return;
  logFeverDose(label, dose, null, '', chip.form ? chip.form.id : null);
  showQLToast(zi('pill') + ' Dose logged');
}

// ── Fever Edit/Delete ──

function feEditReading(arg) {
  const ep = getActiveFeverEpisode();
  const idx = _epIdxOf(ep, 'readings', arg);   // the row carries the entry id (V-CA-P3-2, V-K-P3-5)
  if (idx < 0) return;
  const epId = ep.id, eid = ep.readings[idx].id;
  const r = ep.readings[idx];
  _epEditEntry({
    title: 'Edit Temperature Reading',
    fields: [
      { label: 'Temperature (°F)', id: 'temp', type: 'number', value: r.temp, step: '0.1' },
      { label: 'Time', id: 'time', type: 'time', value: r.time },
      { label: 'Notes', id: 'notes', type: 'text', value: r.notes || '' }
    ],
    onSave: function(v) {
      const L = _epLive('fever', epId, 'readings', eid); if (!L) return _EP_GONE;
      const ep = L.ep, idx = L.i;   // the live entry at commit, never the one captured at open
      ep.readings[idx].temp = parseFloat(v.temp) || r.temp;
      ep.readings[idx].time = _epTimeToISO(v.time, ep.readings[idx].time);
      ep.readings[idx].notes = v.notes || '';
      ep.peakTemp = Math.max(...ep.readings.map(x => x.temp));
      ep.readings[idx].editedAt = new Date().toISOString();   // an edited entry wins whole on merge (V-K-P3-9)
      _epSave('feverEpisodes', _feverEpisodes);
      renderFeverEpisodeCard(); renderHomeFeverBanner();
      showQLToast(zi('flame') + ' Reading updated');
    },
    onDelete: function() {
      const L = _epLive('fever', epId, 'readings', eid); if (!L) { showQLToast(_EP_GONE_DEL); return; }
      const ep = L.ep, idx = L.i;
      _epTombstone(ep, 'readings', idx);
      ep.readings.splice(idx, 1);
      if (ep.readings.length > 0) ep.peakTemp = Math.max(...ep.readings.map(x => x.temp));
      _epSave('feverEpisodes', _feverEpisodes);
      renderFeverEpisodeCard(); renderHomeFeverBanner();
      showQLToast(zi('flame') + ' Reading deleted');
    }
  });
}

function feEditDose(arg) {
  const ep = getActiveFeverEpisode();
  const idx = _epIdxOf(ep, 'doses', arg);   // the row carries the entry id (V-CA-P3-2, V-K-P3-5)
  if (idx < 0) return;
  const epId = ep.id, eid = ep.doses[idx].id;
  const d = ep.doses[idx];
  _epEditEntry({
    title: 'Edit Medicine Dose',
    fields: [
      { label: 'Medicine', id: 'medicine', type: 'text', value: d.medicine },
      { label: 'Dose', id: 'dose', type: 'text', value: d.dose },
      { label: 'Time', id: 'time', type: 'time', value: d.time }
    ],
    onSave: function(v) {
      const L = _epLive('fever', epId, 'doses', eid); if (!L) return _EP_GONE;
      const ep = L.ep, idx = L.i;   // the live entry at commit, never the one captured at open
      if (v.medicine && v.medicine !== d.medicine) delete ep.doses[idx].form;   // V-CA-284-1: one answer per dose
      ep.doses[idx].medicine = v.medicine || d.medicine;
      ep.doses[idx].dose = v.dose || d.dose;
      ep.doses[idx].time = _epTimeToISO(v.time, ep.doses[idx].time);
      ep.doses[idx].editedAt = new Date().toISOString();   // an edited entry wins whole on merge (V-K-P3-9)
      _epSave('feverEpisodes', _feverEpisodes);
      renderFeverEpisodeCard();
      showQLToast(zi('pill') + ' Dose updated');
    },
    onDelete: function() {
      const L = _epLive('fever', epId, 'doses', eid); if (!L) { showQLToast(_EP_GONE_DEL); return; }
      const ep = L.ep, idx = L.i;
      _epTombstone(ep, 'doses', idx);
      ep.doses.splice(idx, 1);
      _epSave('feverEpisodes', _feverEpisodes);
      renderFeverEpisodeCard();
      showQLToast(zi('pill') + ' Dose deleted');
    }
  });
}

function feEditAction(arg) {
  const ep = getActiveFeverEpisode();
  const idx = _epIdxOf(ep, 'actions', arg);   // the row carries the entry id (V-CA-P3-2, V-K-P3-5)
  if (idx < 0) return;
  const epId = ep.id, eid = ep.actions[idx].id;
  const a = ep.actions[idx];
  _epEditEntry({
    title: 'Edit Action',
    fields: [
      { label: 'Action', id: 'action', type: 'text', value: a.action },
      { label: 'Time', id: 'time', type: 'time', value: a.time }
    ],
    onSave: function(v) {
      const L = _epLive('fever', epId, 'actions', eid); if (!L) return _EP_GONE;
      const ep = L.ep, idx = L.i;   // the live entry at commit, never the one captured at open
      ep.actions[idx].action = v.action || a.action;
      ep.actions[idx].time = _epTimeToISO(v.time, ep.actions[idx].time);
      ep.actions[idx].editedAt = new Date().toISOString();   // an edited entry wins whole on merge (V-K-P3-9)
      _epSave('feverEpisodes', _feverEpisodes);
      renderFeverEpisodeCard();
      showQLToast('Action updated');
    },
    onDelete: function() {
      const L = _epLive('fever', epId, 'actions', eid); if (!L) { showQLToast(_EP_GONE_DEL); return; }
      const ep = L.ep, idx = L.i;
      _epTombstone(ep, 'actions', idx);
      ep.actions.splice(idx, 1);
      _epSave('feverEpisodes', _feverEpisodes);
      renderFeverEpisodeCard();
      showQLToast('Action deleted');
    }
  });
}

// ── Edit a resolved episode's end (all four illness histories) ──
// A parent often taps Resolve late ("she was fine by Tuesday morning"), and resolvedAt was the
// tap time with no way to change it, so the history's end date and duration were wrong for good.
// Tapping a history row opens the shared edit sheet on the end date, time and notes.
// Guard rails (Governor round, PR #267): not in the future; not before the episode started;
// not before its last SYMPTOM entry (Architect call: fluids, wet diapers, doses and actions
// logged during recovery don't hold the end back); not past the next same-kind episode's start;
// an edit that lengthens the episode by more than a day asks to be saved twice. The first
// edit keeps the tap time (resolvedAtOriginal) and marks the row "end time edited".
// No Delete here: removing a whole episode from history is not what this sheet is for.
const _EP_RESOLVE_KINDS = {
  fever:     { label: 'Fever',     noun: 'fever',     symptoms: ['readings'],  what: 'reading',
               list: () => _feverEpisodes,     set: v => { _feverEpisodes = v; },     key: 'feverEpisodes',     render: () => renderFeverHistory(),
               active: () => { renderFeverEpisodeCard(); if (getActiveFeverEpisode()) _startFeverCountdown(); } },
  diarrhoea: { label: 'Diarrhoea', noun: 'diarrhoea', symptoms: ['stools'],    what: 'stool',
               list: () => _diarrhoeaEpisodes, set: v => { _diarrhoeaEpisodes = v; }, key: 'diarrhoeaEpisodes', render: () => renderDiarrhoeaHistory(),
               active: () => renderDiarrhoeaEpisodeCard() },
  vomiting:  { label: 'Vomiting',  noun: 'vomiting',  symptoms: ['episodes'],  what: 'vomit',
               list: () => _vomitingEpisodes,  set: v => { _vomitingEpisodes = v; },  key: 'vomitingEpisodes',  render: () => renderVomitingHistory(),
               active: () => renderVomitingEpisodeCard() },
  cold:      { label: 'Cold',      noun: 'cold',      symptoms: ['dailyLogs'], what: 'day log',
               list: () => _coldEpisodes,      set: v => { _coldEpisodes = v; },      key: 'coldEpisodes',      render: () => renderColdHistory(),
               active: () => renderColdEpisodeCard() }
};

// Latest SYMPTOM entry in an episode → {t, entry} or null. Cold day-logs without a time fall
// back to the start of their date (Kael V-K-267-4).
function _epLatestSymptom(ep, fields) {
  let best = null;
  (fields || []).forEach(k => {
    (Array.isArray(ep[k]) ? ep[k] : []).forEach(x => {
      if (!x) return;
      let t = x.time ? new Date(x.time).getTime() : NaN;
      if (isNaN(t) && x.date) { const iso = _epLocalToISO(x.date, '00:00'); t = iso ? new Date(iso).getTime() : NaN; }
      if (!isNaN(t) && (!best || t > best.t)) best = { t: t, entry: x };
    });
  });
  return best;
}

const _epMinute = t => Math.floor(t / 60000) * 60000; // minute granularity: the sheet has no seconds

function epEditResolved(kind, id) {
  const cfg = _EP_RESOLVE_KINDS[kind];
  if (!cfg) return;
  // Re-read the stored list first (Kael V-K-267-3): the in-memory array can be stale on a device
  // left open while the other parent logged, and saving it whole would revert their entries.
  const stored = load(KEYS[cfg.key], null);
  if (Array.isArray(stored)) {
    cfg.set(_epNormalize(kind, stored));   // legacy entries keep their deterministic ids — never random ones on save (V-CA-289-3, V-M-289-4)
    // Re-render the active card from the re-read list so its rows carry the same entry ids (Cipher A1).
    try { cfg.active(); } catch (e) { console.warn('[epEditResolved] active re-render', e); }
  }
  const list = cfg.list();
  const ep = list.find(e => e.id === id && e.status === 'resolved');
  if (!ep) return;
  const started = new Date(ep.startedAt).getTime();
  const prefillDate = _epLocalDateStr(ep.resolvedAt), prefillTime = _epLocalTimeStr(ep.resolvedAt);
  const last = _epLatestSymptom(ep, cfg.symptoms);
  const nextStart = list.filter(e => e !== ep && e.startedAt && new Date(e.startedAt).getTime() > started)
    .map(e => new Date(e.startedAt).getTime()).reduce((a, b) => Math.min(a, b), Infinity);
  const when = t => formatDate(_epLocalDateStr(new Date(t).toISOString())) + ', ' + _feverTimeShort(new Date(t).toISOString());
  let hint = kind === 'fever'
    ? 'Set the time ' + pron('poss') + ' temperature was back to normal (below 99°F).'
    : 'Set the time ' + pron('subj') + ' was well again.';
  hint += ' Started ' + when(started) + '.';
  if (last) hint += ' Last ' + cfg.what + ': ' + (kind === 'fever' && typeof last.entry.temp === 'number' ? last.entry.temp.toFixed(1) + '°F, ' : '') + when(last.t) + '.';
  let confirmLongerFor = null;
  _epEditEntry({
    title: 'When did the ' + cfg.noun + ' end?',
    hint: hint,
    fields: [
      { label: 'Ended on', id: 'rdate', type: 'date', value: prefillDate, min: _epLocalDateStr(ep.startedAt), max: _epLocalDateStr() },
      { label: 'Ended at', id: 'rtime', type: 'time', value: ep.resolvedAt },
      { label: 'Notes', id: 'rnotes', type: 'text', value: ep.resolvedNotes || '' }
    ],
    onSave: function(v) {
      const unchanged = v.rdate === prefillDate && v.rtime === prefillTime;
      const iso = unchanged ? ep.resolvedAt : _epLocalToISO(v.rdate, v.rtime);
      if (!iso) return 'Pick a date and a time.';
      const t = new Date(iso).getTime();
      if (!unchanged) {
        if (t > Date.now() + 60000) return 'That time is in the future.';
        if (!isNaN(started) && t < _epMinute(started)) return 'That is before the ' + cfg.noun + ' started (' + when(started) + ').';
        if (last && t < _epMinute(last.t)) return 'That is before the last ' + cfg.what + ' (' + (kind === 'fever' && typeof last.entry.temp === 'number' ? last.entry.temp.toFixed(1) + '°F, ' : '') + when(last.t) + ').';
        if (t > nextStart) return 'That runs into the next ' + cfg.noun + ', which started ' + when(nextStart) + '.';
        const oldT = new Date(ep.resolvedAt).getTime();
        if (!isNaN(oldT) && t - oldT > 86400000 && confirmLongerFor !== iso) {
          confirmLongerFor = iso;
          const days = Math.max(1, Math.round((t - started) / 86400000));
          return 'This makes the ' + cfg.noun + ' last about ' + days + ' day' + (days !== 1 ? 's' : '') + '. Tap Save again if that is right.';
        }
      }
      // Commit to the LIVE list and episode, by id: a receive while the sheet was open may have
      // replaced the array (V-CA-P3-2, V-K-P3-5).
      const liveList = cfg.list();
      const live = liveList.find(e => e.id === id && e.status === 'resolved');
      if (!live) return _EP_GONE;
      if (!unchanged) {
        if (!live.resolvedAtOriginal) live.resolvedAtOriginal = live.resolvedAt;
        live.resolvedAt = iso;
        live.resolvedEditedAt = new Date().toISOString();
      }
      const notesChanged = (live.resolvedNotes || '') !== (v.rnotes || '');
      live.resolvedNotes = v.rnotes || '';
      // A real change to the resolve group — end time or notes — stamps it; an empty Save must not outrank
      // an earlier real edit from the other phone (Kael V-K-289-10).
      if (!unchanged || notesChanged) live.resolvedUpdatedAt = new Date().toISOString();
      _epSave(cfg.key, liveList);
      cfg.render();
      if (typeof renderHome === 'function') renderHome();
      showQLToast(cfg.label + ' episode updated');
      return undefined;
    }
  });
}

// Tap attributes for a history row (only when the episode has an id — Kael V-K-267-6).
function _epHistoryEditAttrs(kind, ep) {
  if (!ep || typeof ep.id !== 'string') return '';
  return ' data-action="epEditResolved" data-arg="' + kind + '" data-arg2="' + escAttr(ep.id) + '"';
}
function _epHistoryRowOpen(kind, ep) {
  const attrs = _epHistoryEditAttrs(kind, ep);
  return '<div class="fe-history-entry' + (attrs ? ' ep-entry-tap' : '') + '"' + attrs + '>';
}
function _epHistoryEditLabel(ep) {
  return (ep && typeof ep.id === 'string') ? '<span class="fe-history-edit">Edit</span>' : '';
}
// "End time edited" trace for a corrected record (Maren V-M-267-3).
function _epHistoryEditedLine(ep) {
  return ep && ep.resolvedEditedAt ? '<div class="fe-history-detail fe-history-edited">End time edited</div>' : '';
}

function feResolvePrompt() {
  // V-M-41 shield (PR-D) — `'Resolve'` btnText prevents 'Confirm' fallback;
  // split/audit-resolve-shield.sh fails the build if dropped. Parent reads
  // this at midnight post-episode — 'Resolve' names the action verb
  // explicitly; 'Confirm' is action-ambiguous on a "Has X resolved?" prompt.
  confirmAction('Has ' + childNameHtml() + '\'s temperature been normal (below 99°F) for at least 6 hours?', function() {
    resolveFeverEpisode('');
    showQLToast('' + zi('check') + ' Fever episode resolved');
  }, 'Resolve');
}

function feToggleAllReadings() {
  // Flip the expand/collapse flag, then re-render — the readings timeline
  // reads _feShowAllReadings to decide between the 5-reading cap and all.
  _feShowAllReadings = !_feShowAllReadings;
  renderFeverEpisodeCard();
}

function renderHomeFeverBanner() {
  const banner = document.getElementById('homeFeverBanner');
  if (!banner) return;
  const ep = getActiveFeverEpisode();
  if (!ep || ep.readings.length === 0) {
    banner.style.display = 'none';
    return;
  }
  banner.style.display = '';
  const lastReading = ep.readings[ep.readings.length - 1];
  const sev = getFeverSeverity(lastReading.temp);
  const checkCD = getFeverCheckCountdown();

  let cdText = '';
  if (checkCD) {
    if (checkCD.overdue) {
      cdText = 'Check overdue';
    } else {
      const h = Math.floor(checkCD.remaining / 60);
      const m = checkCD.remaining % 60;
      cdText = 'Next check: ' + (h > 0 ? h + 'h ' : '') + m + 'm';
    }
  }

  banner.innerHTML = '<div class="fe-home-banner fe-home-banner-' + sev.tier + '" data-nav-track-medical="feverEpisodeCard">' +
    '<div class="fe-home-banner-info">' +
    '<div class="fe-home-banner-temp" style="color:' + sev.color + ';">' + zi('flame') + ' ' + lastReading.temp.toFixed(1) + '°F · ' + sev.label + ' · ' + _feverTimeAgo(lastReading.time) + '</div>' +
    '<div class="fe-home-banner-sub">' + cdText + '</div>' +
    '</div>' +
    '<button class="btn btn-sage btn-sm-inline" data-action="feHomeBannerLog" data-stop="1" >' + zi('note') + ' Log</button>' +
    '</div>';
}

function feHomeBannerLog() {
  // Open a mini prompt for temperature
  const tempStr = prompt('Current temperature (°F):');
  if (tempStr === null) return;
  const tempF = parseFloat(tempStr);
  if (isNaN(tempF) || tempF < 95 || tempF > 108) return;
  if (!getActiveFeverEpisode()) {
    if (tempF >= FE_FEVER_START_F) startFeverEpisode(tempF, 'home-banner');
    else { showQLToast('Temperature is normal'); return; }
  } else {
    logFeverReading(tempF, null, '');
  }
  showQLToast(zi('flame') + ' ' + tempF.toFixed(1) + '°F logged');
  renderHome();
}

function renderFeverHistory() {
  const card = document.getElementById('feverHistoryCard');
  const summary = document.getElementById('feverHistorySummary');
  const body = document.getElementById('feverHistoryBody');
  if (!card || !summary || !body) return;

  const resolved = _feverEpisodes.filter(e => e.status === 'resolved');
  if (resolved.length === 0) {
    card.style.display = 'none';
    return;
  }
  card.style.display = '';

  const last = resolved[resolved.length - 1];
  const lastDate = last.resolvedAt ? formatDate(_epLocalDateStr(last.resolvedAt)) : '';
  summary.innerHTML = '<div class="t-sm t-light">' + resolved.length + ' episode' + (resolved.length !== 1 ? 's' : '') + (lastDate ? ' · last: ' + lastDate : '') + '</div>';

  let html = '';
  resolved.slice().reverse().forEach(ep => {
    const startD = formatDate(_epLocalDateStr(ep.startedAt));
    const endD = ep.resolvedAt ? formatDate(_epLocalDateStr(ep.resolvedAt)) : '';
    const dur = _feverDurationStr(ep);
    const doseCount = ep.doses.length;
    const readingCount = ep.readings.length;

    html += _epHistoryRowOpen('fever', ep);
    html += '<div class="fe-history-date"><span>' + startD + (endD && endD !== startD ? ' — ' + endD : '') + ' · Peak: ' + ep.peakTemp.toFixed(1) + '°F</span>' + _epHistoryEditLabel(ep) + '</div>';
    html += '<div class="fe-history-detail">Duration: ' + dur + ' · ' + readingCount + ' reading' + (readingCount !== 1 ? 's' : '');
    if (doseCount > 0) html += ' · Paracetamol ×' + doseCount;
    html += '</div>';
    if (ep.resolvedNotes) html += '<div class="fe-history-detail">' + escHtml(ep.resolvedNotes) + '</div>';
    html += _epHistoryEditedLine(ep);
    html += _renderAttribution(ep);
    html += '</div>';
  });
  body.innerHTML = html;
}

function computeFeverAlerts() {
  const alerts = [];
  const ep = getActiveFeverEpisode();
  if (!ep || ep.readings.length === 0) return alerts;

  const state = loadAlertState();
  function isDismissed(key) { return !!state.dismissed[key]; }
  const todayStr = today();

  // Check due
  const checkCD = getFeverCheckCountdown();
  if (checkCD && checkCD.overdue) {
    const key = 'fever-check-due-' + todayStr + '-' + ep.readings.length;
    if (!isDismissed(key)) {
      alerts.push({
        id: 'fever-check-due', key,
        severity: 'watch', icon: zi('flame'),
        title: 'Temperature check due',
        body: 'Last reading was ' + _feverTimeAgo(ep.readings[ep.readings.length - 1].time) + '. Time to check again.',
        action: { label: 'Log Reading', fn: 'switchTab("track");setTimeout(function(){switchTrackSub("medical");},100);' },
        tab: 'medical', dismissable: true
      });
    }
  }

  // Dose available
  const doseCD = getFeverDoseCountdown();
  if (doseCD && doseCD.available && ep.readings.length && ep.readings[ep.readings.length - 1].temp >= 100) {
    // Keyed on the dose the wait counts from: the count now spans episodes (V-K-284-11).
    const key = 'fever-dose-avail-' + doseCD.lastTime;
    // "Safe to give" only when the card can show a dose; while the weight check asks (or the dose can't be
    // worked out), Home sends the parent to the card instead — one state, one answer (Kael V-K-290-1, Maren
    // V-M-290-1). No confirm control on Home (spec §4.4).
    let chipState = 'ok', next = null;
    try { chipState = getParacetamolChip(getLatestWeight()).state; } catch (e) { chipState = 'unknown'; }
    try { next = getParacetamolNextDose(); } catch (e) { next = null; }
    // "Safe to give" needs the one verdict too (spec §5.4); a hold is the load alert's to say.
    const canDose = (chipState === 'ok' || chipState === 'pick') && !!next && next.safe;
    if (next && next.verdict === 'hold') { /* computeParacetamolLoadAlerts says it */ }
    else if (!isDismissed(key)) {
      alerts.push({
        id: 'fever-dose-available', key,
        severity: 'info', icon: zi('pill'),
        title: canDose ? 'Paracetamol dose available' : 'Paracetamol: check the fever card',
        body: canDose
          ? 'Next dose is safe to give (if needed, as advised by doctor). Last dose was ' + _feverTimeAgo(new Date(doseCD.lastTime).toISOString()) + '.'
          : (chipState === 'confirm'
            ? 'The 4-hour gap has passed. Check the weight on the fever card before giving a dose.'
            : next && next.verdict === 'check'
              ? 'The 4-hour gap has passed. Check the fever card before the next dose.'
              : 'The 4-hour gap has passed. Open the fever card before giving a dose.'),
        tab: 'medical', dismissable: true
      });
    }
  }

  // Escalation
  const escalations = _computeFeverEscalations(ep);
  escalations.forEach((e, i) => {
    const key = 'fever-esc-' + todayStr + '-' + i;
    if (!isDismissed(key)) {
      alerts.push({
        id: 'fever-escalation', key,
        severity: e.severity === 'emergency' ? 'urgent' : 'watch', icon: e.icon,
        title: e.text,
        body: '',
        tab: 'medical', dismissable: true
      });
    }
  });

  // Breaking
  if (ep.readings.length >= 2) {
    const last2 = ep.readings.slice(-2);
    if (last2.every(r => r.temp < FE_FEVER_START_F)) {
      alerts.push({
        id: 'fever-breaking', key: 'fever-breaking-' + todayStr,
        severity: 'positive', icon: zi('check'),
        title: 'Temperature normalizing',
        body: 'Last 2 readings are below 99°F. Continue monitoring — consider resolving if stable for 6 hours.',
        action: { label: 'Review', fn: 'switchTab("track");setTimeout(function(){switchTrackSub("medical");},100);' },
        tab: 'medical', dismissable: true
      });
    }
  }

  return alerts;
}

function renderDietFeverBanner() {
  const el = document.getElementById('dietIntelBanner');
  if (!el) return '';
  const ep = getActiveFeverEpisode();
  if (!ep) return '';

  return '<div class="fe-diet-banner">' +
    '<div class="fe-diet-title">' + zi('flame') + ' Fever Active — Diet Guidance</div>' +
    '<div class="fe-diet-body">' +
    '<strong>Prioritize:</strong> Breast milk (most important), light foods (khichdi, dal water, curd rice, banana, rice porridge), hydrating foods (coconut water, ORS, soups).<br><br>' +
    '<strong>Avoid:</strong> New food introductions, heavy proteins, fried foods. Do not force meals if ' + childNameHtml() + ' refuses.<br><br>' +
    '<em>Appetite loss during fever is normal. Offer small amounts frequently.</em><br><br>' +
    // Refusing food is expected; refusing drink too is a warning sign, with or without paracetamol (Ceres V-C-291-2).
    '<strong>Call your doctor</strong> if ' + childNameHtml() + ' won\'t drink either (breastfeeds or milk included), or seems to feel sick.' +
    '</div></div>';
}

function _illnessFoodIntroduced(f, introducedSet) {
  const intro = [...introducedSet];
  if (intro.some(i => _sameFood(i, f))) return true;
  const parts = _foodIdentityKey(f).split(' ').filter(Boolean);
  return parts.length > 1 && parts.every(p => intro.some(i => _sameFood(i, p)));
}

function getFeverDietFoods() {
  const introducedSet = new Set((foods || []).map(f => f.name.toLowerCase().trim()));
  const feverFoods = ['khichdi', 'curd', 'banana', 'rice', 'rice porridge', 'dal', 'dal water',
    'coconut water', 'buttermilk', 'pomegranate', 'apple', 'mashed potato', 'idli',
    'sabudana', 'oats porridge', 'ragi porridge', 'curd rice'];
  return feverFoods.filter(f => {
    // Only foods she has had: the same food, or a dish whose every part she has had
    // ("curd rice" needs curd AND rice). Never substring -- "pineapple" is not apple (V-K-276-3).
    return _illnessFoodIntroduced(f, introducedSet);
  });
}

function promptFeverTrack(tempGuess) {
  const ep = getActiveFeverEpisode();
  if (ep) {
    showQLToast('Fever episode already active');
    return;
  }
  const tempStr = prompt('Enter current temperature (°F) to start tracking:', tempGuess || '');
  if (tempStr === null) return;
  const tempF = parseFloat(tempStr);
  if (isNaN(tempF) || tempF < 95 || tempF > 108) return;
  startFeverEpisode(tempF, 'symptom-checker');
  showQLToast(zi('flame') + ' Fever episode started — ' + tempF.toFixed(1) + '°F');
  // Navigate to medical tab
  switchTab('track');
  setTimeout(function() { switchTrackSub('medical'); }, 100);
  setTimeout(function() {
    renderFeverEpisodeCard();
    renderHomeFeverBanner();
    renderFeverHistory();
    document.getElementById('feverEpisodeCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
}

function _startFeverCountdown() {
  if (_feverCountdownInterval) return;
  _feverCountdownInterval = setInterval(function() {
    if (!getActiveFeverEpisode()) { _stopFeverCountdown(); return; }
    // Update only the countdown text elements
    const checkEl = document.getElementById('feverCheckCountdown');
    if (checkEl) {
      const cd = getFeverCheckCountdown();
      if (cd) {
        const isOverdue = cd.overdue;
        let text = '';
        if (isOverdue) text = '<span style="color:var(--tc-danger);font-weight:700;">Overdue — ' + Math.abs(cd.remaining) + 'm</span>';
        else {
          const h = Math.floor(cd.remaining / 60);
          const m = cd.remaining % 60;
          text = (h > 0 ? h + 'h ' : '') + m + 'm';
        }
        const textEl = checkEl.querySelector('.fe-countdown-text');
        if (textEl) textEl.innerHTML = 'Next check: ' + text;
        const pct = Math.max(0, Math.min(100, ((cd.total - Math.max(0, cd.remaining)) / cd.total) * 100));
        const fillEl = checkEl.querySelector('.fe-countdown-fill');
        if (fillEl) {
          fillEl.style.width = pct + '%';
          fillEl.classList.toggle('fe-overdue', isOverdue);
        }
      }
    }
    // Update Home banner countdown
    const bannerSub = document.querySelector('.fe-home-banner-sub');
    if (bannerSub) {
      const cd = getFeverCheckCountdown();
      if (cd) {
        if (cd.overdue) bannerSub.textContent = 'Check overdue';
        else {
          const h = Math.floor(cd.remaining / 60);
          const m = cd.remaining % 60;
          bannerSub.textContent = 'Next check: ' + (h > 0 ? h + 'h ' : '') + m + 'm';
        }
      }
    }
  }, 60000);
}

function _stopFeverCountdown() {
  if (_feverCountdownInterval) {
    clearInterval(_feverCountdownInterval);
    _feverCountdownInterval = null;
  }
}

// On load: start countdown if active episode exists
if (getActiveFeverEpisode()) _startFeverCountdown();

// ── DIARRHOEA EPISODE TRACKING (v2.9) ──

let _diarrhoeaEpisodes = [];
try { _diarrhoeaEpisodes = JSON.parse(localStorage.getItem(KEYS.diarrhoeaEpisodes)) || []; } catch { _diarrhoeaEpisodes = []; }
if (!Array.isArray(_diarrhoeaEpisodes)) _diarrhoeaEpisodes = [];
_diarrhoeaEpisodes = _epNormalize('diarrhoea', _diarrhoeaEpisodes);   // ids for legacy entries, in memory only (V-CA-P3-14)

function getActiveDiarrhoeaEpisode() {
  return _diarrhoeaEpisodes.find(e => e.status === 'active') || null;
}

function getDiarrhoeaSeverity(stoolCount24h, hasBlood, hasMucus) {
  if (hasBlood || stoolCount24h >= 8) return { tier: 'severe', label: 'Severe — call doctor', color: 'var(--tc-danger)' };
  if (hasMucus || stoolCount24h >= 5) return { tier: 'moderate', label: 'Moderate', color: 'var(--tc-caution)' };
  return { tier: 'mild', label: 'Mild', color: 'var(--tc-amber)' };
}

function _deStoolsInLast24h(ep) {
  const cutoff = Date.now() - 24 * 3600000;
  return ep.stools.filter(s => new Date(s.time).getTime() > cutoff);
}

function _deHasFlag(ep, flag) {
  return ep.stools.some(s => s[flag]);
}

function pruneDiarrhoeaEpisodes() { _diarrhoeaEpisodes = _epPrune('diarrhoea', _diarrhoeaEpisodes); }

function startDiarrhoeaEpisode(source) {
  if (getActiveDiarrhoeaEpisode()) return getActiveDiarrhoeaEpisode();

  const now = new Date().toISOString();
  const episode = {
    id: 'de-' + Date.now(),
    status: 'active',
    startedAt: now,
    resolvedAt: null,
    stools: [],       // { time, consistency, color, blood, mucus, notes }
    fluids: [],       // { time, type, amount, notes }
    wetDiapers: [],   // { time, notes }
    actions: [],      // { time, action }
    triggerSource: source || 'manual',
    notes: '',
    resolvedNotes: ''
  };
  _diarrhoeaEpisodes.push(episode);
  pruneDiarrhoeaEpisodes();
  _epSave('diarrhoeaEpisodes', _diarrhoeaEpisodes);
  return episode;
}

function logDiarrhoeaStool(consistency, color, blood, mucus, timeStr, notes) {
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep) return;
  ep.stools.push({
    time: timeStr || new Date().toISOString(),
    consistency: consistency || 'watery',
    color: color || '',
    blood: !!blood,
    mucus: !!mucus,
    notes: notes || ''
  });
  _epSave('diarrhoeaEpisodes', _diarrhoeaEpisodes);
  renderDiarrhoeaEpisodeCard();
  renderHomeDiarrhoeaBanner();
}

function logDiarrhoeaFluid(type, amount, timeStr) {
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep) return;
  ep.fluids.push({
    time: timeStr || new Date().toISOString(),
    type: type || 'ORS',
    amount: amount || '',
    notes: ''
  });
  _epSave('diarrhoeaEpisodes', _diarrhoeaEpisodes);
  renderDiarrhoeaEpisodeCard();
}

function logDiarrhoeaWetDiaper(timeStr) {
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep) return;
  ep.wetDiapers.push({ time: timeStr || new Date().toISOString(), notes: '' });
  _epSave('diarrhoeaEpisodes', _diarrhoeaEpisodes);
  renderDiarrhoeaEpisodeCard();
}

function logDiarrhoeaAction(action, timeStr) {
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep) return;
  ep.actions.push({ time: timeStr || new Date().toISOString(), action: action });
  _epSave('diarrhoeaEpisodes', _diarrhoeaEpisodes);
  renderDiarrhoeaEpisodeCard();
}

function resolveDiarrhoeaEpisode(notes) {
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep) return;
  ep.status = 'resolved';
  ep.resolvedAt = new Date().toISOString(); ep.resolvedUpdatedAt = ep.resolvedAt;   // the resolve group's merge stamp (V-CA-P3-3)
  ep.resolvedNotes = notes || '';
  _epSave('diarrhoeaEpisodes', _diarrhoeaEpisodes);
  renderDiarrhoeaEpisodeCard();
  renderDiarrhoeaHistory();
  renderHomeDiarrhoeaBanner();
  renderHome();
}

function _deDurationStr(ep) {
  const start = new Date(ep.startedAt).getTime();
  const end = ep.resolvedAt ? new Date(ep.resolvedAt).getTime() : Date.now();
  const mins = Math.round((end - start) / 60000);
  if (mins < 60) return mins + 'm';
  const h = Math.floor(mins / 60);
  if (h < 24) return h + 'h';
  return Math.floor(h / 24) + 'd ' + (h % 24 > 0 ? (h % 24) + 'h' : '');
}

function _deWetDiapersToday(ep) {
  const todayStr = today();
  // Local day, not the UTC prefix: night diapers (00:00–05:29 IST) were dropped from "today" (V-C-267-1).
  return ep.wetDiapers.filter(w => w.time && _epLocalDateStr(w.time) === todayStr).length;
}

function _computeDiarrhoeaEscalations(ep) {
  const warnings = [];
  const recent24 = _deStoolsInLast24h(ep);

  if (ep.stools.some(s => s.blood)) {
    warnings.push({ severity: 'emergency', icon: zi('siren'), text: 'Blood in stool detected — call doctor immediately' });
  }
  if (ep.stools.some(s => s.mucus) && recent24.length >= 4) {
    warnings.push({ severity: 'warning', icon: zi('warn'), text: 'Mucus with frequent stools — consult paediatrician' });
  }
  const durationH = (Date.now() - new Date(ep.startedAt).getTime()) / 3600000;
  if (durationH > 48) {
    warnings.push({ severity: 'warning', icon: zi('warn'), text: 'Diarrhoea persisting > 48 hours — call your paediatrician' });
  }
  const wetToday = _deWetDiapersToday(ep);
  if (wetToday < 4 && new Date().getHours() >= 14) {
    warnings.push({ severity: 'warning', icon: zi('warn'), text: 'Only ' + wetToday + ' wet diapers today — watch for dehydration' });
  }
  if (recent24.length >= 8) {
    warnings.push({ severity: 'warning', icon: zi('warn'), text: recent24.length + ' stools in 24 hours — risk of dehydration, push fluids' });
  }
  // Improvement: if last 3 stools are soft/normal
  if (ep.stools.length >= 3) {
    const last3 = ep.stools.slice(-3);
    if (last3.every(s => s.consistency === 'soft' || s.consistency === 'normal')) {
      warnings.push({ severity: 'positive', icon: zi('check'), text: 'Last 3 stools are improving — consistency normalizing' });
    }
  }
  return warnings;
}

function renderDiarrhoeaEpisodeCard() {
  const card = document.getElementById('diarrhoeaEpisodeCard');
  if (!card) return;
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep) { card.style.display = 'none'; return; }
  card.style.display = '';

  const recent24 = _deStoolsInLast24h(ep);
  const hasBlood = _deHasFlag(ep, 'blood');
  const hasMucus = _deHasFlag(ep, 'mucus');
  const sev = getDiarrhoeaSeverity(recent24.length, hasBlood, hasMucus);
  const duration = _deDurationStr(ep);
  const wetToday = _deWetDiapersToday(ep);
  const totalFluids = ep.fluids.length;

  card.style.borderLeft = '4px solid ' + sev.color;

  let html = '';

  // Header
  html += '<div class="card-header"><div class="card-title"><div class="icon icon-amber"><svg class="zi"><use href="#zi-diaper"/></svg></div> Active Diarrhoea Episode</div>';
  html += '<span class="t-sm t-light">' + duration + '</span></div>';
  html += _epCameBackHtml(ep);

  // Stool count display
  html += '<div class="de-stool-count" style="color:' + sev.color + ';">' + recent24.length + ' stools <span class="fs-sm-500">in 24h</span></div>';
  html += '<div class="text-center"><span class="de-severity de-severity-' + sev.tier + '">' + sev.label + '</span></div>';
  html += '<div style="font-size:var(--fs-xs);color:var(--light);text-align:center;margin-top:var(--sp-4);">Total: ' + ep.stools.length + ' stools · ' + totalFluids + ' fluid entries</div>';

  // Hydration tracker
  html += '<div class="fe-section-title">' + zi('drop') + ' Hydration</div>';
  const hydraTarget = 6; // min wet diapers per day
  const hydPct = Math.min(100, Math.round((wetToday / hydraTarget) * 100));
  const hydColor = wetToday >= 6 ? 'var(--tc-sage)' : wetToday >= 4 ? 'var(--tc-amber)' : 'var(--tc-danger)';
  html += '<div class="de-hydra-bar">';
  html += '<div class="de-hydra-label">Wet diapers today</div>';
  html += '<div class="de-hydra-track"><div class="de-hydra-fill" style="width:' + hydPct + '%;background:' + hydColor + ';"></div></div>';
  html += '<div class="de-hydra-count" style="color:' + hydColor + ';">' + wetToday + '/' + hydraTarget + '</div>';
  html += '</div>';
  html += _epTimePickerHTML('deHydra');
  html += '<div class="kc-row-flex-wrap">';
  html += '<span class="fe-action-chip" data-action="logDiarrhoeaWetDiaper" data-arg="deHydra">' + zi('diaper') + ' Log wet diaper</span>';
  html += '<span class="fe-action-chip" data-action="deLogFluidPrompt">'+zi('drop')+' Log fluid</span>';
  html += '</div>';
  if (ep.fluids.length > 0) {
    ep.fluids.slice().reverse().slice(0, 3).forEach((f, i) => {
      const origIdx = ep.fluids.length - 1 - i;
      html += '<div class="fe-action-entry ep-entry-tap" data-action="deEditFluid" data-arg="' + _epRowArg(ep.fluids, origIdx) + '">' + _feverTimeShort(f.time) + ' — ' + escHtml(f.type) + (f.amount ? ' (' + escHtml(f.amount) + ')' : '') + '</div>';
    });
  }
  if (ep.wetDiapers.length > 0) {
    ep.wetDiapers.slice().reverse().slice(0, 3).forEach((w, i) => {
      const origIdx = ep.wetDiapers.length - 1 - i;
      html += '<div class="fe-action-entry ep-entry-tap" data-action="deEditWetDiaper" data-arg="' + _epRowArg(ep.wetDiapers, origIdx) + '">' + _feverTimeShort(w.time) + ' — ' + zi('diaper') + ' Wet diaper</div>';
    });
  }

  // Log stool
  html += '<div class="fe-section-title">Stool Log</div>';
  html += _epTimePickerHTML('deStool');
  html += '<div class="kc-row-flex-wrap">';
  html += '<span class="fe-action-chip" data-action="deLogStoolPrompt" data-arg="\'watery\'">'+zi('drop')+' Watery</span>';
  html += '<span class="fe-action-chip" data-action="deLogStoolPrompt" data-arg="\'runny\'">'+zi('warn')+' Runny</span>';
  html += '<span class="fe-action-chip" data-action="deLogStoolPrompt" data-arg="\'soft\'">'+zi('check')+' Soft</span>';
  html += '<span class="fe-action-chip" data-action="deLogStoolPrompt" data-arg="\'normal\'">' + zi('check') + ' Normal</span>';
  html += '</div>';
  html += '<div style="display:flex;gap:var(--sp-8);flex-wrap:wrap;padding:0 0 var(--sp-4);">';
  html += '<label style="font-size:var(--fs-xs);display:flex;align-items:center;gap:4px;"><input type="checkbox" id="deStoolBlood"> ' + zi('drop') + ' Blood</label>';
  html += '<label style="font-size:var(--fs-xs);display:flex;align-items:center;gap:4px;"><input type="checkbox" id="deStoolMucus"> Mucus</label>';
  html += '</div>';

  // Recent stools
  if (ep.stools.length > 0) {
    const conEmoji = { watery: zi('drop'), runny: zi('drop'), soft: zi('diaper'), normal: zi('check'), hard: zi('warn'), loose: zi('drop') };
    const showStools = ep.stools.slice().reverse().slice(0, 6);
    showStools.forEach((s, i) => {
      const origIdx = ep.stools.length - 1 - i;
      const emoji = conEmoji[s.consistency] || zi('diaper');
      let flags = '';
      if (s.blood) flags += ' ' + zi('drop');
      if (s.mucus) flags += ' ' + zi('drop');
      html += '<div class="de-stool-entry ep-entry-tap" data-action="deEditStool" data-arg="' + _epRowArg(ep.stools, origIdx) + '">';
      html += '<span>' + emoji + '</span>';
      html += '<span style="font-size:var(--fs-xs);color:var(--light);min-width:60px;">' + _feverTimeShort(s.time) + '</span>';
      html += '<span class="fs-sm-500">' + (s.consistency || 'loose') + flags + '</span>';
      if (s.notes) html += '<span style="font-size:var(--fs-xs);color:var(--light);margin-left:auto;">' + escHtml(s.notes) + '</span>';
      html += '</div>';
    });
    if (ep.stools.length > 6) {
      html += '<div class="fe-more-toggle">' + (ep.stools.length - 6) + ' earlier entries</div>';
    }
  }

  // Actions
  html += '<div class="fe-section-title">Actions</div>';
  html += _epTimePickerHTML('deAction');
  const DE_ACTIONS = ['Breastfed', 'ORS given', 'Applied diaper cream', 'Changed diaper', 'Doctor called', 'Washed hands'];
  html += '<div class="fe-action-chips">';
  DE_ACTIONS.forEach(a => {
    html += '<span class="fe-action-chip" data-action="logDiarrhoeaAction" data-arg="deAction" data-arg2="' + escAttr(a) + '">' + escHtml(a) + '</span>';
  });
  html += '</div>';
  if (ep.actions.length > 0) {
    ep.actions.slice().reverse().slice(0, 5).forEach((a, i) => {
      const origIdx = ep.actions.length - 1 - i;
      html += '<div class="fe-action-entry ep-entry-tap" data-action="deEditAction" data-arg="' + _epRowArg(ep.actions, origIdx) + '">' + _feverTimeShort(a.time) + ' — ' + escHtml(a.action) + '</div>';
    });
  }

  // Guidance
  try { html += _paraLoadHtml(getParacetamolLoad(), 'gi', 'diarrhoea'); } catch (e) {}   // R2 renders here too, above the guidance and the closing controls (#161 §5.4, Vela V-V-291-5)
  html += '<div class="fe-section-title">Guidance</div>';
  html += '<div class="fe-guidance"><ul class="ep-list">';
  html += '<li>Continue breastfeeding — most important</li>';
  html += '<li>Offer ORS in small, frequent sips</li>';
  html += '<li>Avoid fruit juices and sugary drinks</li>';
  html += '<li>Keep diaper area clean and dry — use barrier cream</li>';
  html += '<li>Count wet diapers — minimum 6/day indicates adequate hydration</li>';
  if (sev.tier === 'severe') {
    html += '<li class="status-action">'+zi('siren')+' Seek medical attention — blood/mucus or severe frequency</li>';
  } else {
    html += '<li>Call doctor if: blood/mucus in stool, <4 wet diapers/day, sunken fontanelle, or persists >48 hours</li>';
  }
  html += '</ul></div>';

  // Escalation warnings
  const escalations = _computeDiarrhoeaEscalations(ep);
  escalations.forEach(e => {
    const bgColor = e.severity === 'emergency' ? 'var(--surface-rose)' : e.severity === 'positive' ? 'var(--surface-sage)' : 'var(--surface-caution)';
    const textColor = e.severity === 'emergency' ? 'var(--tc-danger)' : e.severity === 'positive' ? 'var(--tc-sage)' : 'var(--tc-caution)';
    html += '<div style="padding:8px 12px;border-radius:var(--r-md);margin:var(--sp-4) 0;background:' + bgColor + ';font-size:var(--fs-sm);font-weight:600;color:' + textColor + ';">' + e.icon + ' ' + escHtml(e.text) + '</div>';
  });

  // Resolve
  html += '<div class="fe-resolve"><button class="btn btn-ghost w-full" data-action="deResolvePrompt" data-arg="" >' + zi('check') + ' Mark Resolved</button></div>';
  html += '<div class="source-attribution">Guidance only — not medical advice. Trust your instincts and call your paediatrician when in doubt.</div>';

  card.innerHTML = html;
}

function deLogStoolPrompt(consistency) {
  const bloodEl = document.getElementById('deStoolBlood');
  const mucusEl = document.getElementById('deStoolMucus');
  const blood = bloodEl ? bloodEl.checked : false;
  const mucus = mucusEl ? mucusEl.checked : false;

  if (!getActiveDiarrhoeaEpisode()) {
    startDiarrhoeaEpisode('manual');
  }
  const timeStr = _epGetSelectedTime('deStool');
  logDiarrhoeaStool(consistency, '', blood, mucus, timeStr, '');
  // Reset checkboxes
  if (bloodEl) bloodEl.checked = false;
  if (mucusEl) mucusEl.checked = false;
  showQLToast(zi('diaper') + ' Stool logged — ' + consistency);
}

function deLogFluidPrompt() {
  const FLUID_TYPES = ['ORS', 'Breast milk', 'Coconut water', 'Dal water', 'Water', 'Buttermilk'];
  const type = prompt('Fluid type:\n' + FLUID_TYPES.map((f, i) => (i + 1) + '. ' + f).join('\n') + '\n\nEnter name or number:', 'ORS');
  if (type === null) return;
  const resolved = FLUID_TYPES[parseInt(type) - 1] || type;
  const timeStr = _epGetSelectedTime('deHydra');
  logDiarrhoeaFluid(resolved, '', timeStr);
  showQLToast(zi('drop') + ' ' + resolved + ' logged');
}

// ── Diarrhoea Edit/Delete ──

function deEditStool(arg) {
  const ep = getActiveDiarrhoeaEpisode();
  const idx = _epIdxOf(ep, 'stools', arg);   // the row carries the entry id (V-CA-P3-2, V-K-P3-5)
  if (idx < 0) return;
  const epId = ep.id, eid = ep.stools[idx].id;
  const s = ep.stools[idx];
  _epEditEntry({
    title: 'Edit Stool Entry',
    fields: [
      { label: 'Consistency', id: 'consistency', type: 'select', value: s.consistency,
        // <option> elements render text-only — zi() SVG was leaking as literal
        // text via escHtml at intelligence.js:6831. Plain labels.
        options: [{value:'watery',label:'Watery'},{value:'runny',label:'Runny'},{value:'soft',label:'Soft'},{value:'normal',label:'Normal'},{value:'hard',label:'Hard'}] },
      { label: 'Time', id: 'time', type: 'time', value: s.time },
      { label: 'Notes', id: 'notes', type: 'text', value: s.notes || '' }
    ],
    onSave: function(v) {
      const L = _epLive('diarrhoea', epId, 'stools', eid); if (!L) return _EP_GONE;
      const ep = L.ep, idx = L.i;   // the live entry at commit, never the one captured at open
      ep.stools[idx].consistency = v.consistency || s.consistency;
      ep.stools[idx].time = _epTimeToISO(v.time, ep.stools[idx].time);
      ep.stools[idx].notes = v.notes || '';
      ep.stools[idx].editedAt = new Date().toISOString();   // an edited entry wins whole on merge (V-K-P3-9)
      _epSave('diarrhoeaEpisodes', _diarrhoeaEpisodes);
      renderDiarrhoeaEpisodeCard(); renderHomeDiarrhoeaBanner();
      showQLToast(zi('diaper') + ' Stool entry updated');
    },
    onDelete: function() {
      const L = _epLive('diarrhoea', epId, 'stools', eid); if (!L) { showQLToast(_EP_GONE_DEL); return; }
      const ep = L.ep, idx = L.i;
      _epTombstone(ep, 'stools', idx);
      ep.stools.splice(idx, 1);
      _epSave('diarrhoeaEpisodes', _diarrhoeaEpisodes);
      renderDiarrhoeaEpisodeCard(); renderHomeDiarrhoeaBanner();
      showQLToast('Stool entry deleted');
    }
  });
}

function deEditFluid(arg) {
  const ep = getActiveDiarrhoeaEpisode();
  const idx = _epIdxOf(ep, 'fluids', arg);   // the row carries the entry id (V-CA-P3-2, V-K-P3-5)
  if (idx < 0) return;
  const epId = ep.id, eid = ep.fluids[idx].id;
  const f = ep.fluids[idx];
  _epEditEntry({
    title: 'Edit Fluid Entry',
    fields: [
      { label: 'Type', id: 'type', type: 'text', value: f.type },
      { label: 'Amount', id: 'amount', type: 'text', value: f.amount || '' },
      { label: 'Time', id: 'time', type: 'time', value: f.time }
    ],
    onSave: function(v) {
      const L = _epLive('diarrhoea', epId, 'fluids', eid); if (!L) return _EP_GONE;
      const ep = L.ep, idx = L.i;   // the live entry at commit, never the one captured at open
      ep.fluids[idx].type = v.type || f.type;
      ep.fluids[idx].amount = v.amount || '';
      ep.fluids[idx].time = _epTimeToISO(v.time, ep.fluids[idx].time);
      ep.fluids[idx].editedAt = new Date().toISOString();   // an edited entry wins whole on merge (V-K-P3-9)
      _epSave('diarrhoeaEpisodes', _diarrhoeaEpisodes);
      renderDiarrhoeaEpisodeCard();
      showQLToast(zi('drop') + ' Fluid entry updated');
    },
    onDelete: function() {
      const L = _epLive('diarrhoea', epId, 'fluids', eid); if (!L) { showQLToast(_EP_GONE_DEL); return; }
      const ep = L.ep, idx = L.i;
      _epTombstone(ep, 'fluids', idx);
      ep.fluids.splice(idx, 1);
      _epSave('diarrhoeaEpisodes', _diarrhoeaEpisodes);
      renderDiarrhoeaEpisodeCard();
      showQLToast('Fluid entry deleted');
    }
  });
}

function deEditWetDiaper(arg) {
  const ep = getActiveDiarrhoeaEpisode();
  const idx = _epIdxOf(ep, 'wetDiapers', arg);   // the row carries the entry id (V-CA-P3-2, V-K-P3-5)
  if (idx < 0) return;
  const epId = ep.id, eid = ep.wetDiapers[idx].id;
  const w = ep.wetDiapers[idx];
  _epEditEntry({
    title: 'Edit Wet Diaper Entry',
    fields: [
      { label: 'Time', id: 'time', type: 'time', value: w.time }
    ],
    onSave: function(v) {
      const L = _epLive('diarrhoea', epId, 'wetDiapers', eid); if (!L) return _EP_GONE;
      const ep = L.ep, idx = L.i;   // the live entry at commit, never the one captured at open
      ep.wetDiapers[idx].time = _epTimeToISO(v.time, ep.wetDiapers[idx].time);
      ep.wetDiapers[idx].editedAt = new Date().toISOString();   // an edited entry wins whole on merge (V-K-P3-9)
      _epSave('diarrhoeaEpisodes', _diarrhoeaEpisodes);
      renderDiarrhoeaEpisodeCard();
      showQLToast(zi('diaper') + ' Wet diaper updated');
    },
    onDelete: function() {
      const L = _epLive('diarrhoea', epId, 'wetDiapers', eid); if (!L) { showQLToast(_EP_GONE_DEL); return; }
      const ep = L.ep, idx = L.i;
      _epTombstone(ep, 'wetDiapers', idx);
      ep.wetDiapers.splice(idx, 1);
      _epSave('diarrhoeaEpisodes', _diarrhoeaEpisodes);
      renderDiarrhoeaEpisodeCard();
      showQLToast('Wet diaper deleted');
    }
  });
}

function deEditAction(arg) {
  const ep = getActiveDiarrhoeaEpisode();
  const idx = _epIdxOf(ep, 'actions', arg);   // the row carries the entry id (V-CA-P3-2, V-K-P3-5)
  if (idx < 0) return;
  const epId = ep.id, eid = ep.actions[idx].id;
  const a = ep.actions[idx];
  _epEditEntry({
    title: 'Edit Action',
    fields: [
      { label: 'Action', id: 'action', type: 'text', value: a.action },
      { label: 'Time', id: 'time', type: 'time', value: a.time }
    ],
    onSave: function(v) {
      const L = _epLive('diarrhoea', epId, 'actions', eid); if (!L) return _EP_GONE;
      const ep = L.ep, idx = L.i;   // the live entry at commit, never the one captured at open
      ep.actions[idx].action = v.action || a.action;
      ep.actions[idx].time = _epTimeToISO(v.time, ep.actions[idx].time);
      ep.actions[idx].editedAt = new Date().toISOString();   // an edited entry wins whole on merge (V-K-P3-9)
      _epSave('diarrhoeaEpisodes', _diarrhoeaEpisodes);
      renderDiarrhoeaEpisodeCard();
      showQLToast('Action updated');
    },
    onDelete: function() {
      const L = _epLive('diarrhoea', epId, 'actions', eid); if (!L) { showQLToast(_EP_GONE_DEL); return; }
      const ep = L.ep, idx = L.i;
      _epTombstone(ep, 'actions', idx);
      ep.actions.splice(idx, 1);
      _epSave('diarrhoeaEpisodes', _diarrhoeaEpisodes);
      renderDiarrhoeaEpisodeCard();
      showQLToast('Action deleted');
    }
  });
}

function deResolvePrompt() {
  // V-M-41 shield (PR-D) — `'Resolve'` btnText prevents 'Confirm' fallback;
  // split/audit-resolve-shield.sh fails the build if dropped. Parent reads
  // this at midnight post-episode — 'Resolve' names the action verb
  // explicitly; 'Confirm' is action-ambiguous on a "Has X resolved?" prompt.
  confirmAction('Has ' + childNameHtml() + '\'s stool consistency returned to normal? (No loose/watery stools for at least 12 hours)', function() {
    resolveDiarrhoeaEpisode('');
    showQLToast('' + zi('check') + ' Diarrhoea episode resolved');
  }, 'Resolve');
}

function renderHomeDiarrhoeaBanner() {
  const banner = document.getElementById('homeDiarrhoeaBanner');
  if (!banner) return;
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep) { banner.style.display = 'none'; return; }
  banner.style.display = '';

  const recent24 = _deStoolsInLast24h(ep);
  const sev = getDiarrhoeaSeverity(recent24.length, _deHasFlag(ep, 'blood'), _deHasFlag(ep, 'mucus'));
  const wetToday = _deWetDiapersToday(ep);
  const duration = _deDurationStr(ep);

  const bannerCls = sev.tier === 'severe' ? 'de-home-banner de-home-banner-severe' : 'de-home-banner';
  banner.innerHTML = '<div class="' + bannerCls + '" data-nav-track-medical="diarrhoeaEpisodeCard">' +
    '<div class="fe-home-banner-info">' +
    '<div class="fe-home-banner-temp" style="color:' + sev.color + ';">' + zi('diaper') + ' ' + recent24.length + ' stools/24h · ' + sev.label + ' · ' + duration + '</div>' +
    '<div class="fe-home-banner-sub">Wet diapers today: ' + wetToday + '/6' + (wetToday < 4 ? ' ' + zi('warn') : '') + '</div>' +
    '</div>' +
    '<button class="btn btn-sage btn-sm-inline" data-action="deLogStoolQuick" data-stop="1" >' + zi('note') + ' Log</button>' +
    '</div>';
}

function deLogStoolQuick() {
  if (!getActiveDiarrhoeaEpisode()) return;
  deLogStoolPrompt('watery');
}

function renderDiarrhoeaHistory() {
  const card = document.getElementById('diarrhoeaHistoryCard');
  const summary = document.getElementById('diarrhoeaHistorySummary');
  const body = document.getElementById('diarrhoeaHistoryBody');
  if (!card || !summary || !body) return;

  const resolved = _diarrhoeaEpisodes.filter(e => e.status === 'resolved');
  if (resolved.length === 0) { card.style.display = 'none'; return; }
  card.style.display = '';

  const last = resolved[resolved.length - 1];
  const lastDate = last.resolvedAt ? formatDate(_epLocalDateStr(last.resolvedAt)) : '';
  summary.innerHTML = '<div class="t-sm t-light">' + resolved.length + ' episode' + (resolved.length !== 1 ? 's' : '') + (lastDate ? ' · last: ' + lastDate : '') + '</div>';

  let html = '';
  resolved.slice().reverse().forEach(ep => {
    const startD = formatDate(_epLocalDateStr(ep.startedAt));
    const endD = ep.resolvedAt ? formatDate(_epLocalDateStr(ep.resolvedAt)) : '';
    const dur = _deDurationStr(ep);
    html += _epHistoryRowOpen('diarrhoea', ep);
    html += '<div class="fe-history-date"><span>' + startD + (endD && endD !== startD ? ' — ' + endD : '') + '</span>' + _epHistoryEditLabel(ep) + '</div>';
    html += '<div class="fe-history-detail">Duration: ' + dur + ' · ' + ep.stools.length + ' stools · ' + ep.fluids.length + ' fluid entries · ' + ep.wetDiapers.length + ' wet diapers logged</div>';
    if (ep.resolvedNotes) html += '<div class="fe-history-detail">' + escHtml(ep.resolvedNotes) + '</div>';
    html += _epHistoryEditedLine(ep);
    html += _renderAttribution(ep);
    html += '</div>';
  });
  body.innerHTML = html;
}

function computeDiarrhoeaAlerts() {
  const alerts = [];
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep) return alerts;

  const state = loadAlertState();
  function isDismissed(key) { return !!state.dismissed[key]; }
  const todayStr = today();
  const recent24 = _deStoolsInLast24h(ep);

  // Wet diaper warning
  const wetToday = _deWetDiapersToday(ep);
  if (wetToday < 4 && new Date().getHours() >= 14) {
    const key = 'de-wet-low-' + todayStr;
    if (!isDismissed(key)) {
      alerts.push({
        id: 'de-wet-low', key,
        severity: 'watch', icon: zi('diaper'),
        title: 'Only ' + wetToday + ' wet diapers today',
        body: 'During diarrhoea, minimum 6 wet diapers/day indicates adequate hydration. Push fluids — ORS, breast milk, coconut water.',
        tab: 'medical', dismissable: true
      });
    }
  }

  // Blood/mucus alert
  if (_deHasFlag(ep, 'blood')) {
    const key = 'de-blood-' + ep.id;
    if (!isDismissed(key)) {
      alerts.push({
        id: 'de-blood', key,
        severity: 'urgent', icon: zi('siren'),
        title: 'Blood detected in stool',
        body: 'Blood in stool during diarrhoea needs immediate medical attention. Call your paediatrician.',
        tab: 'medical', dismissable: true
      });
    }
  }

  // Duration > 48h
  const durationH = (Date.now() - new Date(ep.startedAt).getTime()) / 3600000;
  if (durationH > 48) {
    const key = 'de-persist-' + ep.id;
    if (!isDismissed(key)) {
      alerts.push({
        id: 'de-persist', key,
        severity: 'watch', icon: zi('warn'),
        title: 'Diarrhoea persisting > 48 hours',
        body: 'Consult your paediatrician if loose stools continue beyond 48 hours.',
        tab: 'medical', dismissable: true
      });
    }
  }

  // Improving
  if (ep.stools.length >= 3) {
    const last3 = ep.stools.slice(-3);
    if (last3.every(s => s.consistency === 'soft' || s.consistency === 'normal')) {
      alerts.push({
        id: 'de-improving', key: 'de-improving-' + todayStr,
        severity: 'positive', icon: zi('check'),
        title: 'Stool consistency improving',
        body: 'Last 3 stools are soft/normal. Continue monitoring — consider resolving if stable for 12 hours.',
        tab: 'medical', dismissable: true
      });
    }
  }

  return alerts;
}

function getDiarrhoeaDietFoods() {
  const introducedSet = new Set((foods || []).map(f => f.name.toLowerCase().trim()));
  const deFoods = ['khichdi', 'curd', 'banana', 'rice', 'rice porridge', 'dal', 'dal water',
    'coconut water', 'pomegranate', 'apple', 'mashed potato', 'idli', 'curd rice',
    'sabudana', 'oats porridge', 'ragi porridge', 'buttermilk'];
  return deFoods.filter(f => {
    // Only foods she has had: the same food, or a dish whose every part she has had
    // ("curd rice" needs curd AND rice). Never substring -- "pineapple" is not apple (V-K-276-3).
    return _illnessFoodIntroduced(f, introducedSet);
  });
}

function renderDietDiarrhoeaBanner() {
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep) return '';
  return '<div class="fe-diet-banner">' +
    '<div class="fe-diet-title">' + zi('diaper') + ' Diarrhoea Active — Diet Guidance</div>' +
    '<div class="fe-diet-body">' +
    '<strong>Prioritize:</strong> Breast milk (most important), ORS in small sips, BRAT foods (banana, rice, apple, toast/idli), curd for probiotics, khichdi, dal water.<br><br>' +
    '<strong>Avoid:</strong> Fruit juices, sugary drinks, high-fibre foods, new food introductions, dairy (except curd/buttermilk). Do not force meals.<br><br>' +
    '<em>Small, frequent feeds are better than large meals. Continue breastfeeding throughout.</em>' +
    '</div></div>';
}

function promptDiarrhoeaTrack() {
  const ep = getActiveDiarrhoeaEpisode();
  if (ep) { showQLToast('Diarrhoea episode already active'); return; }
  startDiarrhoeaEpisode('symptom-checker');
  showQLToast(zi('diaper') + ' Diarrhoea episode started');
  switchTab('track');
  setTimeout(function() { switchTrackSub('medical'); }, 100);
  setTimeout(function() {
    renderDiarrhoeaEpisodeCard();
    renderHomeDiarrhoeaBanner();
    renderDiarrhoeaHistory();
    document.getElementById('diarrhoeaEpisodeCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
}

// ── VOMITING EPISODE TRACKING (v2.9) ──

let _vomitingEpisodes = [];
try { _vomitingEpisodes = JSON.parse(localStorage.getItem(KEYS.vomitingEpisodes)) || []; } catch { _vomitingEpisodes = []; }
if (!Array.isArray(_vomitingEpisodes)) _vomitingEpisodes = [];
_vomitingEpisodes = _epNormalize('vomiting', _vomitingEpisodes);   // ids for legacy entries, in memory only (V-CA-P3-14)

function getActiveVomitingEpisode() { return _vomitingEpisodes.find(e => e.status === 'active') || null; }

function startVomitingEpisode(source) {
  if (getActiveVomitingEpisode()) return getActiveVomitingEpisode();
  const now = new Date().toISOString();
  const ep = { id: 'vo-' + Date.now(), status: 'active', startedAt: now, resolvedAt: null,
    episodes: [], fluids: [], wetDiapers: [], actions: [], triggerSource: source || 'manual', notes: '', resolvedNotes: '' };
  _vomitingEpisodes.push(ep);
  _vomitingEpisodes = _epPrune('vomiting', _vomitingEpisodes);
  _epSave('vomitingEpisodes', _vomitingEpisodes);
  return ep;
}

function logVomitingEpisodeEntry(type, timeStr, notes) {
  const ep = getActiveVomitingEpisode();
  if (!ep) return;
  ep.episodes.push({ time: timeStr || new Date().toISOString(), type: type || 'vomit', notes: notes || '' });
  _epSave('vomitingEpisodes', _vomitingEpisodes);
  renderVomitingEpisodeCard(); renderHomeVomitingBanner();
}

function logVomitingFluid(type, timeStr) {
  const ep = getActiveVomitingEpisode();
  if (!ep) return;
  ep.fluids.push({ time: timeStr || new Date().toISOString(), type: type || 'Breast milk' });
  _epSave('vomitingEpisodes', _vomitingEpisodes);
  renderVomitingEpisodeCard();
}

function logVomitingWetDiaper(timeStr) {
  const ep = getActiveVomitingEpisode();
  if (!ep) return;
  ep.wetDiapers.push({ time: timeStr || new Date().toISOString() });
  _epSave('vomitingEpisodes', _vomitingEpisodes);
  renderVomitingEpisodeCard();
}

function logVomitingAction(action, timeStr) {
  const ep = getActiveVomitingEpisode();
  if (!ep) return;
  ep.actions.push({ time: timeStr || new Date().toISOString(), action: action });
  _epSave('vomitingEpisodes', _vomitingEpisodes);
  renderVomitingEpisodeCard();
}

function resolveVomitingEpisode() {
  const ep = getActiveVomitingEpisode();
  if (!ep) return;
  ep.status = 'resolved'; ep.resolvedAt = new Date().toISOString(); ep.resolvedUpdatedAt = ep.resolvedAt;   // the resolve group's merge stamp (V-CA-P3-3)
  _epSave('vomitingEpisodes', _vomitingEpisodes);
  renderVomitingEpisodeCard(); renderVomitingHistory(); renderHomeVomitingBanner(); renderHome();
}

function _voEpisodesIn12h(ep) {
  const cutoff = Date.now() - 12 * 3600000;
  return ep.episodes.filter(e => new Date(e.time).getTime() > cutoff);
}

function _voWetToday(ep) {
  const t = today();
  return ep.wetDiapers.filter(w => w.time && _epLocalDateStr(w.time) === t).length; // local day (V-K-267-9)
}

function renderVomitingEpisodeCard() {
  const card = document.getElementById('vomitingEpisodeCard');
  if (!card) return;
  const ep = getActiveVomitingEpisode();
  if (!ep) { card.style.display = 'none'; return; }
  card.style.display = '';

  const recent12 = _voEpisodesIn12h(ep);
  const dur = _feverDurationStr(ep);
  const wetToday = _voWetToday(ep);
  const isProjectile = ep.episodes.some(e => e.type === 'projectile');
  const hasBile = ep.episodes.some(e => e.type === 'bile');
  const sevColor = (isProjectile || hasBile || recent12.length >= 4) ? 'var(--tc-danger)' : recent12.length >= 2 ? 'var(--tc-caution)' : 'var(--tc-amber)';
  const sevLabel = (isProjectile || hasBile) ? 'Seek care' : recent12.length >= 4 ? 'Frequent' : recent12.length >= 2 ? 'Monitor' : 'Mild';

  card.style.borderLeft = '4px solid ' + sevColor;
  let html = '<div class="card-header"><div class="card-title"><div class="icon icon-rose"><svg class="zi"><use href="#zi-medical"/></svg></div> Active Vomiting Episode</div><span class="t-sm t-light">' + dur + '</span></div>' + _epCameBackHtml(ep);
  html += '<div class="ve-count-display" style="color:' + sevColor + ';">' + recent12.length + ' episode' + (recent12.length !== 1 ? 's' : '') + ' <span class="fs-sm-500">in 12h</span></div>';
  html += '<div class="text-center"><span class="fe-severity" style="background:rgba(220,120,80,0.12);color:' + sevColor + ';">' + sevLabel + '</span></div>';

  // Hydration
  html += '<div class="fe-section-title">' + zi('drop') + ' Hydration</div>';
  const hydPct = Math.min(100, Math.round((wetToday / 6) * 100));
  const hydColor = wetToday >= 6 ? 'var(--tc-sage)' : wetToday >= 4 ? 'var(--tc-amber)' : 'var(--tc-danger)';
  html += '<div class="de-hydra-bar"><div class="de-hydra-label">Wet diapers today</div><div class="de-hydra-track"><div class="de-hydra-fill" style="width:' + hydPct + '%;background:' + hydColor + ';"></div></div><div class="de-hydra-count" style="color:' + hydColor + ';">' + wetToday + '/6</div></div>';
  html += _epTimePickerHTML('voHydra');
  html += '<div class="fe-action-chips"><span class="fe-action-chip" data-action="logVomitingWetDiaper" data-arg="voHydra">'+zi('drop')+' Wet diaper</span><span class="fe-action-chip" data-action="voLogFluidPrompt">'+zi('drop')+' Log fluid</span></div>';

  // Log vomiting
  html += '<div class="fe-section-title">Vomiting Log</div>';
  html += _epTimePickerHTML('voLog');
  html += '<div class="fe-action-chips">';
  html += '<span class="fe-action-chip" data-action="logVomitingEpisodeEntry" data-arg="voLog" data-arg2="spit-up">'+zi('warn')+' Spit-up</span>';
  html += '<span class="fe-action-chip" data-action="logVomitingEpisodeEntry" data-arg="voLog" data-arg2="vomit">'+zi('siren')+' Vomit</span>';
  html += '<span class="fe-action-chip" data-action="logVomitingEpisodeEntry" data-arg="voLog" data-arg2="projectile">'+zi('siren')+' Projectile</span>';
  html += '<span class="fe-action-chip" data-action="logVomitingEpisodeEntry" data-arg="voLog" data-arg2="bile">'+zi('warn')+' Bile/green</span>';
  html += '</div>';

  if (ep.episodes.length > 0) {
    ep.episodes.slice().reverse().slice(0, 6).forEach((e, i) => {
      const origIdx = ep.episodes.length - 1 - i;
      const icon = e.type === 'projectile' ? zi('siren') : e.type === 'bile' ? zi('dot-red') : e.type === 'spit-up' ? zi('warn') : zi('siren');
      html += '<div class="de-stool-entry ep-entry-tap" data-action="voEditEntry" data-arg="' + _epRowArg(ep.episodes, origIdx) + '"><span>' + icon + '</span><span style="font-size:var(--fs-xs);color:var(--light);min-width:60px;">' + _feverTimeShort(e.time) + '</span><span class="fs-sm-500">' + escHtml(e.type || 'vomit') + '</span></div>';   // arrives via the merge from the other phone (HR-4, Cipher A2)
    });
  }

  // Actions
  html += '<div class="fe-section-title">Actions</div>';
  html += _epTimePickerHTML('voAction');
  html += '<div class="fe-action-chips">';
  ['Kept upright 30min', 'Small feed given', 'Breastfed', 'Doctor called'].forEach(a => {
    html += '<span class="fe-action-chip" data-action="logVomitingAction" data-arg="voAction" data-arg2="' + escAttr(a) + '">' + escHtml(a) + '</span>';
  });
  html += '</div>';
  if (ep.actions.length > 0) {
    ep.actions.slice().reverse().slice(0, 4).forEach((a, i) => {
      const origIdx = ep.actions.length - 1 - i;
      html += '<div class="fe-action-entry ep-entry-tap" data-action="voEditAction" data-arg="' + _epRowArg(ep.actions, origIdx) + '">' + _feverTimeShort(a.time) + ' — ' + escHtml(a.action) + '</div>';
    });
  }

  // Guidance
  try { html += _paraLoadHtml(getParacetamolLoad(), 'gi', 'vomiting'); } catch (e) {}   // R2 renders here too, above the guidance and the closing controls (#161 §5.4, Vela V-V-291-5)
  html += '<div class="fe-section-title">Guidance</div><div class="fe-guidance"><ul class="ep-list">';
  html += '<li>Keep ' + childNameHtml() + ' upright for 20–30 minutes after feeds</li>';
  html += '<li>Offer small, frequent feeds — not large volumes</li>';
  html += '<li>Continue breastfeeding normally</li>';
  html += '<li>Avoid new foods until vomiting stops</li>';
  if (isProjectile || hasBile) html += '<li class="status-action">'+zi('siren')+' Projectile/bile vomiting — seek immediate medical attention</li>';
  else html += '<li>Call doctor if vomiting persists >12 hours or contains blood/bile</li>';
  html += '</ul></div>';

  // Escalations
  if (isProjectile) html += '<div class="alert-block-danger">' + zi('siren') + ' Projectile vomiting detected — seek medical attention</div>';
  if (hasBile) html += '<div class="alert-block-danger">' + zi('siren') + ' Green/bile vomiting — seek immediate care</div>';
  const durationH = (Date.now() - new Date(ep.startedAt).getTime()) / 3600000;
  if (durationH > 12 && !isProjectile && !hasBile) html += '<div style="padding:8px 12px;border-radius:var(--r-md);margin:var(--sp-4) 0;background:var(--surface-caution);font-size:var(--fs-sm);font-weight:600;color:var(--tc-caution);">' + zi('warn') + ' Vomiting persisting >12 hours — call your paediatrician</div>';

  // Recovery check
  if (ep.episodes.length >= 2) {
    const lastEpTime = new Date(ep.episodes[ep.episodes.length - 1].time).getTime();
    const hoursSinceLast = (Date.now() - lastEpTime) / 3600000;
    if (hoursSinceLast >= 6) {
      html += '<div style="padding:10px 12px;border-radius:var(--r-md);margin:var(--sp-8) 0;background:rgba(58,112,96,0.08);font-size:var(--fs-sm);color:var(--tc-sage);font-weight:600;">' + zi('check') + ' No vomiting for ' + Math.round(hoursSinceLast) + ' hours — may be resolving</div>';
    }
  }

  html += '<div class="fe-resolve"><button class="btn btn-ghost w-full" data-action="voResolvePrompt" data-arg="" >' + zi('check') + ' Mark Resolved</button></div>';
  html += '<div class="source-attribution">Guidance only — not medical advice.</div>';
  card.innerHTML = html;
}

function voLogFluidPrompt() {
  const type = prompt('Fluid given:', 'Breast milk');
  if (type === null) return;
  const timeStr = _epGetSelectedTime('voHydra');
  logVomitingFluid(type, timeStr);
  showQLToast(zi('drop') + ' ' + type + ' logged');
}

// ── Vomiting Edit/Delete ──

function voEditEntry(arg) {
  const ep = getActiveVomitingEpisode();
  const idx = _epIdxOf(ep, 'episodes', arg);   // the row carries the entry id (V-CA-P3-2, V-K-P3-5)
  if (idx < 0) return;
  const epId = ep.id, eid = ep.episodes[idx].id;
  const e = ep.episodes[idx];
  _epEditEntry({
    title: 'Edit Vomiting Entry',
    fields: [
      { label: 'Type', id: 'type', type: 'select', value: e.type,
        // <option> renders text-only; zi() decoration was leaking as literal text.
        options: [{value:'spit-up',label:'Spit-up'},{value:'vomit',label:'Vomit'},{value:'projectile',label:'Projectile'},{value:'bile',label:'Bile/green'}] },
      { label: 'Time', id: 'time', type: 'time', value: e.time },
      { label: 'Notes', id: 'notes', type: 'text', value: e.notes || '' }
    ],
    onSave: function(v) {
      const L = _epLive('vomiting', epId, 'episodes', eid); if (!L) return _EP_GONE;
      const ep = L.ep, idx = L.i;   // the live entry at commit, never the one captured at open
      ep.episodes[idx].type = v.type || e.type;
      ep.episodes[idx].time = _epTimeToISO(v.time, ep.episodes[idx].time);
      ep.episodes[idx].notes = v.notes || '';
      ep.episodes[idx].editedAt = new Date().toISOString();   // an edited entry wins whole on merge (V-K-P3-9)
      _epSave('vomitingEpisodes', _vomitingEpisodes);
      renderVomitingEpisodeCard(); renderHomeVomitingBanner();
      showQLToast(zi('siren') + ' Entry updated');
    },
    onDelete: function() {
      const L = _epLive('vomiting', epId, 'episodes', eid); if (!L) { showQLToast(_EP_GONE_DEL); return; }
      const ep = L.ep, idx = L.i;
      _epTombstone(ep, 'episodes', idx);
      ep.episodes.splice(idx, 1);
      _epSave('vomitingEpisodes', _vomitingEpisodes);
      renderVomitingEpisodeCard(); renderHomeVomitingBanner();
      showQLToast('Entry deleted');
    }
  });
}

function voEditAction(arg) {
  const ep = getActiveVomitingEpisode();
  const idx = _epIdxOf(ep, 'actions', arg);   // the row carries the entry id (V-CA-P3-2, V-K-P3-5)
  if (idx < 0) return;
  const epId = ep.id, eid = ep.actions[idx].id;
  const a = ep.actions[idx];
  _epEditEntry({
    title: 'Edit Action',
    fields: [
      { label: 'Action', id: 'action', type: 'text', value: a.action },
      { label: 'Time', id: 'time', type: 'time', value: a.time }
    ],
    onSave: function(v) {
      const L = _epLive('vomiting', epId, 'actions', eid); if (!L) return _EP_GONE;
      const ep = L.ep, idx = L.i;   // the live entry at commit, never the one captured at open
      ep.actions[idx].action = v.action || a.action;
      ep.actions[idx].time = _epTimeToISO(v.time, ep.actions[idx].time);
      ep.actions[idx].editedAt = new Date().toISOString();   // an edited entry wins whole on merge (V-K-P3-9)
      _epSave('vomitingEpisodes', _vomitingEpisodes);
      renderVomitingEpisodeCard();
      showQLToast('Action updated');
    },
    onDelete: function() {
      const L = _epLive('vomiting', epId, 'actions', eid); if (!L) { showQLToast(_EP_GONE_DEL); return; }
      const ep = L.ep, idx = L.i;
      _epTombstone(ep, 'actions', idx);
      ep.actions.splice(idx, 1);
      _epSave('vomitingEpisodes', _vomitingEpisodes);
      renderVomitingEpisodeCard();
      showQLToast('Action deleted');
    }
  });
}

function voResolvePrompt() {
  // V-M-41 shield (PR-D) — `'Resolve'` btnText prevents 'Confirm' fallback;
  // split/audit-resolve-shield.sh fails the build if dropped. Parent reads
  // this at midnight post-episode — 'Resolve' names the action verb
  // explicitly; 'Confirm' is action-ambiguous on a "Has X resolved?" prompt.
  confirmAction('Has vomiting stopped for at least 6 hours?', function() { resolveVomitingEpisode(); showQLToast('' + zi('check') + ' Vomiting episode resolved'); }, 'Resolve');
}

function renderHomeVomitingBanner() {
  const banner = document.getElementById('homeVomitingBanner');
  if (!banner) return;
  const ep = getActiveVomitingEpisode();
  if (!ep) { banner.style.display = 'none'; return; }
  banner.style.display = '';
  const recent12 = _voEpisodesIn12h(ep);
  const dur = _feverDurationStr(ep);
  banner.innerHTML = '<div class="ve-home-banner" data-nav-track-medical="vomitingEpisodeCard">' +
    '<div class="fe-home-banner-info"><div class="fe-home-banner-temp t-caution" >' + zi('siren') + ' ' + recent12.length + ' vomiting episodes/12h · ' + dur + '</div>' +
    '<div class="fe-home-banner-sub">Wet diapers: ' + _voWetToday(ep) + '/6</div></div>' +
    '<button class="btn btn-sage btn-sm-inline" data-action="logVomitingEpisodeEntry" data-stop="1" data-arg="\'vomit\'" >' + zi('note') + ' Log</button></div>';
}

function renderVomitingHistory() {
  const card = document.getElementById('vomitingHistoryCard');
  const summary = document.getElementById('vomitingHistorySummary');
  const body = document.getElementById('vomitingHistoryBody');
  if (!card || !summary || !body) return;
  const resolved = _vomitingEpisodes.filter(e => e.status === 'resolved');
  if (resolved.length === 0) { card.style.display = 'none'; return; }
  card.style.display = '';
  const last = resolved[resolved.length - 1];
  summary.innerHTML = '<div class="t-sm t-light">' + resolved.length + ' episode' + (resolved.length !== 1 ? 's' : '') + (last.resolvedAt ? ' · last: ' + formatDate(_epLocalDateStr(last.resolvedAt)) : '') + '</div>';
  let html = '';
  resolved.slice().reverse().forEach(ep => {
    // End date + notes shown so an edit is visible (Maren V-M-267-4 / Vela V-V-267-3).
    const voS = formatDate(_epLocalDateStr(ep.startedAt)), voE = ep.resolvedAt ? formatDate(_epLocalDateStr(ep.resolvedAt)) : '';
    html += _epHistoryRowOpen('vomiting', ep) + '<div class="fe-history-date"><span>' + voS + (voE && voE !== voS ? ' — ' + voE : '') + ' · ' + _feverDurationStr(ep) + '</span>' + _epHistoryEditLabel(ep) + '</div>';
    html += '<div class="fe-history-detail">' + ep.episodes.length + ' episodes · ' + ep.fluids.length + ' fluids logged</div>';
    if (ep.resolvedNotes) html += '<div class="fe-history-detail">' + escHtml(ep.resolvedNotes) + '</div>';
    html += _epHistoryEditedLine(ep);
    html += _renderAttribution(ep);
    html += '</div>';
  });
  body.innerHTML = html;
}

function computeVomitingAlerts() {
  const alerts = [];
  const ep = getActiveVomitingEpisode();
  if (!ep) return alerts;
  const state = loadAlertState();
  const todayStr = today();

  if (ep.episodes.some(e => e.type === 'projectile' || e.type === 'bile')) {
    const key = 'vo-emergency-' + ep.id;
    if (!state.dismissed[key]) alerts.push({ id: 'vo-emergency', key, severity: 'urgent', icon: zi('siren'), title: 'Projectile/bile vomiting — seek care', body: '', tab: 'medical', dismissable: true });
  }
  const durationH = (Date.now() - new Date(ep.startedAt).getTime()) / 3600000;
  if (durationH > 12) {
    const key = 'vo-persist-' + ep.id;
    if (!state.dismissed[key]) alerts.push({ id: 'vo-persist', key, severity: 'watch', icon: zi('warn'), title: 'Vomiting persisting >12 hours', body: 'Call your paediatrician.', tab: 'medical', dismissable: true });
  }
  if (_voWetToday(ep) < 4 && new Date().getHours() >= 14) {
    const key = 'vo-wet-' + todayStr;
    if (!state.dismissed[key]) alerts.push({ id: 'vo-wet-low', key, severity: 'watch', icon: zi('diaper'), title: 'Only ' + _voWetToday(ep) + ' wet diapers — watch hydration', body: '', tab: 'medical', dismissable: true });
  }
  return alerts;
}

function promptVomitingTrack() {
  if (getActiveVomitingEpisode()) { showQLToast('Vomiting episode already active'); return; }
  startVomitingEpisode('symptom-checker');
  showQLToast(zi('siren') + ' Vomiting episode started');
  switchTab('track');
  setTimeout(function() { switchTrackSub('medical'); }, 100);
  setTimeout(function() { renderVomitingEpisodeCard(); renderHomeVomitingBanner(); renderVomitingHistory(); document.getElementById('vomitingEpisodeCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200);
}

// ── COLD / COUGH EPISODE TRACKING (v2.9) ──

let _coldEpisodes = [];
try { _coldEpisodes = JSON.parse(localStorage.getItem(KEYS.coldEpisodes)) || []; } catch { _coldEpisodes = []; }
if (!Array.isArray(_coldEpisodes)) _coldEpisodes = [];
_coldEpisodes = _epNormalize('cold', _coldEpisodes);   // ids for legacy entries, in memory only (V-CA-P3-14)

function getActiveColdEpisode() { return _coldEpisodes.find(e => e.status === 'active') || null; }

function startColdEpisode(source) {
  if (getActiveColdEpisode()) return getActiveColdEpisode();
  const now = new Date().toISOString();
  const ep = { id: 'ce-' + Date.now(), status: 'active', startedAt: now, resolvedAt: null,
    dailyLogs: [],    // { date, symptoms: [...], severity: 1-5, notes }
    actions: [],
    triggerSource: source || 'manual', notes: '', resolvedNotes: '' };
  _coldEpisodes.push(ep);
  _coldEpisodes = _epPrune('cold', _coldEpisodes);
  _epSave('coldEpisodes', _coldEpisodes);
  return ep;
}

function logColdDailySymptoms(symptoms, severity, notes) {
  const ep = getActiveColdEpisode();
  if (!ep) return;
  const todayStr = today();
  // Replace today's log if already exists
  const existing = ep.dailyLogs.findIndex(l => l.date === todayStr);
  const entry = { date: todayStr, time: new Date().toISOString(), symptoms: symptoms || [], severity: severity || 3, notes: notes || '' };
  if (existing >= 0) ep.dailyLogs[existing] = entry;
  else ep.dailyLogs.push(entry);
  _epSave('coldEpisodes', _coldEpisodes);
  renderColdEpisodeCard(); renderHomeColdBanner();
}

function logColdAction(action, timeStr) {
  const ep = getActiveColdEpisode();
  if (!ep) return;
  ep.actions.push({ time: timeStr || new Date().toISOString(), action: action });
  _epSave('coldEpisodes', _coldEpisodes);
  renderColdEpisodeCard();
}

function resolveColdEpisode() {
  const ep = getActiveColdEpisode();
  if (!ep) return;
  ep.status = 'resolved'; ep.resolvedAt = new Date().toISOString(); ep.resolvedUpdatedAt = ep.resolvedAt;   // the resolve group's merge stamp (V-CA-P3-3)
  _epSave('coldEpisodes', _coldEpisodes);
  renderColdEpisodeCard(); renderColdHistory(); renderHomeColdBanner(); renderHome();
}

function renderColdEpisodeCard() {
  const card = document.getElementById('coldEpisodeCard');
  if (!card) return;
  const ep = getActiveColdEpisode();
  if (!ep) { card.style.display = 'none'; return; }
  card.style.display = '';

  const dur = _feverDurationStr(ep);
  const dayCount = ep.dailyLogs.length;
  const todayLog = ep.dailyLogs.find(l => l.date === today());
  const durationDays = Math.ceil((Date.now() - new Date(ep.startedAt).getTime()) / 86400000);
  const latestSeverity = todayLog ? todayLog.severity : (ep.dailyLogs.length > 0 ? ep.dailyLogs[ep.dailyLogs.length - 1].severity : 3);
  const sevColor = latestSeverity >= 4 ? 'var(--tc-caution)' : 'var(--tc-sky)';

  card.style.borderLeft = '4px solid ' + sevColor;
  let html = '<div class="card-header"><div class="card-title"><div class="icon icon-sky"><svg class="zi"><use href="#zi-medical"/></svg></div> Active Cold / Cough</div><span class="t-sm t-light">' + dur + '</span></div>' + _epCameBackHtml(ep);
  html += '<div class="ce-day-display">Day ' + durationDays + '</div>';
  html += '<div style="text-align:center;font-size:var(--fs-xs);color:var(--light);">' + dayCount + ' daily log' + (dayCount !== 1 ? 's' : '') + ' recorded</div>';

  // Today's symptom log
  html += '<div class="fe-section-title">Today\'s Symptoms</div>';
  const COLD_SYMPTOMS = ['Runny nose', 'Stuffy nose', 'Cough', 'Sneezing', 'Phlegm', 'Watery eyes', 'Mild fever', 'Poor appetite', 'Fussiness'];
  const todaySymptoms = todayLog ? new Set(todayLog.symptoms) : new Set();
  html += '<div class="fe-action-chips">';
  COLD_SYMPTOMS.forEach(s => {
    const active = todaySymptoms.has(s);
    html += '<span class="fe-action-chip" style="' + (active ? 'background:var(--sage);color:white;' : '') + '" data-action="ceToggleSymptom" data-arg="' + escAttr(s) + '">' + (active ? zi('check') + ' ' : '') + escHtml(s) + '</span>';
  });
  html += '</div>';

  // Severity slider
  html += '<div style="padding:var(--sp-8) 0;"><div style="font-size:var(--fs-xs);color:var(--light);margin-bottom:4px;">Severity today (1=mild, 5=severe):</div>';
  html += '<div style="display:flex;gap:var(--sp-4);align-items:center;">';
  for (let i = 1; i <= 5; i++) {
    const isActive = latestSeverity === i;
    const color = i <= 2 ? 'var(--tc-sage)' : i <= 3 ? 'var(--tc-amber)' : 'var(--tc-caution)';
    html += '<span class="fe-action-chip" style="' + (isActive ? 'background:' + color + ';color:white;border-color:' + color + ';' : '') + 'min-width:32px;justify-content:center;" data-action="ceSetSeverity" data-arg="' + i + '">' + i + '</span>';
  }
  html += '</div></div>';

  // Daily log history
  if (ep.dailyLogs.length > 0) {
    html += '<div class="fe-section-title">Daily Log</div>';
    ep.dailyLogs.slice().reverse().slice(0, 7).forEach(l => {
      const sevDots = zi('dot-red').repeat(l.severity) + zi('dot-empty').repeat(5 - l.severity);
      html += '<div class="ce-symptom-row"><span style="font-size:var(--fs-xs);color:var(--light);min-width:55px;">' + formatDate(l.date) + '</span>';
      html += '<span style="font-size:var(--fs-xs);letter-spacing:2px;" title="Severity ' + l.severity + '/5">' + sevDots + '</span>';
      html += '<span style="font-size:var(--fs-xs);color:var(--mid);flex:1;min-width:0;">' + (l.symptoms.length > 0 ? l.symptoms.slice(0, 3).join(', ') : 'no symptoms logged') + '</span></div>';
    });
  }

  // Actions
  html += '<div class="fe-section-title">Actions</div>';
  html += _epTimePickerHTML('ceAction');
  html += '<div class="fe-action-chips">';
  ['Saline drops', 'Steam inhalation', 'Humidifier on', 'Elevated mattress', 'Breastfed', 'Doctor called'].forEach(a => {
    html += '<span class="fe-action-chip" data-action="logColdAction" data-arg="ceAction" data-arg2="' + escAttr(a) + '">' + escHtml(a) + '</span>';
  });
  html += '</div>';
  if (ep.actions.length > 0) {
    ep.actions.slice().reverse().slice(0, 4).forEach((a, i) => {
      const origIdx = ep.actions.length - 1 - i;
      html += '<div class="fe-action-entry ep-entry-tap" data-action="ceEditAction" data-arg="' + _epRowArg(ep.actions, origIdx) + '">' + _feverTimeShort(a.time) + ' — ' + escHtml(a.action) + '</div>';
    });
  }

  // Guidance
  html += '<div class="fe-section-title">Guidance</div><div class="fe-guidance"><ul class="ep-list">';
  html += '<li>Use saline drops (Nasivion Mini) before feeds</li>';
  html += '<li>Run humidifier or steam inhalation (steamy bathroom 5–10 min)</li>';
  html += '<li>Elevate head end of mattress slightly</li>';
  html += '<li>Do NOT give OTC cold/cough medicines</li>';
  html += '<li>Do NOT use Vicks or menthol on babies</li>';
  if (durationDays > 7) html += '<li style="color:var(--tc-caution);font-weight:600;">' + zi('warn') + ' Cold persisting >7 days — consult paediatrician</li>';
  else html += '<li>Call doctor if: rapid breathing, wheezing, blue lips, or cough >7 days</li>';
  html += '</ul></div>';

  if (durationDays > 7) html += '<div style="padding:8px 12px;border-radius:var(--r-md);margin:var(--sp-4) 0;background:var(--surface-caution);font-size:var(--fs-sm);font-weight:600;color:var(--tc-caution);">' + zi('warn') + ' Cold/cough for ' + durationDays + ' days — consider doctor visit</div>';

  // Improvement
  if (ep.dailyLogs.length >= 2) {
    const last2 = ep.dailyLogs.slice(-2);
    if (last2[1].severity <= 2 && last2[0].severity > last2[1].severity) {
      html += '<div style="padding:10px 12px;border-radius:var(--r-md);margin:var(--sp-8) 0;background:rgba(58,112,96,0.08);font-size:var(--fs-sm);color:var(--tc-sage);font-weight:600;">' + zi('check') + ' Severity improving — trending down</div>';
    }
  }

  html += '<div class="fe-resolve"><button class="btn btn-ghost w-full" data-action="ceResolvePrompt" data-arg="" >' + zi('check') + ' Mark Resolved</button></div>';
  html += '<div class="source-attribution">Guidance only — not medical advice.</div>';
  card.innerHTML = html;
}

function ceToggleSymptom(symptom) {
  const ep = getActiveColdEpisode();
  if (!ep) return;
  const todayLog = ep.dailyLogs.find(l => l.date === today());
  const currentSymptoms = todayLog ? [...todayLog.symptoms] : [];
  const currentSev = todayLog ? todayLog.severity : 3;
  const idx = currentSymptoms.indexOf(symptom);
  if (idx >= 0) currentSymptoms.splice(idx, 1);
  else currentSymptoms.push(symptom);
  logColdDailySymptoms(currentSymptoms, currentSev, '');
}

function ceSetSeverity(sev) {
  const ep = getActiveColdEpisode();
  if (!ep) return;
  const todayLog = ep.dailyLogs.find(l => l.date === today());
  const currentSymptoms = todayLog ? todayLog.symptoms : [];
  logColdDailySymptoms(currentSymptoms, sev, '');
}

function ceResolvePrompt() {
  // V-M-41 shield (PR-D) — `'Resolve'` btnText prevents 'Confirm' fallback;
  // split/audit-resolve-shield.sh fails the build if dropped. Parent reads
  // this at midnight post-episode — 'Resolve' names the action verb
  // explicitly; 'Confirm' is action-ambiguous on a "Has X resolved?" prompt.
  confirmAction('Has the cold/cough resolved? (Symptoms mostly cleared for 24+ hours)', function() { resolveColdEpisode(); showQLToast(zi('check') + ' Cold episode resolved'); }, 'Resolve');
}

// ── Cold Edit/Delete ──

function ceEditAction(arg) {
  const ep = getActiveColdEpisode();
  const idx = _epIdxOf(ep, 'actions', arg);   // the row carries the entry id (V-CA-P3-2, V-K-P3-5)
  if (idx < 0) return;
  const epId = ep.id, eid = ep.actions[idx].id;
  const a = ep.actions[idx];
  _epEditEntry({
    title: 'Edit Action',
    fields: [
      { label: 'Action', id: 'action', type: 'text', value: a.action },
      { label: 'Time', id: 'time', type: 'time', value: a.time }
    ],
    onSave: function(v) {
      const L = _epLive('cold', epId, 'actions', eid); if (!L) return _EP_GONE;
      const ep = L.ep, idx = L.i;   // the live entry at commit, never the one captured at open
      ep.actions[idx].action = v.action || a.action;
      ep.actions[idx].time = _epTimeToISO(v.time, ep.actions[idx].time);
      ep.actions[idx].editedAt = new Date().toISOString();   // an edited entry wins whole on merge (V-K-P3-9)
      _epSave('coldEpisodes', _coldEpisodes);
      renderColdEpisodeCard();
      showQLToast('Action updated');
    },
    onDelete: function() {
      const L = _epLive('cold', epId, 'actions', eid); if (!L) { showQLToast(_EP_GONE_DEL); return; }
      const ep = L.ep, idx = L.i;
      _epTombstone(ep, 'actions', idx);
      ep.actions.splice(idx, 1);
      _epSave('coldEpisodes', _coldEpisodes);
      renderColdEpisodeCard();
      showQLToast('Action deleted');
    }
  });
}

function renderHomeColdBanner() {
  const banner = document.getElementById('homeColdBanner');
  if (!banner) return;
  const ep = getActiveColdEpisode();
  if (!ep) { banner.style.display = 'none'; return; }
  banner.style.display = '';
  const durationDays = Math.ceil((Date.now() - new Date(ep.startedAt).getTime()) / 86400000);
  const todayLog = ep.dailyLogs.find(l => l.date === today());
  const logged = todayLog ? 'Logged' : 'Not logged yet';
  banner.innerHTML = '<div class="ce-home-banner" data-nav-track-medical="coldEpisodeCard">' +
    '<div class="fe-home-banner-info"><div class="fe-home-banner-temp t-sky" >' + zi('siren') + ' Cold/Cough · Day ' + durationDays + '</div>' +
    '<div class="fe-home-banner-sub">Today: ' + logged + '</div></div>' +
    '<button class="btn btn-sage btn-sm-inline" onclick="event.stopPropagation();switchTab(\'track\');setTimeout(function(){switchTrackSub(\'medical\');},100);" >' + zi('note') + ' Log</button></div>';
}

function renderColdHistory() {
  const card = document.getElementById('coldHistoryCard');
  const summary = document.getElementById('coldHistorySummary');
  const body = document.getElementById('coldHistoryBody');
  if (!card || !summary || !body) return;
  const resolved = _coldEpisodes.filter(e => e.status === 'resolved');
  if (resolved.length === 0) { card.style.display = 'none'; return; }
  card.style.display = '';
  const last = resolved[resolved.length - 1];
  summary.innerHTML = '<div class="t-sm t-light">' + resolved.length + ' episode' + (resolved.length !== 1 ? 's' : '') + (last.resolvedAt ? ' · last: ' + formatDate(_epLocalDateStr(last.resolvedAt)) : '') + '</div>';
  let html = '';
  resolved.slice().reverse().forEach(ep => {
    const days = Math.ceil((new Date(ep.resolvedAt || Date.now()).getTime() - new Date(ep.startedAt).getTime()) / 86400000);
    const ceS = formatDate(_epLocalDateStr(ep.startedAt)), ceE = ep.resolvedAt ? formatDate(_epLocalDateStr(ep.resolvedAt)) : '';
    html += _epHistoryRowOpen('cold', ep) + '<div class="fe-history-date"><span>' + ceS + (ceE && ceE !== ceS ? ' — ' + ceE : '') + ' · ' + days + ' day' + (days !== 1 ? 's' : '') + '</span>' + _epHistoryEditLabel(ep) + '</div>';
    html += '<div class="fe-history-detail">' + ep.dailyLogs.length + ' daily logs · ' + ep.actions.length + ' actions</div>';
    if (ep.resolvedNotes) html += '<div class="fe-history-detail">' + escHtml(ep.resolvedNotes) + '</div>';
    html += _epHistoryEditedLine(ep);
    html += _renderAttribution(ep);
    html += '</div>';
  });
  body.innerHTML = html;
}

function computeColdAlerts() {
  const alerts = [];
  const ep = getActiveColdEpisode();
  if (!ep) return alerts;
  const state = loadAlertState();
  const todayStr = today();
  const durationDays = Math.ceil((Date.now() - new Date(ep.startedAt).getTime()) / 86400000);

  // Daily log reminder
  const todayLog = ep.dailyLogs.find(l => l.date === todayStr);
  if (!todayLog && new Date().getHours() >= 10) {
    const key = 'ce-log-' + todayStr;
    if (!state.dismissed[key]) alerts.push({ id: 'ce-log-reminder', key, severity: 'info', icon: zi('siren'), title: 'Cold/cough — log today\'s symptoms', body: 'Day ' + durationDays + '. Tap to update today\'s symptom check.', action: { label: 'Log', fn: 'switchTab("track");setTimeout(function(){switchTrackSub("medical");},100);' }, tab: 'medical', dismissable: true });
  }
  if (durationDays > 7) {
    const key = 'ce-persist-' + ep.id;
    if (!state.dismissed[key]) alerts.push({ id: 'ce-persist', key, severity: 'watch', icon: zi('warn'), title: 'Cold/cough for ' + durationDays + ' days', body: 'Consider consulting your paediatrician.', tab: 'medical', dismissable: true });
  }
  return alerts;
}

function promptColdTrack() {
  if (getActiveColdEpisode()) { showQLToast('Cold episode already active'); return; }
  startColdEpisode('symptom-checker');
  showQLToast(zi('siren') + ' Cold/cough episode started');
  switchTab('track');
  setTimeout(function() { switchTrackSub('medical'); }, 100);
  setTimeout(function() { renderColdEpisodeCard(); renderHomeColdBanner(); renderColdHistory(); document.getElementById('coldEpisodeCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200);
}

// R3 (F-6a) — RETIRED `getMealSlotTopFoods`: sole live caller was
// renderDietQuickPicker (R1, the dqp zone). Deleted, no migration.

// insertDietFood / fillDietMeal — RE-TARGETED (F-6a). The dqp pill taps they
// served die with the dqp zone, but renderDietIntelBanner (a kept surface)
// still emits these two actions for its "log this combo" + synergy-partner
// pills. So rather than retire the names, they now route into the composer's
// Mount-B card for the slot (structured save-on-action via fcAddItem /
// instance.items), not the gone free-text .meal-input. Skipped slots no-op.
function insertDietFood(meal, food) {
  if (typeof _fcInstances === 'undefined') return;
  var inst = _fcInstances.find(function(i) { return i.variant === 'card' && i.slot === meal; });
  if (!inst || inst.skipped) return;
  if (typeof fcAddItem === 'function') fcAddItem(inst, food, 'banner');
}

function fillDietMeal(meal, value) {
  if (typeof _fcInstances === 'undefined') return;
  var inst = _fcInstances.find(function(i) { return i.variant === 'card' && i.slot === meal; });
  if (!inst || inst.skipped) return;
  inst.items = String(value).split(/[,+]/).map(function(s) { return s.trim(); }).filter(Boolean).map(function(nm) {
    var d = window._fdResolveQtyDefaults(nm);
    return { name: nm, qty: d.qty, unit: d.unit, nutritionRef: window._fdNutritionRef(nm), source: 'banner' };
  });
  inst.sourceFlow = 'diet-tab';
  if (typeof _fcAfterItemChange === 'function') _fcAfterItemChange(inst);
}

// R7 (F-6a) — RETIRED `saveFeedingDay`: the legacy-string whole-day writer
// whose text-changed branch intentionally dropped the `_v1` sidecar. The
// composer is the one writer (save-on-action via _fdWriteStructuredMeal); the
// edit-path sidecar-drop regression is closed because there is no longer any
// editor that writes legacy-only. This retires the last large legacy-string
// producer (the stated reason F-5 sequences after F-6 and lands cleaner).

// ── Post-Save Nutrition Flash ──

let _psfTimer = null;
let _lastPsfData = null; // Persisted flash data for home card

function showPostSaveFlash(dateStr) {
  const overlay = document.getElementById('psfOverlay');
  if (!overlay) return;

  const entry = feedingData[dateStr];
  if (!entry) return;

  const MEALS = ['breakfast','lunch','dinner','snack'];
  const MEAL_LABELS = { breakfast:'Breakfast', lunch:'Lunch', dinner:'Dinner', snack:'Snack' };
  const MEAL_EMOJI = { breakfast:zi('sun'), lunch:zi('bolt'), dinner:zi('moon'), snack:zi('spoon') };
  const NUTRIENT_EMOJI = { iron:zi('flame'), calcium:zi('ruler'), protein:zi('run'), 'vitamin C':zi('spoon'), fibre:zi('bowl'), 'vitamin A':zi('baby'), 'omega-3':zi('brain'), zinc:zi('shield') };

  // 1. Gather all nutrients from today's meals
  const allNutrients = new Set();
  const allTags = new Set();
  const allFoods = [];
  const mealFoods = {};
  let loggedMeals = 0;
  let emptyMeals = [];

  MEALS.forEach(m => {
    const val = entry[m];
    if (!isRealMeal(val)) {
      if (val !== '—skipped—') emptyMeals.push(m);
      return;
    }
    loggedMeals++;
    mealFoods[m] = val;
    const items = parseMealNutrition(val);
    items.forEach(item => {
      (item.nutrients || []).forEach(n => allNutrients.add(n));
      (item.tags || []).forEach(t => allTags.add(t));
      allFoods.push(item.food);
    });
  });

  if (loggedMeals === 0) {
    // Nothing logged — just show quick confirmation
    _psfFallbackToast();
    return;
  }

  // 2. Covered vs missing key nutrients
  const covered = KEY_NUTRIENTS.filter(n => allNutrients.has(n));
  const missing = KEY_NUTRIENTS.filter(n => !allNutrients.has(n));

  // 3. Food group diversity
  const groupSet = new Set();
  allFoods.forEach(f => {
    const cls = classifyFoodToGroup(f);
    if (cls) groupSet.add(cls.groupLabel);
  });

  // 4. Detect synergies present in today's meals
  const synergiesFound = [];
  const allFoodLower = allFoods.map(f => f.toLowerCase());
  FOOD_SYNERGIES.forEach(([f1, f2, reason, type]) => {
    const hasF1 = allFoodLower.some(f => f.includes(f1) || f1.includes(f));
    const hasF2 = allFoodLower.some(f => f.includes(f2) || f2.includes(f));
    if (hasF1 && hasF2) synergiesFound.push({ reason, type });
  });

  // 5. Build next-meal suggestion
  let tipHtml = '';
  if (missing.length > 0 && emptyMeals.length > 0) {
    const topGap = missing[0]; // Most important missing nutrient (iron first in KEY_NUTRIENTS)
    const nextMeal = emptyMeals[0];
    // Find introduced foods that provide this nutrient
    const providers = (foods || []).filter(f => {
      const nut = getNutrition(f.name);
      return nut && nut.nutrients && nut.nutrients.some(n => n.toLowerCase() === topGap.toLowerCase());
    }).slice(0, 3).map(f => f.name);

    if (providers.length > 0) {
      // Check if any synergy partner exists for the suggestion
      let synergyHint = '';
      providers.forEach(p => {
        if (synergyHint) return;
        FOOD_SYNERGIES.forEach(([f1, f2, reason]) => {
          if (synergyHint) return;
          const pLow = p.toLowerCase();
          if (pLow.includes(f1) || f1.includes(pLow)) {
            const partner = (foods || []).find(fi => fi.name.toLowerCase().includes(f2));
            if (partner) synergyHint = ' + ' + partner.name + ' (better absorption)';
          } else if (pLow.includes(f2) || f2.includes(pLow)) {
            const partner = (foods || []).find(fi => fi.name.toLowerCase().includes(f1));
            if (partner) synergyHint = ' + ' + partner.name + ' (better absorption)';
          }
        });
      });

      tipHtml = `<div class="psf-tip">${zi('bulb')} For <strong>${MEAL_LABELS[nextMeal].toLowerCase()}</strong>, try <strong>${escHtml(providers[0])}${synergyHint ? escHtml(synergyHint) : ''}</strong> to add ${NUTRIENT_EMOJI[topGap] || ''} ${topGap}</div>`;
    } else {
      tipHtml = `<div class="psf-tip">${zi('bulb')} ${MEAL_LABELS[nextMeal]} is open — a good chance to add ${NUTRIENT_EMOJI[topGap] || ''} ${topGap}</div>`;
    }
  } else if (missing.length > 0 && emptyMeals.length === 0) {
    // All meals logged but some nutrients missing
    const topGap = missing[0];
    tipHtml = `<div class="psf-tip">${zi('bulb')} Tomorrow, aim to include a ${topGap} source like ${_suggestFoodForNutrient(topGap)}</div>`;
  } else if (missing.length === 0) {
    tipHtml = `<div class="psf-tip" style="background:rgba(58,112,96,0.08);color:var(--tc-sage);font-weight:600;">${zi('sparkle')} All 8 key nutrients covered today!</div>`;
  }

  // 6. Build header summary
  const headerText = loggedMeals === 1
    ? MEAL_LABELS[MEALS.find(m => isRealMeal(entry[m]))] + ' saved'
    : loggedMeals + ' meals saved';
  const subText = covered.length + '/' + KEY_NUTRIENTS.length + ' key nutrients · ' + groupSet.size + ' food group' + (groupSet.size !== 1 ? 's' : '');

  // 7. Synergy line
  let synergyHtml = '';
  if (synergiesFound.length > 0) {
    const best = synergiesFound[0];
    const emoji = best.type === 'absorption' ? zi('link') : best.type === 'complete' ? zi('sparkle') : zi('sprout');
    synergyHtml = `<div class="psf-synergy">${emoji} ${escHtml(best.reason)}</div>`;
  }

  // 8. Render
  let nutrientHtml = '';
  covered.forEach(n => {
    nutrientHtml += `<span class="psf-nut">${NUTRIENT_EMOJI[n] || '·'} ${n}</span>`;
  });
  // Show up to 3 missing
  missing.slice(0, 3).forEach(n => {
    nutrientHtml += `<span class="psf-nut missed">${NUTRIENT_EMOJI[n] || '·'} ${n}</span>`;
  });
  if (missing.length > 3) {
    nutrientHtml += `<span class="psf-nut missed">+${missing.length - 3} more</span>`;
  }

  // Persist for home card
  _lastPsfData = {
    dateStr, headerText, subText, covered: [...covered], missing: [...missing],
    synergy: synergiesFound.length > 0 ? synergiesFound[0] : null,
    tipHtml, nutrientHtml, synergyHtml, groups: groupSet.size, loggedMeals
  };

  overlay.innerHTML = `<div class="psf-card">
    <div class="psf-header">
      <div class="psf-check">${zi('check')}</div>
      <div>
        <div class="psf-title">${headerText}</div>
        <div class="psf-subtitle">${subText}</div>
      </div>
    </div>
    <div class="psf-body">
      <div class="psf-nutrients">${nutrientHtml}</div>
      ${synergyHtml}
      ${tipHtml}
    </div>
    <button class="psf-dismiss" data-action="dismissPostSaveFlash">Tap to dismiss</button>
  </div>`;

  overlay.classList.add('open');

  // Show intake prompt after brief delay to let user see nutrition summary first
  var intakeDateStr = dateStr;
  setTimeout(function() { _miShowPostSavePrompt(intakeDateStr); }, 300);

  // Auto-dismiss after 10s (extended from 6s to give time for intake selection)
  if (_psfTimer) clearTimeout(_psfTimer);
  _psfTimer = setTimeout(dismissPostSaveFlash, 10000);
}

function dismissPostSaveFlash() {
  const overlay = document.getElementById('psfOverlay');
  if (overlay) overlay.classList.remove('open');
  if (_psfTimer) { clearTimeout(_psfTimer); _psfTimer = null; }
  // Refresh home to show persisted summary
  renderHomeMealProgress();
}

function openDiversityDetail() {
  switchTab('info');
  // Wait for info tab to render, then expand and scroll to Meal Breakdown
  setTimeout(() => {
    const body = document.getElementById('infoMealBreakdownBody');
    const chevron = document.getElementById('infoMealBreakdownChevron');
    if (body && body.style.display === 'none') {
      body.style.display = '';
      if (chevron) chevron.innerHTML = zi('chevron-up');
    }
    const card = document.getElementById('infoMealBreakdownCard');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 150);
}

function showPsfReview() {
  if (!_lastPsfData) return;
  const d = _lastPsfData;
  const overlay = document.getElementById('psfOverlay');
  if (!overlay) return;

  overlay.innerHTML = `<div class="psf-card">
    <div class="psf-header">
      <div class="psf-check">${zi('check')}</div>
      <div>
        <div class="psf-title">${d.headerText}</div>
        <div class="psf-subtitle">${d.subText}</div>
      </div>
    </div>
    <div class="psf-body">
      <div class="psf-nutrients">${d.nutrientHtml}</div>
      ${d.synergyHtml}
      ${d.tipHtml}
    </div>
    <button class="psf-dismiss" data-action="dismissPostSaveFlash">Tap to dismiss</button>
  </div>`;

  overlay.classList.add('open');
  if (_psfTimer) clearTimeout(_psfTimer);
  // No auto-dismiss on review — user taps to close
}

function _suggestFoodForNutrient(nutrient) {
  const suggestions = {
    iron: 'ragi, spinach, or masoor dal',
    calcium: 'ragi, curd, or paneer',
    protein: 'moong dal, paneer, or curd',
    'vitamin C': 'orange, tomato, or amla',
    fibre: 'banana, oats, or sweet potato',
    'vitamin A': 'carrot, sweet potato, or mango',
    'omega-3': 'walnuts, flaxseed, or avocado',
    zinc: 'bajra, oats, or dal'
  };
  return suggestions[nutrient] || 'a variety of foods';
}

function _psfFallbackToast() {
  // F-6a (Cipher Edict V) — R7 removed the whole-day #saveFeedBtn this used
  // to poke "Saved!". On the live zero-meal-day path (_miShowPostSavePrompt),
  // confirm via the toast instead so the affordance survives the retirement.
  if (typeof showQLToast === 'function') showQLToast('Saved', 1500);
}

// Scan all meals for a given date and auto-add new foods to Foods Introduced
// Earliest feedingData day (on or before `upTo`) whose meals hold this food (V-M-276-2).
function _firstLoggedDate(food, upTo) {
  const days = Object.keys(feedingData).filter(d => d <= upTo).sort();
  for (const d of days) {
    const e = feedingData[d];
    if (!e) continue;
    for (const m of ['breakfast','lunch','dinner','snack']) {
      if (!isRealMeal(e[m])) continue;
      if (e[m].split(/[,+]/).some(it => it.trim() && _sameFood(it.trim(), food))) return d;
    }
  }
  return upTo;
}

function autoIntroduceFoodsFromDay(dateStr) {
  const entry = feedingData[dateStr];
  if (!entry) return;
  let added = false;
  ['breakfast','lunch','dinner','snack'].forEach(meal => {
    if (!isRealMeal(entry[meal])) return;
    entry[meal].split(/[,+]/).forEach(f => {
      const clean = f.trim();
      if (clean.length <= 1) return;
      const base = _baseFoodName(clean.toLowerCase());
      // Same-food identity (plurals folded), never substring: "eggplant" must not
      // stand in for "egg", or a logged allergen is never introduced (V-C-275-14).
      const alreadyExists = foods.some(fi => _sameFood(fi.name, clean));
      if (!alreadyExists) {
        // Date it from the first logged meal that holds it, not this save: a food
        // hidden by the old merge may have been eaten for months (V-M-276-2).
        foods.push({ name: clean, reaction: 'ok', date: _firstLoggedDate(clean, dateStr) });
        added = true;
      }
    });
  });
  if (added) save(KEYS.foods, foods);
}

function changeDate(dir) {
  const inp = document.getElementById('feedingDate');
  // HR-12 (V-V-226): parse the YYYY-MM-DD value with explicit y/m/d so the
  // date doesn't roll back a day via new Date(str)'s UTC-midnight parse in a
  // behind-UTC timezone. The composer now leans on this for cross-date
  // hydration, so the date-walk must be timezone-safe.
  const p = (inp.value || today()).split('-');
  const d = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
  d.setDate(d.getDate() + dir);
  inp.value = toDateStr(d);
  loadFeedingDay();
}

// ─────────────────────────────────────────

// v1.9 — QUICK LOG FAB
// ─────────────────────────────────────────
let _qlOpen = false;
let _qlMeal = 'breakfast';
// F-2 fix (C1): explicit-meal flag. Callers that pre-set _qlMeal before
// openQuickModal('feed') set this to true so openQuickModal preserves
// their intent instead of clobbering with detectMealType(). One-shot —
// consumed (reset to false) inside openQuickModal. Without this guard,
// every "Log Breakfast" home alert at 8 PM would silently re-route to
// the dinner slot (detected by time-of-day) and load wrong-slot rails.
let _qlMealExplicit = false;
let _qlWake = 0;
let _qlColor = 'yellow';
let _qlCon = 'normal';
let _qlScrollY = 0;

function qlLockBody() {
  _qlScrollY = window.scrollY;
  document.documentElement.classList.add('ql-locked');
  document.body.classList.add('ql-locked');
  document.body.style.top = -_qlScrollY + 'px';
}

function qlUnlockBody() {
  document.documentElement.classList.remove('ql-locked');
  document.body.classList.remove('ql-locked');
  document.body.style.top = '';
  window.scrollTo(0, _qlScrollY);
}

function toggleQuickLog() {
  if (_qlOpen) { closeQuickLog(); }
  else { openQuickLog(); }
}

function openQuickLog() {
  _qlOpen = true;
  qlLockBody();
  document.getElementById('qlFab').classList.add('ql-fab-open');
  document.getElementById('qlSheetOverlay').classList.add('open');
  document.getElementById('qlSheet').classList.add('open');
  // Smart Quick Log: render predictions if not in backfill mode
  if (!_qlBackfillDate) {
    _qlActivePredictions = _qlPredict();
    _qlRenderSuggest(_qlActivePredictions);
  }
}

function closeQuickLog() {
  _qlOpen = false;
  _qlSuggestUsed = false;
  _qlActivePredictions = [];
  qlUnlockBody();
  document.getElementById('qlFab').classList.remove('ql-fab-open');
  document.getElementById('qlSheetOverlay').classList.remove('open');
  document.getElementById('qlSheet').classList.remove('open');
  var sw = document.getElementById('qlSuggestWrap');
  if (sw) { sw.classList.add('ql-suggest-hidden'); sw.innerHTML = ''; }
}

function openQuickModal(type) {
  // Close sheet visually but keep body locked
  document.getElementById('qlSheet').classList.remove('open');
  document.getElementById('qlSheetOverlay').classList.remove('open');
  document.getElementById('qlFab').classList.remove('ql-fab-open');
  _qlOpen = false;
  // Body stays locked — modal takes over

  // Pre-fill defaults
  if (type === 'feed') {
    // F-2 fix (C1): preserve _qlMeal when a caller explicitly set it
    // (via the _qlMealExplicit flag). Without this guard, callers like
    // home-tab "Log Breakfast" alerts at 8 PM would have their intent
    // clobbered to detectMealType()='dinner' and load wrong-slot rails.
    if (!_qlMealExplicit) {
      _qlMeal = detectMealType();
    }
    _qlMealExplicit = false;  // one-shot — consume the flag
    if (!_qlBackfillDate) _qlBackfillDate = null; // ensure reset for non-backfill
    document.querySelectorAll('.ql-meal-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.meal === _qlMeal);
    });
    const qlTimeEl = document.getElementById('qlFeedTime');
    if (qlTimeEl) qlTimeEl.value = '';
    // F-6a: mount/refresh the shared feeding composer (variant 'sheet') into
    // the sheet body — it renders the L1 repeat / L2 combo / items list / L3
    // next-item ribbon / L4 typeahead, hydrated from the active slot+date.
    if (typeof _qlIntakeExplicit !== 'undefined') _qlIntakeExplicit = false;
    if (typeof _qlMountSheetComposer === 'function') _qlMountSheetComposer();
    // Reset intake pills to default (Most)
    _miWireQLIntakePills();
    // Hide backfill UI unless in backfill mode
    const bfWrap = document.getElementById('qlBackfillWrap');
    if (bfWrap) bfWrap.style.display = _qlBackfillDate ? '' : 'none';
  }
  if (type === 'sleep') {
    _qlWake = 0;
    document.getElementById('qlWakeVal').textContent = '0';
    // Same-as-last: pre-fill from most recent night entry
    const lastNight = sleepData.filter(e => e.type === 'night').sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
    if (lastNight) {
      document.getElementById('qlSleepBed').value = lastNight.bedtime || '20:00';
      document.getElementById('qlSleepWake').value = lastNight.wakeTime || '06:00';
      _qlWake = getWakeCount(lastNight);
      document.getElementById('qlWakeVal').textContent = _qlWake;
    } else {
      document.getElementById('qlSleepBed').value = '20:00';
      document.getElementById('qlSleepWake').value = '06:00';
    }
  }
  if (type === 'nap') {
    // Round current time to nearest 15 min for start
    const now = new Date();
    const mins = Math.round(now.getMinutes() / 15) * 15;
    now.setMinutes(mins, 0, 0);
    const startStr = now.toTimeString().slice(0, 5);
    document.getElementById('qlNapStart').value = startStr;
    document.getElementById('qlNapEnd').value = '';
  }
  if (type === 'poop') {
    // Same-as-last: pre-fill from most recent poop
    const lastPoop = poopData.slice().sort((a, b) => ((b.date||'') + (b.time||'')).localeCompare((a.date||'') + (a.time||'')))[0];
    if (lastPoop) {
      _qlColor = lastPoop.color || 'yellow';
      _qlCon = lastPoop.consistency || 'normal';
    } else {
      _qlColor = 'yellow';
      _qlCon = 'normal';
    }
    document.querySelectorAll('.ql-color-dot').forEach(d => d.classList.toggle('active', d.dataset.color === _qlColor));
    document.querySelectorAll('.ql-con-pill').forEach(p => p.classList.toggle('active', p.dataset.con === _qlCon));
    // Pre-fill time to now
    document.getElementById('qlPoopTime').value = new Date().toTimeString().slice(0, 5);
  }
  if (type === 'activity') {
    // BN-4: Reset stale state from previous modal opens
    _alLastSuggestionText = null;
    _alDetectedEvidence = [];
    _alPrefillSource = _alPrefillSource || 'manual';
    _alOtherDurVisible = false;

    document.getElementById('alTextInput').value = _alPrefillText || '';

    // Inject slot + duration containers (first open only)
    _alInjectSlotDurContainers();

    // Auto-select current time slot
    _alSelectedSlot = _alCurrentSlot();
    _alRenderTimeSlots();

    // Duration: use prefill if available, else default to null (skip)
    if (_alPrefillDuration) {
      _alSelectedDuration = parseInt(_alPrefillDuration);
    } else {
      _alSelectedDuration = null;
    }
    _alRenderDurationChips();

    if (_alPrefillText) {
      // Pre-fill: classify immediately (skip debounce)
      const result = classifyActivity(_alPrefillText);
      _alDetectedEvidence = result.evidence;
      renderActivityChips();
    } else {
      document.getElementById('alDetectChips').innerHTML = '<div class="al-detect-empty">Type above to auto-detect milestones</div>';
    }
    _alPrefillText = null;
    _alPrefillDuration = null;
    // Session B: render suggestions, yesterday, domain nudge
    _alRenderSessionB();
  }
  document.getElementById('qlModal-' + type).classList.add('open');
}

function closeQuickModal() {
  document.querySelectorAll('.ql-modal-overlay').forEach(m => m.classList.remove('open'));
  _qlBackfillDate = null;
  _alPrefillSource = 'manual'; // Reset activity source on cancel
  ['sleep', 'nap', 'poop'].forEach(t => {
    const el = document.getElementById('qlBf-' + t);
    if (el) el.remove();
  });
  // Return to bottom sheet instead of exiting entirely
  resetQLSheet();
  openQuickLog();
}

function closeQuickLogAll() {
  // Close everything — modal + sheet + unlock body (used after successful save)
  document.querySelectorAll('.ql-modal-overlay').forEach(m => m.classList.remove('open'));
  document.getElementById('qlSheet').classList.remove('open');
  document.getElementById('qlSheetOverlay').classList.remove('open');
  document.getElementById('qlFab').classList.remove('ql-fab-open');
  qlUnlockBody();
  _qlOpen = false;
  _qlSuggestUsed = false;
  _qlActivePredictions = [];
  _qlBackfillDate = null;
  // Clean up injected backfill date pickers from non-feed modals
  ['sleep', 'nap', 'poop'].forEach(t => {
    const el = document.getElementById('qlBf-' + t);
    if (el) el.remove();
  });
  // Reset bottom sheet to default options
  resetQLSheet();
}


// ─────────────────────────────────────────────────────────────────────────
// v3-3 — getActiveIllnessPosture()
// Spec: docs/specs/v3-3-engine-spine.md §Primitive 4
// Reads getActiveFeverEpisode + getActiveDiarrhoeaEpisode + getActiveVomitingEpisode
// + getActiveColdEpisode as a SET. Surfaces compound illness state for CareTicket
// trigger doctrine (v3-2), recommendation severity escalation (Scoring Arc S-2),
// and cross-domain CareTicket triggers (C-7).
//
// Output: { compoundSymptomDays, escalationTier, primarySymptom, activeIllnesses }
//   compoundSymptomDays: int — days where 2+ illness types overlap in the recent 30-day window
//   escalationTier: 0 (nothing active) → 3 (critical compound: 3+ illnesses, multi-day)
//   primarySymptom: type with longest current active duration, or null
//   activeIllnesses: array of {type, startDate, severity, daysActive}
//
// HR-12 safe: reads existing episode start-date strings (YYYY-MM-DD); uses today() for
// day-arithmetic; no raw Date() construction.
// ─────────────────────────────────────────────────────────────────────────
function getActiveIllnessPosture() {
  var active = [];
  var fever = getActiveFeverEpisode();
  if (fever) active.push({
    type: 'fever',
    startDate: fever.startDate || null,
    severity: fever.maxTemp ? (fever.maxTemp >= 39 ? 'high' : fever.maxTemp >= 38 ? 'moderate' : 'low') : 'low',
    daysActive: fever.startDate ? _daysBetween(fever.startDate, today()) + 1 : 0,
  });
  var diarrh = getActiveDiarrhoeaEpisode();
  if (diarrh) active.push({
    type: 'diarrhoea',
    startDate: diarrh.startDate || null,
    severity: diarrh.stoolCount && diarrh.stoolCount >= 6 ? 'high' : 'moderate',
    daysActive: diarrh.startDate ? _daysBetween(diarrh.startDate, today()) + 1 : 0,
  });
  var vomit = getActiveVomitingEpisode();
  if (vomit) active.push({
    type: 'vomiting',
    startDate: vomit.startDate || null,
    severity: 'moderate',
    daysActive: vomit.startDate ? _daysBetween(vomit.startDate, today()) + 1 : 0,
  });
  var cold = getActiveColdEpisode();
  if (cold) active.push({
    type: 'cold',
    startDate: cold.startDate || null,
    severity: 'low',
    daysActive: cold.startDate ? _daysBetween(cold.startDate, today()) + 1 : 0,
  });

  // Compound day calc: days in the recent 30-day window where 2+ illness types overlap.
  // We walk 30 days back from today() and count days where multiple active illnesses
  // had startDate <= that day AND (no endDate OR endDate >= that day).
  var compoundDays = 0;
  if (active.length >= 2) {
    var dayCursor = today();
    for (var d = 0; d < 30; d++) {
      var dayStr = _offsetDateStr(today(), -d);
      var overlapCount = active.filter(function(ep) {
        return ep.startDate && ep.startDate <= dayStr;
      }).length;
      if (overlapCount >= 2) compoundDays++;
    }
  }

  // Escalation tier: 0..3 per spec.
  var tier = 0;
  if (active.length === 1) tier = 1;
  else if (active.length === 2) tier = compoundDays >= 2 ? 2 : 1;
  else if (active.length >= 3) tier = compoundDays >= 2 ? 3 : 2;

  // Primary symptom: longest-active among active.
  var primary = null;
  if (active.length > 0) {
    primary = active.reduce(function(longest, ep) {
      return (ep.daysActive > (longest ? longest.daysActive : 0)) ? ep : longest;
    }, null);
  }

  return {
    compoundSymptomDays: compoundDays,
    escalationTier: tier,
    primarySymptom: primary ? primary.type : null,
    activeIllnesses: active,
  };
}

// Helper: days between two YYYY-MM-DD strings (HR-12 safe — uses _offsetDateStr / day-key math).
// Returns positive int when dateB >= dateA.
function _daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return 0;
  // Walk forward from dateA until we hit dateB. Bounded to a sensible cap to avoid runaway.
  var cur = dateA;
  var count = 0;
  while (cur < dateB && count < 365) {
    cur = _offsetDateStr(cur, 1);
    count++;
  }
  return count;
}
