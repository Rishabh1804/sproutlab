// SproutLab · tagline composer — shared module (design layer).
// Composes a weighted tagline for any food combo from the ratified ingredient bank.
//  • rotating epithets (day-seed) → dynamic without intervention
//  • soft prep-cautions FOLD into the phrase (ground almond / halved grape)
//  • STRICT no's (honey / added sugar / salt) keep a prominent lead clause
//  • minor-share ratio picks the connector → volume shows in the words

// id → { eps:[rotating adjectives], noun, c:icon-colour, fold?:soft-prep, strict?:hard-lead }
export const EP = {
  banana:     {eps:['creamy','sweet','soft'],         noun:'banana',       c:'#e9c44a'},
  almond:     {eps:['nutty','buttery'],               noun:'almond',       c:'#b9824e', fold:'ground'},
  peanut:     {eps:['nutty','rich'],                  noun:'peanut',       c:'#d9b27a', fold:'ground'},
  rice:       {eps:['soft','gentle','silky'],         noun:'rice',         c:'#d8c79f'},
  carrot:     {eps:['sweet','bright','sunny'],        noun:'carrot',       c:'#e8843a'},
  paneer:     {eps:['mild','soft','milky'],           noun:'paneer',       c:'#cdbf93'},
  dal:        {eps:['savoury','soupy','hearty'],      noun:'moong dal',    c:'#9bb24a'},
  millet:     {eps:['earthy','iron-rich','nutty'],    noun:'ragi',         c:'#b06a44'},
  oats:       {eps:['wholesome','warm','hearty'],     noun:'oats',         c:'#d4bb7c'},
  apple:      {eps:['sweet','stewed','crisp'],        noun:'apple',        c:'#d2473f'},
  spinach:    {eps:['leafy','green','iron-rich'],     noun:'spinach',      c:'#5a9a42'},
  sweetpotato:{eps:['velvety','golden','creamy'],     noun:'sweet potato', c:'#c56b3e'},
  pumpkin:    {eps:['silky','golden','sweet'],        noun:'pumpkin',      c:'#e2913f'},
  grapes:     {eps:['juicy','sweet'],                 noun:'grape',        c:'#7d4f9e', fold:'halved'},
  honey:      {eps:['golden'],                        noun:'honey',        c:'#e8a93a', strict:'honey — only from age 1'},
};

export const connector = s =>
  s < 0.12 ? 'with just a hint of' :
  s < 0.22 ? 'with a touch of'     :
  s < 0.33 ? 'with a little'       :
  s < 0.45 ? 'balanced with'       : 'meets';

const epOf   = (it, seed) => it.eps[seed % it.eps.length];
const nounOf = it => it.fold ? `${it.fold} ${it.noun}` : it.noun;   // soft prep folds into the noun

// parts: [{id, w}] · seed: day-seed for epithet rotation
// returns { strict:[...lead clauses], body } — render strict first (prominent), then body
export function compose(parts, seed = 0) {
  const items = parts.map(p => ({ ...EP[p.id], w: p.w })).filter(i => i.noun).sort((a, b) => b.w - a.w);
  const total = items.reduce((s, i) => s + i.w, 0) || 1;
  const strict = [...new Set(items.filter(i => i.strict).map(i => i.strict))];
  const dom = items[0];
  let body;
  if (items.length === 1) {
    body = `${epOf(dom, seed)} ${nounOf(dom)}`;
  } else if (items.length === 2) {
    const m = items[1], con = connector(m.w / total);
    body = con === 'meets'
      ? `${epOf(dom, seed)} ${nounOf(dom)} meets ${epOf(m, seed)} ${nounOf(m)}`
      : `${epOf(dom, seed)} ${nounOf(dom)}, ${con} ${nounOf(m)}`;
  } else {
    const mids = items.slice(1, -1).map(nounOf);
    const last = items.at(-1), lastCon = (last.w / total) < 0.15 ? 'a touch of' : 'a little';
    body = `${epOf(dom, seed)} ${nounOf(dom)}, with ${mids.join(', ')} and ${lastCon} ${nounOf(last)}`;
  }
  return { strict, body };
}
