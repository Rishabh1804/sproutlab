// SproutLab · tagline composer — shared module (design layer).
// Composes a weighted tagline for any food combo from the ratified ingredient bank.
//  • rotating epithets (day-seed) → dynamic without intervention
//  • soft prep-cautions FOLD into the phrase (ground almond / halved grape)
//  • STRICT no's (honey / added sugar / salt) keep a prominent lead clause
//  • minor-share ratio picks the connector → volume shows in the words

// id → { eps:[rotating adjectives], noun, c:icon-colour, fold?:soft-prep, strict?:hard-lead }
// Full database coverage (mirrors the zif icon set). fold = soft prep folded into the
// phrase; strict = hard no surfaced as a leading clause.
export const EP = {
  // grains & cereals
  rice:       {eps:['soft','gentle','silky'],      noun:'rice',         c:'#d8c79f'},
  millet:     {eps:['earthy','iron-rich','nutty'], noun:'ragi',         c:'#b06a44'},
  oats:       {eps:['wholesome','warm','hearty'],  noun:'oats',         c:'#d4bb7c'},
  wheat:      {eps:['hearty','wholesome'],         noun:'wheat',        c:'#d9a945'},
  suji:       {eps:['smooth','light'],             noun:'suji',         c:'#e7dcc2'},
  corn:       {eps:['sweet','sunny'],              noun:'corn',         c:'#ecc84e'},
  dalia:      {eps:['hearty','nutty'],             noun:'dalia',        c:'#d8c0a0'},
  barley:     {eps:['nutty','wholesome'],          noun:'barley',       c:'#d6c486'},
  quinoa:     {eps:['nutty','light'],              noun:'quinoa',       c:'#d2b288'},
  // legumes & pulses
  dal:        {eps:['savoury','soupy','hearty'],   noun:'dal',          c:'#9bb24a'},
  chana:      {eps:['nutty','hearty'],             noun:'chana',        c:'#cda05c'},
  rajma:      {eps:['hearty','earthy'],            noun:'rajma',        c:'#9c4338'},
  peanut:     {eps:['nutty','rich'],               noun:'peanut',       c:'#d9b27a', fold:'ground'},
  sprouts:    {eps:['fresh','green'],              noun:'sprouts',      c:'#86c258'},
  // vegetables
  carrot:     {eps:['sweet','bright','sunny'],     noun:'carrot',       c:'#e8843a'},
  spinach:    {eps:['leafy','green','iron-rich'],  noun:'spinach',      c:'#5a9a42'},
  beans:      {eps:['crisp','green'],              noun:'green beans',  c:'#6aa83f'},
  bottlegourd:{eps:['light','soothing'],           noun:'bottle gourd', c:'#9bbe63'},
  beetroot:   {eps:['earthy','ruby','sweet'],      noun:'beetroot',     c:'#9c3b6b'},
  pumpkin:    {eps:['silky','golden','sweet'],     noun:'pumpkin',      c:'#e2913f'},
  sweetpotato:{eps:['velvety','golden','creamy'],  noun:'sweet potato', c:'#c56b3e'},
  potato:     {eps:['soft','comforting'],          noun:'potato',       c:'#cda36a'},
  broccoli:   {eps:['green','tender'],             noun:'broccoli',     c:'#4f8a3a'},
  cauliflower:{eps:['mild','tender'],              noun:'cauliflower',  c:'#e7e2cf'},
  tomato:     {eps:['tangy','bright'],             noun:'tomato',       c:'#d6473b'},
  pepper:     {eps:['sweet','crisp'],              noun:'bell pepper',  c:'#d23b32'},
  cucumber:   {eps:['cool','crisp'],               noun:'cucumber',     c:'#7bb34a'},
  zucchini:   {eps:['soft','mild'],                noun:'zucchini',     c:'#4f7a3a'},
  peas:       {eps:['sweet','green'],              noun:'peas',         c:'#86c258'},
  onion:      {eps:['sweet','mellow'],             noun:'onion',        c:'#c9a3c0'},
  garlic:     {eps:['aromatic','gentle'],          noun:'garlic',       c:'#ece4d5'},
  ginger:     {eps:['warming','zingy'],            noun:'ginger',       c:'#d6b483'},
  mushroom:   {eps:['earthy','tender'],            noun:'mushroom',     c:'#cdb79a'},
  brinjal:    {eps:['silky','mellow'],             noun:'brinjal',      c:'#7b4a86'},
  okra:       {eps:['tender','green'],             noun:'okra',         c:'#5f9a3f'},
  drumstick:  {eps:['earthy','green'],             noun:'drumstick',    c:'#6aa83f'},
  cabbage:    {eps:['crisp','leafy'],              noun:'cabbage',      c:'#bcd99a'},
  // fruits
  banana:     {eps:['creamy','sweet','soft'],      noun:'banana',       c:'#e9c44a'},
  pear:       {eps:['juicy','gentle'],             noun:'pear',         c:'#bcc758'},
  apple:      {eps:['sweet','stewed','crisp'],     noun:'apple',        c:'#d2473f'},
  mango:      {eps:['golden','silky','sweet'],     noun:'mango',        c:'#f0a83a'},
  avocado:    {eps:['buttery','creamy'],           noun:'avocado',      c:'#5f7f33'},
  blueberry:  {eps:['sweet','jewel-like'],         noun:'blueberry',    c:'#5560a8'},
  strawberry: {eps:['sweet','fragrant'],           noun:'strawberry',   c:'#d63f49'},
  grapes:     {eps:['juicy','sweet'],              noun:'grape',        c:'#7d4f9e', fold:'halved'},
  date:       {eps:['caramel-sweet','rich'],       noun:'date',         c:'#7a4a2c'},
  papaya:     {eps:['soft','sweet'],               noun:'papaya',       c:'#e88a4a'},
  orange:     {eps:['juicy','bright'],             noun:'orange',       c:'#e58a30'},
  pomegranate:{eps:['ruby','jewel-like'],          noun:'pomegranate',  c:'#c23a52'},
  watermelon: {eps:['cool','sweet'],               noun:'watermelon',   c:'#d6473b'},
  kiwi:       {eps:['tangy','bright'],             noun:'kiwi',         c:'#7ba33f'},
  coconut:    {eps:['creamy','rich'],              noun:'coconut',      c:'#9c7a52'},
  apricot:    {eps:['sweet','golden'],             noun:'apricot',      c:'#e8a55a'},
  fig:        {eps:['honeyed','soft'],             noun:'fig',          c:'#8a4f6e'},
  prune:      {eps:['rich','sweet'],               noun:'prune',        c:'#6a4452'},
  raisin:     {eps:['sweet','chewy'],              noun:'raisin',       c:'#7a4a32', fold:'softened'},
  custardapple:{eps:['custardy','sweet'],          noun:'custard apple',c:'#bcd0a0'},
  sapota:     {eps:['malty','sweet'],              noun:'sapota',       c:'#9c7a52'},
  pineapple:  {eps:['tangy','sweet'],              noun:'pineapple',    c:'#ecc24e'},
  peach:      {eps:['soft','sweet'],               noun:'peach',        c:'#f0a87a'},
  plum:       {eps:['tart','sweet'],               noun:'plum',         c:'#8a3a5e'},
  muskmelon:  {eps:['sweet','fragrant'],           noun:'muskmelon',    c:'#dcb96a'},
  guava:      {eps:['fragrant','sweet'],           noun:'guava',        c:'#bcd08a'},
  raspberry:  {eps:['tart','sweet'],               noun:'raspberry',    c:'#c83a5a'},
  cranberry:  {eps:['tart','bright'],              noun:'cranberry',    c:'#c23a3a'},
  lemon:      {eps:['zesty','bright'],             noun:'lemon',        c:'#ecd24e'},
  // dairy & eggs
  paneer:     {eps:['mild','soft','milky'],        noun:'paneer',       c:'#cdbf93'},
  milk:       {eps:['creamy','gentle'],            noun:'milk',         c:'#cdbf93'},
  ghee:       {eps:['rich','golden'],              noun:'ghee',         c:'#e8b94f'},
  curd:       {eps:['cooling','tangy','creamy'],   noun:'curd',         c:'#e4ddcd'},
  cheese:     {eps:['savoury','melty'],            noun:'cheese',       c:'#edc85e'},
  butter:     {eps:['rich','soft'],                noun:'butter',       c:'#f0d480'},
  buttermilk: {eps:['cooling','tangy'],            noun:'buttermilk',   c:'#f1ede2'},
  egg:        {eps:['protein-rich','soft'],        noun:'egg',          c:'#efe6d0', fold:'cooked'},
  // nuts & seeds
  almond:     {eps:['nutty','buttery'],            noun:'almond',       c:'#b9824e', fold:'ground'},
  walnut:     {eps:['earthy','rich'],              noun:'walnut',       c:'#a9743f', fold:'ground'},
  cashew:     {eps:['buttery','mild'],             noun:'cashew',       c:'#e6d6b4', fold:'ground'},
  pistachio:  {eps:['nutty','green'],              noun:'pistachio',    c:'#9bbf5a', fold:'ground'},
  cumin:      {eps:['warm','earthy'],              noun:'cumin',        c:'#9c7548'},
  pumpkinseed:{eps:['nutty','crunchy'],            noun:'pumpkin seed', c:'#8ab04a', fold:'ground'},
  chia:       {eps:['tiny','nutty'],               noun:'chia',         c:'#4a4038', fold:'soaked'},
  flaxseed:   {eps:['nutty','wholesome'],          noun:'flaxseed',     c:'#a5743f', fold:'ground'},
  sesame:     {eps:['nutty','toasty'],             noun:'sesame',       c:'#c8b890', fold:'ground'},
  // proteins
  fish:       {eps:['tender','omega-rich'],        noun:'fish',         c:'#86a6b6', fold:'boneless'},
  chicken:    {eps:['lean','tender'],              noun:'chicken',      c:'#d59a62', fold:'shredded'},
  tofu:       {eps:['silky','mild'],               noun:'tofu',         c:'#f0ece0'},
  prawn:      {eps:['tender','sweet'],             noun:'prawn',        c:'#e89a7a'},
  mutton:     {eps:['rich','tender'],              noun:'mutton',       c:'#c8746a', fold:'soft-cooked'},
  // fats & sweeteners
  jaggery:    {eps:['caramel-sweet'],              noun:'jaggery',      c:'#a5623a', strict:'go easy — added sugar'},
  honey:      {eps:['golden'],                     noun:'honey',        c:'#e8a93a', strict:'honey — only from age 1'},
  oil:        {eps:['light'],                      noun:'oil',          c:'#ecc86a'},
  // spices & herbs
  turmeric:   {eps:['golden','earthy'],            noun:'turmeric',     c:'#e0962e'},
  blackpepper:{eps:['warm','mild'],                noun:'pepper',       c:'#4a4038'},
  cinnamon:   {eps:['warm','sweet'],               noun:'cinnamon',     c:'#a5623a'},
  cardamom:   {eps:['fragrant','warm'],            noun:'cardamom',     c:'#bcc77a'},
  coriander:  {eps:['fresh','herby'],              noun:'coriander',    c:'#5a9a42'},
  mint:       {eps:['cool','fresh'],               noun:'mint',         c:'#5aa05a'},
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
