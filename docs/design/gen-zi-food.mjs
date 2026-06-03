// SproutLab · zi_food generator — emits the approval sheet + a data-grounded coverage map.
// The set is growing; this keeps symbols as data so adding an icon = one entry.
import { writeFileSync } from 'node:fs';

// ── shared accent palette (baked into symbols; flesh stays currentColor) ──────
const ol = 'rgba(74,48,22,.22)', ol2 = 'rgba(74,48,22,.3)', leaf = '#5f9e42', stem = '#7a5a36';

// ── symbols: inner markup, viewBox 0 0 24 24. Flesh = currentColor (consumer-set,
//    variant-ready); natural accents fixed. ────────────────────────────────────
const S = {
rice:`<path d="M3.5 11.5h17c0 4.8-3.8 8.7-8.5 8.7S3.5 16.3 3.5 11.5z" fill="currentColor" stroke="${ol}" stroke-width="1.1" stroke-linejoin="round"/><g fill="#fff" stroke="rgba(74,48,22,.18)" stroke-width=".8"><ellipse cx="9" cy="8.7" rx="1.1" ry="2.2" transform="rotate(-20 9 8.7)"/><ellipse cx="12" cy="7.9" rx="1.1" ry="2.2"/><ellipse cx="15" cy="8.7" rx="1.1" ry="2.2" transform="rotate(20 15 8.7)"/></g>`,
millet:`<path d="M12 21v-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/><g fill="currentColor"><circle cx="12" cy="4.4" r="1.15"/><circle cx="10.1" cy="6" r="1.15"/><circle cx="13.9" cy="6" r="1.15"/><circle cx="9.5" cy="8" r="1.15"/><circle cx="12" cy="7.7" r="1.15"/><circle cx="14.5" cy="8" r="1.15"/><circle cx="10.4" cy="10" r="1.15"/><circle cx="13.6" cy="10" r="1.15"/><circle cx="12" cy="11.5" r="1.15"/></g>`,
oats:`<path d="M12 21V7.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/><g fill="currentColor" stroke="${ol}" stroke-width=".8"><ellipse cx="8.8" cy="7" rx="1.7" ry="2.7" transform="rotate(33 8.8 7)"/><ellipse cx="15.2" cy="7" rx="1.7" ry="2.7" transform="rotate(-33 15.2 7)"/><ellipse cx="8.4" cy="11.5" rx="1.7" ry="2.7" transform="rotate(33 8.4 11.5)"/><ellipse cx="15.6" cy="11.5" rx="1.7" ry="2.7" transform="rotate(-33 15.6 11.5)"/></g>`,
wheat:`<path d="M12 21V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/><g stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M12 5.5L9.5 3.5M12 5.5l2.5-2M12 8.5l-3-1.6M12 8.5l3-1.6"/></g><g fill="currentColor"><ellipse cx="12" cy="4.6" rx="1.3" ry="2.1"/><ellipse cx="9.8" cy="7.2" rx="1.2" ry="2" transform="rotate(-28 9.8 7.2)"/><ellipse cx="14.2" cy="7.2" rx="1.2" ry="2" transform="rotate(28 14.2 7.2)"/><ellipse cx="9.6" cy="10.2" rx="1.2" ry="2" transform="rotate(-28 9.6 10.2)"/><ellipse cx="14.4" cy="10.2" rx="1.2" ry="2" transform="rotate(28 14.4 10.2)"/></g>`,
corn:`<ellipse cx="12" cy="11.5" rx="4.2" ry="7.5" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><g stroke="${ol}" stroke-width=".7" fill="none"><path d="M9.2 6.5c2 .5 3.6.5 5.6 0M8.4 9.5c2.4.6 4.8.6 7.2 0M8.2 12.5c2.5.6 5.1.6 7.6 0M8.6 15.5c2.2.5 4.6.5 6.8 0M12 4.5v14"/></g><path d="M9 17c-2.5.5-4 2-4.5 4 2.5 0 4-1 5-2.5M15 17c2.5.5 4 2 4.5 4-2.5 0-4-1-5-2.5z" fill="${leaf}" stroke="${ol}" stroke-width=".8" stroke-linejoin="round"/>`,
suji:`<path d="M4 12h16c0 4.4-3.6 8-8 8s-8-3.6-8-8z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><g fill="rgba(74,48,22,.28)"><circle cx="9" cy="14" r=".5"/><circle cx="12" cy="13" r=".5"/><circle cx="15" cy="14" r=".5"/><circle cx="10.5" cy="16" r=".5"/><circle cx="13.5" cy="16" r=".5"/></g>`,
// ── legumes ──
dal:`<g fill="currentColor" stroke="${ol}" stroke-width="1"><ellipse cx="8.4" cy="9.8" rx="4.1" ry="2.5" transform="rotate(-12 8.4 9.8)"/><ellipse cx="15.2" cy="11.4" rx="4.1" ry="2.5" transform="rotate(14 15.2 11.4)"/><ellipse cx="11" cy="15" rx="4.1" ry="2.5" transform="rotate(-5 11 15)"/></g>`,
chana:`<g fill="currentColor" stroke="${ol}" stroke-width="1"><circle cx="9" cy="10" r="3.4"/><circle cx="15" cy="11.5" r="3.4"/><circle cx="11.5" cy="15.2" r="3.4"/></g><g fill="rgba(74,48,22,.25)"><circle cx="9" cy="10" r=".5"/><circle cx="15" cy="11.5" r=".5"/><circle cx="11.5" cy="15.2" r=".5"/></g>`,
// refined rajma — clearer kidney-bean curve, two beans
rajma:`<g fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"><path d="M9.5 5.5c-3 0-5.3 2.6-5.3 5.8s2.3 5.8 5.3 5.8c1.1 0 2.2-.4 3-1.1.4-.3.3-.9-.2-1.1-1.3-.6-2.1-1.9-2.1-3.6 0-1.9 1-3.2 1-4.7 0-.6-.2-1-.6-1z"/><path d="M16 8c-2.6 0-4.6 2.2-4.6 5s2 5 4.6 5c.9 0 1.8-.3 2.5-.9.4-.3.3-.8-.1-1-1.1-.5-1.8-1.6-1.8-3 0-1.6.9-2.7.9-4 0-.6-.4-1.1-1.4-1.1z"/></g>`,
sprouts:`<ellipse cx="9" cy="15" rx="3.2" ry="4" fill="currentColor" stroke="${ol}" stroke-width="1" transform="rotate(-12 9 15)"/><ellipse cx="14.5" cy="15.5" rx="3.2" ry="4" fill="currentColor" stroke="${ol}" stroke-width="1" transform="rotate(10 14.5 15.5)"/><path d="M10 12c1.5-2.5 2.5-5 1.5-7M14 12c-.5-2 .5-4 2.5-5" stroke="${leaf}" stroke-width="1.4" stroke-linecap="round" fill="none"/><path d="M11.5 5c1.2-.3 2 .4 2 1.5-1.2.3-2-.4-2-1.5z" fill="${leaf}"/>`,
peanut:`<path d="M12 3.5c-2 0-3.5 1.5-3.5 3.4 0 1.3.7 2.1.7 3.1 0 1-.7 1.8-.7 3.1 0 1.9 1.5 3.4 3.5 3.4s3.5-1.5 3.5-3.4c0-1.3-.7-2.1-.7-3.1 0-1 .7-1.8.7-3.1 0-1.9-1.5-3.4-3.5-3.4z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M9.5 9.5c1.6.7 3.4.7 5 0M9.8 6.5c1.4.5 3 .5 4.4 0M9.8 13.5c1.4.5 3 .5 4.4 0" stroke="${ol}" stroke-width=".7" fill="none"/>`,
// ── vegetables ──
carrot:`<path d="M8.4 8.6L11.5 20c.16.6.84.6 1 0L15.6 8.6c.12-.45-.12-.8-.55-.8H8.95c-.43 0-.67.35-.55.8z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><g fill="${leaf}"><path d="M12 8c-.4-2-1.7-3-3.2-3.2.3 1.9 1.4 3 3.2 3.2z"/><path d="M12 8c.4-2 1.7-3 3.2-3.2-.3 1.9-1.4 3-3.2 3.2z"/><path d="M12 8c0-1.9.05-3.3.05-3.3-1.1.15-1.75 1.8-.05 3.3z"/></g><g stroke="rgba(255,255,255,.5)" stroke-width=".8" stroke-linecap="round"><path d="M10.2 11.5h3.4M10.7 14.5h2.4"/></g>`,
spinach:`<path d="M5 19C5 11.3 11.3 5 19 5c0 7.7-6.3 14-14 14z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><g stroke="rgba(255,255,255,.55)" stroke-width="1" stroke-linecap="round" fill="none"><path d="M6.5 17.5C10 14 13.5 10.5 17 7"/><path d="M11 13l-2 .3M14 10l-1.8.2M9 15l-1.8.3"/></g>`,
pumpkin:`<ellipse cx="12" cy="14.2" rx="8.2" ry="6.3" fill="currentColor" stroke="${ol}" stroke-width="1"/><g stroke="${ol}" stroke-width=".9" fill="none"><path d="M12 8v12.4M8.4 8.7c-1.1 1.7-1.1 9 0 11M15.6 8.7c1.1 1.7 1.1 9 0 11"/></g><path d="M12 8.2c0-2 1-3.1 2.7-3.3" stroke="${stem}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,
broccoli:`<path d="M10.6 12.5h2.8l1.4 6.5c.12.6-.3 1-1 1h-3.6c-.7 0-1.12-.4-1-1z" fill="#7a9a5a" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><g fill="currentColor" stroke="rgba(74,48,22,.18)" stroke-width=".9"><circle cx="8.4" cy="8" r="3"/><circle cx="12.6" cy="6.4" r="3.3"/><circle cx="15.8" cy="9" r="2.9"/><circle cx="11.4" cy="10.3" r="3"/></g>`,
cauliflower:`<path d="M10.6 12.5h2.8l1.2 6.5c.12.6-.3 1-1 1h-3.2c-.7 0-1.12-.4-1-1z" fill="#e7e2cf" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M6 13c-2-1-2.5-3-1.5-4.5 1.5 0 2.7 1 3 2.5M18 13c2-1 2.5-3 1.5-4.5-1.5 0-2.7 1-3 2.5z" fill="${leaf}" stroke="${ol}" stroke-width=".8" stroke-linejoin="round"/><g fill="currentColor" stroke="rgba(74,48,22,.18)" stroke-width=".9"><circle cx="8.4" cy="8" r="3"/><circle cx="12.6" cy="6.4" r="3.3"/><circle cx="15.8" cy="9" r="2.9"/><circle cx="11.4" cy="10.3" r="3"/></g>`,
tomato:`<circle cx="12" cy="14" r="6.6" fill="currentColor" stroke="${ol}" stroke-width="1"/><g fill="${leaf}"><path d="M12 8.2c0-1.8-1-2.6-1-2.6-.3 1.5.2 2.3 1 2.6zM12 8.2c0-1.8 1-2.6 1-2.6.3 1.5-.2 2.3-1 2.6zM12 8.2l-2.4-1.5c-.3 1.4.9 1.9 2.4 1.5zM12 8.2l2.4-1.5c.3 1.4-.9 1.9-2.4 1.5z"/><rect x="11.4" y="4.8" width="1.2" height="2.6" rx=".6"/></g><ellipse cx="9.5" cy="11.6" rx="1.6" ry="1" fill="rgba(255,255,255,.4)" transform="rotate(-35 9.5 11.6)"/>`,
pepper:`<path d="M7 9.5c0-1.5 1.3-2.5 2.5-2 .8-.8 2.2-.8 3 0 1.2-.6 2.5.4 2.5 2 1.5.5 2.5 2.3 2.5 4.5 0 3.5-2.2 6.5-5 6.5s-5-3-5-6.5c0-2.2 1-4 2.5-4.5z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M12 8V5.4" stroke="${leaf}" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M10.4 6c1-1 2.6-1 3.3-.2" stroke="${leaf}" stroke-width="1.6" stroke-linecap="round" fill="none"/><ellipse cx="9.7" cy="13" rx="1.3" ry="2.4" fill="rgba(255,255,255,.3)"/>`,
sweetpotato:`<path d="M5.6 13.8c-1.6-3 .8-7 4.9-7.8 4.9-1 8.8 1 8.8 4.4 0 4.3-5.1 7.5-9.4 7.5-1.9 0-3.4-1.5-4.3-4.1z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><g stroke="${ol2}" stroke-width="1" stroke-linecap="round"><path d="M6 7l-1.4-1.2M19 11.2l1.6-.4"/></g><g fill="rgba(74,48,22,.22)"><circle cx="10" cy="11" r=".5"/><circle cx="14" cy="12.5" r=".5"/></g>`,
potato:`<ellipse cx="12" cy="13" rx="8" ry="6" fill="currentColor" stroke="${ol}" stroke-width="1" transform="rotate(-12 12 13)"/><g fill="rgba(74,48,22,.3)"><circle cx="9" cy="11" r=".6"/><circle cx="13" cy="10" r=".6"/><circle cx="14.5" cy="14" r=".6"/><circle cx="10" cy="15" r=".6"/></g>`,
// refined peas — open pod, three clear peas
peas:`<path d="M3.5 11c4.5-2 9.5-1.5 16 2.5-1 1.8-2.6 2.8-4.5 3-3.5.3-7-.8-9.5-2.8-1.5-1.2-2.2-1.8-2-2.7z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><g fill="rgba(255,255,255,.55)" stroke="${ol}" stroke-width=".7"><circle cx="7.5" cy="12" r="1.8"/><circle cx="11.5" cy="13.2" r="1.8"/><circle cx="15.5" cy="14.2" r="1.8"/></g>`,
beans:`<g stroke="currentColor" stroke-width="3.4" stroke-linecap="round" fill="none"><path d="M5 8.5C9.5 9.5 14.5 14 18 19.5"/><path d="M8 6.5C12.5 7.5 17 12 19.5 17"/></g><g fill="rgba(74,48,22,.25)"><circle cx="9" cy="11.5" r=".5"/><circle cx="12" cy="14" r=".5"/><circle cx="13" cy="10.5" r=".5"/></g>`,
bottlegourd:`<path d="M12 4c-1.2 0-2 .8-1.8 2 .1.6.5 1 .5 1.6 0 1-1 1.6-1.6 2.6-1.5 2.4-1.6 6 .4 8.4C9.3 19.6 10.6 20 12 20s2.7-.4 3.5-1.4c2-2.4 1.9-6 .4-8.4-.6-1-1.6-1.6-1.6-2.6 0-.6.4-1 .5-1.6.2-1.2-.6-2-1.8-2z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M12 4V2.6" stroke="${stem}" stroke-width="1.4" stroke-linecap="round" fill="none"/>`,
beetroot:`<path d="M12 8.5c-3.3 0-5.3 2.4-5.3 4.7 0 1.7 1 3.2 2.3 4.4l3 2.6 3-2.6c1.3-1.2 2.3-2.7 2.3-4.4 0-2.3-2-4.7-5.3-4.7z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M12 20.2c.5 1 .5 1.8.5 2.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/><g fill="${leaf}"><path d="M10 8c-1-2.5-.5-4.5.5-5.5 1 1.5 1.2 3.5.5 5.5zM13.5 8c1.2-2.3 2.8-3.3 4-3.3-.3 2.3-1.8 3.5-4 3.3z"/></g><path d="M11.5 8V4" stroke="${leaf}" stroke-width="1.3" stroke-linecap="round" fill="none"/>`,
cucumber:`<rect x="3.5" y="9" width="17" height="6" rx="3" fill="currentColor" stroke="${ol}" stroke-width="1" transform="rotate(38 12 12)"/><g stroke="rgba(255,255,255,.4)" stroke-width=".7" fill="none" transform="rotate(38 12 12)"><path d="M7 10.5v3M10 10v4M13 10v4M16 10.5v3"/></g>`,
zucchini:`<rect x="3.5" y="9.5" width="16" height="5.4" rx="2.7" fill="currentColor" stroke="${ol}" stroke-width="1" transform="rotate(38 12 12)"/><path d="M17 6.5l1.5-1.5" stroke="${stem}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,
onion:`<path d="M12 7c-3.5 0-6 2.8-6 6.2C6 17 8.7 20 12 20s6-3 6-6.8C18 9.8 15.5 7 12 7z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><g stroke="${ol}" stroke-width=".7" fill="none"><path d="M9 13c0 3 1 5.5 3 6.8M15 13c0 3-1 5.5-3 6.8"/></g><path d="M12 7c0-1.5-.8-2.5-2-3M12 7c0-1.5.8-2.5 2-3M12 7V3.5" stroke="${leaf}" stroke-width="1.3" stroke-linecap="round" fill="none"/>`,
garlic:`<path d="M12 6.5c-1 0-1.5.8-1.3 1.8-1.8 1-3 3-3 5.5 0 3.4 1.9 6.2 4.3 6.2s4.3-2.8 4.3-6.2c0-2.5-1.2-4.5-3-5.5.2-1-.3-1.8-1.3-1.8z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M12 8.5v11.3M9 10c-.5 3-.3 7 1 9.5M15 10c.5 3 .3 7-1 9.5" stroke="${ol}" stroke-width=".7" fill="none"/><path d="M12 6.5c0-1 .6-1.8 1.6-2" stroke="${stem}" stroke-width="1.2" stroke-linecap="round" fill="none"/>`,
ginger:`<path d="M4.5 12.5c-.3-1.6 1-3 2.6-2.8.4-1.4 2-2 3.3-1.2 1-1 2.7-.9 3.4.4 1.6-.4 3 .9 2.8 2.5 1.3.6 1.7 2.2.9 3.4.7 1.4-.2 3-1.7 3.1-.3 1.5-2 2.2-3.3 1.4-1 1-2.7.7-3.3-.6-1.5.3-2.9-.9-2.7-2.4-1.4-.4-2.1-1.9-1.3-3.2-.5-.5-.7-1.2-.4-1.8z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><g stroke="${ol}" stroke-width=".6" fill="none"><path d="M9 11c1 1 1.5 3 1 4.5M14 10.5c-.5 1.5 0 3.5 1 4.5"/></g>`,
mushroom:`<path d="M4.5 12.5c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7c0 .6-.5 1-1.1 1H5.6c-.6 0-1.1-.4-1.1-1z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M9.5 13.5v3.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5v-3.5z" fill="#ede4d2" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><g fill="rgba(255,255,255,.45)"><circle cx="9" cy="9.5" r=".9"/><circle cx="14" cy="8.8" r=".7"/><circle cx="12" cy="10.5" r=".6"/></g>`,
// ── fruits ──
banana:`<path d="M4 7c1 6.8 6.3 11.8 13.4 11.8 1.1 0 1.9-.5 1.9-1.4 0-.7-.6-1-1.3-1.1C12 15.7 8.1 11 7.3 6.2 7.1 5.4 6.6 5 5.8 5 4.8 5 3.9 5.8 4 7z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M4.9 5.6c.3-.5.9-.8 1.5-.6" stroke="${stem}" stroke-width="1.4" stroke-linecap="round" fill="none"/><circle cx="18.6" cy="17" r="1" fill="${stem}"/>`,
pear:`<path d="M12 5.6c-1 0-1.6 1-1.3 2.2-.2.2-1.7 1.1-2.2 3.2-.6 2.5.3 5.8 1.6 7.5 1 1.4 3 1.4 4 0 1.3-1.7 2.2-5 1.6-7.5-.5-2.1-2-3-2.2-3.2.3-1.2-.3-2.2-1.3-2.2z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M12 5.6V3.8" stroke="${stem}" stroke-width="1.4" stroke-linecap="round" fill="none"/><path d="M12 5c1-1.5 2.6-1.7 3.5-1.4-.2 1.6-1.7 2.1-3.5 1.4z" fill="${leaf}"/>`,
apple:`<path d="M12 7.5c-1.3-1-3-1.3-4.5-.6C5.5 7.8 4.5 10 4.8 12.5c.4 3.5 2.7 7 4.7 7.5 1 .3 1.7-.3 2.5-.3s1.5.6 2.5.3c2-.5 4.3-4 4.7-7.5.3-2.5-.7-4.7-2.7-5.6-1.5-.7-3.2-.4-4.5.6z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M12 7.5V4.5" stroke="${stem}" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M12 6c1-2 3-2.3 4-2-.2 2-2 2.6-4 2z" fill="${leaf}"/><ellipse cx="8.8" cy="11.5" rx="1.3" ry="2.2" fill="rgba(255,255,255,.35)" transform="rotate(-20 8.8 11.5)"/>`,
mango:`<path d="M14 5.5c3 0 5.5 2.8 5.5 6.5 0 4.5-3.5 8-7.5 8s-7-2.8-6-6.5C7 9 10 5.5 14 5.5z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M14 5.5c0-1 .8-1.8 2-2" stroke="${leaf}" stroke-width="1.5" stroke-linecap="round" fill="none"/><ellipse cx="11" cy="11" rx="1.5" ry="2.4" fill="rgba(255,255,255,.3)" transform="rotate(-25 11 11)"/>`,
avocado:`<path d="M12 3.4c3.7 0 5.8 4.1 5.8 9 0 4.9-2.9 8.4-5.8 8.4S6.2 17.3 6.2 12.4c0-4.9 2.1-9 5.8-9z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M12 6.2c2.4 0 3.7 3 3.7 6.4 0 3.5-1.9 6-3.7 6s-3.7-2.5-3.7-6c0-3.4 1.3-6.4 3.7-6.4z" fill="#d3e3a3"/><circle cx="12" cy="14" r="2.7" fill="#9a6b3f"/>`,
blueberry:`<g fill="currentColor" stroke="${ol}" stroke-width="1"><circle cx="8.5" cy="13" r="4"/><circle cx="15.5" cy="13" r="4"/><circle cx="12" cy="9.8" r="4"/></g><g stroke="rgba(255,255,255,.6)" stroke-width=".8" stroke-linecap="round" fill="none"><path d="M12 9.8l-1.1-1M12 9.8l1.1-1M12 9.8V8.3"/></g>`,
strawberry:`<path d="M12 20.5c-3-1.5-6.5-5-6.5-9 0-1.8 1.5-2.8 3-2.5 1-.8 2-1.2 3.5-1.2s2.5.4 3.5 1.2c1.5-.3 3 .7 3 2.5 0 4-3.5 7.5-6.5 9z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><g fill="${leaf}"><path d="M12 8c-1.2-1.2-2.6-1.5-4-1 .8 1.4 2.2 1.8 4 1zM12 8c1.2-1.2 2.6-1.5 4-1-.8 1.4-2.2 1.8-4 1z"/><rect x="11.4" y="5.2" width="1.2" height="2.8" rx=".6"/></g><g fill="rgba(255,255,255,.65)"><circle cx="10" cy="12" r=".5"/><circle cx="13.5" cy="12.5" r=".5"/><circle cx="12" cy="14.5" r=".5"/><circle cx="9.5" cy="15" r=".5"/><circle cx="14" cy="15.5" r=".5"/></g>`,
grapes:`<path d="M12 5.5V8" stroke="${stem}" stroke-width="1.3" stroke-linecap="round" fill="none"/><path d="M12 6c1-1.3 2.6-1.5 3.6-1-.2 1.6-1.8 2.1-3.6 1z" fill="${leaf}"/><g fill="currentColor" stroke="${ol}" stroke-width=".8"><circle cx="9.5" cy="11" r="2"/><circle cx="14.5" cy="11" r="2"/><circle cx="12" cy="12.5" r="2"/><circle cx="8.5" cy="14.5" r="2"/><circle cx="15.5" cy="14.5" r="2"/><circle cx="11" cy="15.5" r="2"/><circle cx="13.5" cy="16.5" r="2"/><circle cx="12" cy="19" r="2"/></g>`,
date:`<ellipse cx="12" cy="12.5" rx="3.8" ry="7.4" fill="currentColor" stroke="${ol}" stroke-width="1"/><g stroke="rgba(255,255,255,.3)" stroke-width=".7" fill="none"><path d="M12 5.5v14M10 6.5c-.7 4-.7 8 0 11M14 6.5c.7 4 .7 8 0 11"/></g><ellipse cx="12" cy="5.4" rx="1.3" ry=".8" fill="${stem}"/>`,
papaya:`<path d="M4 10.5c0-2.2 3.6-4 8-4s8 1.8 8 4c0 4.2-3.6 9-8 9s-8-4.8-8-9z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><g fill="rgba(74,48,22,.55)"><circle cx="10" cy="11.5" r=".8"/><circle cx="13.5" cy="11" r=".8"/><circle cx="12" cy="13.5" r=".8"/><circle cx="9.5" cy="14" r=".8"/><circle cx="14" cy="14" r=".8"/><circle cx="11.5" cy="15.8" r=".8"/></g>`,
orange:`<circle cx="12" cy="13" r="7" fill="currentColor" stroke="${ol}" stroke-width="1"/><g stroke="rgba(255,255,255,.4)" stroke-width=".8" fill="none"><path d="M12 13V6M12 13l6 3.5M12 13l-6 3.5M12 13l6-3.5M12 13l-6-3.5M12 13v7"/></g><circle cx="12" cy="6" r="1" fill="${stem}"/><path d="M12.5 6c1-1 2.4-1 3-.4-.4 1.2-1.8 1.4-3 .4z" fill="${leaf}"/>`,
pomegranate:`<circle cx="12" cy="14" r="6.6" fill="currentColor" stroke="${ol}" stroke-width="1"/><path d="M12 7.4l-1.6-2.4 1.6 1.2 1.6-1.2-1.6 2.4z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M9.8 5.5l2.2 1.9 2.2-1.9" stroke="${ol}" stroke-width="1" fill="none"/><g fill="rgba(255,255,255,.55)"><circle cx="10" cy="13" r=".7"/><circle cx="13.5" cy="12.5" r=".7"/><circle cx="12" cy="15" r=".7"/><circle cx="14.5" cy="15" r=".7"/><circle cx="9.5" cy="15.5" r=".7"/></g>`,
watermelon:`<path d="M3.5 16C9 19 15 19 20.5 16L12 4z" fill="${leaf}" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M5.5 15.3C9.7 17.4 14.3 17.4 18.5 15.3L12 6.8z" fill="currentColor"/><g fill="rgba(74,48,22,.6)"><circle cx="12" cy="12" r=".6"/><circle cx="10" cy="14" r=".6"/><circle cx="14" cy="14" r=".6"/><circle cx="12" cy="15.2" r=".6"/></g>`,
kiwi:`<circle cx="12" cy="13" r="7" fill="#8a6a3a" stroke="${ol}" stroke-width="1"/><circle cx="12" cy="13" r="5.4" fill="currentColor"/><circle cx="12" cy="13" r="1.4" fill="rgba(255,255,255,.7)"/><g fill="rgba(74,48,22,.5)"><circle cx="12" cy="9" r=".5"/><circle cx="15.5" cy="11" r=".5"/><circle cx="15" cy="15" r=".5"/><circle cx="12" cy="17" r=".5"/><circle cx="9" cy="15" r=".5"/><circle cx="8.5" cy="11" r=".5"/></g>`,
coconut:`<circle cx="12" cy="13" r="7.2" fill="currentColor" stroke="${ol}" stroke-width="1"/><g stroke="${ol2}" stroke-width=".7" fill="none"><path d="M6 11c3-1 9-1 12 0M5.5 14c3.5-1 9.5-1 13 0M8 17.5c2.5-.7 5.5-.7 8 0"/></g><g fill="rgba(74,48,22,.5)"><circle cx="10" cy="8.5" r=".8"/><circle cx="14" cy="8.5" r=".8"/><circle cx="12" cy="10" r=".8"/></g>`,
// ── dairy & eggs ──
paneer:`<path d="M12 3.5l7.5 3.8v9L12 20l-7.5-3.7v-9z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M4.5 7.3L12 11l7.5-3.7M12 11v9" stroke="${ol}" stroke-width="1" fill="none" stroke-linejoin="round"/>`,
milk:`<path d="M8 7h8l-.7 11.5c-.07 1.1-1 2-2.1 2h-2.4c-1.1 0-2-.9-2.1-2z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M9 4.5h6V7H9z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M8.3 11h7.4" stroke="${ol}" stroke-width="1" fill="none"/>`,
ghee:`<path d="M5.5 9h13v8a3 3 0 01-3 3H8.5a3 3 0 01-3-3z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><rect x="4.5" y="6.4" width="15" height="2.6" rx="1.2" fill="currentColor" stroke="${ol}" stroke-width="1"/><path d="M10.5 12.5c0 1.2 2 1.8 2 3.2" stroke="rgba(255,255,255,.5)" stroke-width="1" stroke-linecap="round" fill="none"/>`,
curd:`<path d="M4 12h16c0 4.4-3.6 8-8 8s-8-3.6-8-8z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4z" fill="#fff" stroke="rgba(74,48,22,.18)" stroke-width=".9" stroke-linejoin="round"/>`,
cheese:`<path d="M4 18V13l15-4c.6 2 1 4.5 1 9H4z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M4 13l15-4" stroke="${ol}" stroke-width="1" fill="none"/><g fill="rgba(74,48,22,.25)"><circle cx="9" cy="16" r="1.1"/><circle cx="14" cy="15.5" r="1"/><circle cx="16.5" cy="13" r=".8"/></g>`,
butter:`<path d="M4 14l4-3h9a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 01-2-2z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M4 14l4-3M8 11v8" stroke="${ol}" stroke-width="1" fill="none"/>`,
egg:`<ellipse cx="12" cy="13.5" rx="6" ry="8" fill="currentColor" stroke="${ol}" stroke-width="1"/><circle cx="12" cy="14.5" r="2.7" fill="#f4b740"/>`,
// ── nuts & seeds ──
almond:`<path d="M12 3.5c3.8 1.9 5.9 5.6 5.9 9.4 0 3.7-2.3 6.7-5.9 7.8-3.6-1.1-5.9-4.1-5.9-7.8 0-3.8 2.1-7.5 5.9-9.4z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M12 5.5v13.5" stroke="${ol2}" stroke-width=".9" fill="none"/>`,
walnut:`<circle cx="12" cy="12.5" r="8" fill="currentColor" stroke="${ol}" stroke-width="1"/><g stroke="${ol2}" stroke-width="1" fill="none" stroke-linecap="round"><path d="M12 4.5v16M8 6c-2 3-2 9 0 13M16 6c2 3 2 9 0 13M9 9c1 1 1 6 0 7M15 9c-1 1-1 6 0 7"/></g>`,
cashew:`<path d="M15.5 4.5c-1.2 0-2 .8-2.2 1.9-.9 1.7-2.6 2.7-2.6 4.8 0 1.7-1.5 2.6-3 2.8-1.4.2-2.7 1.2-2.7 2.8 0 1.6 1.3 2.9 2.9 2.9 3.6 0 6.5-2.9 6.5-6.5 0-1.6-.6-2.4-.6-3.4 0-1.3 1-2 1-3.3 0-1.5-1-2.7-2.8-2.7z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/>`,
cumin:`<g fill="currentColor" stroke="${ol}" stroke-width=".6"><path d="M8 7c1.5 1 2 3 1.5 5.5" stroke-width="1.6" stroke-linecap="round" fill="none"/><path d="M12 6c1.2 1.2 1.5 3.3.8 5.8" stroke-width="1.6" stroke-linecap="round" fill="none"/><path d="M16 7.5c1 1.3 1 3.4 0 5.7" stroke-width="1.6" stroke-linecap="round" fill="none"/><path d="M9.5 14c1.5 1 2 3 1.5 5" stroke-width="1.6" stroke-linecap="round" fill="none"/><path d="M14 13.5c1.2 1.2 1.3 3.3.6 5.3" stroke-width="1.6" stroke-linecap="round" fill="none"/></g>`,
// ── proteins ──
fish:`<path d="M3 12c3-4.2 8-5.2 12-5.2-1 1.6-1 3.6 0 5.2 1 1.6 1 3.6 0 5.2-4 0-9-1-12-5.2z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M15 6.8l5-2v14.4l-5-2" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><circle cx="6.3" cy="10.8" r="1" fill="#fff"/><circle cx="6.3" cy="10.8" r=".45" fill="rgba(74,48,22,.7)"/><path d="M9 12h4" stroke="rgba(255,255,255,.45)" stroke-width="1" stroke-linecap="round" fill="none"/>`,
chicken:`<path d="M15.5 4.5a5 5 0 00-7.2 6.8l.6.7-3.4 3.4a2 2 0 102.8 2.8l3.4-3.4.7.6a5 5 0 003.1-10.9z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M6.2 15.5l-1.6 1.6M8 17.3l-1.6 1.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,
tofu:`<path d="M12 3.5l7.5 3.8v9L12 20l-7.5-3.7v-9z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M4.5 7.3L12 11l7.5-3.7M12 11v9" stroke="${ol}" stroke-width="1" fill="none" stroke-linejoin="round"/>`,
// ── fats & sweeteners ──
jaggery:`<path d="M6 13c0-3.3 2.7-6 6-6s6 2.7 6 6z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M5.5 13h13v3.5a1.5 1.5 0 01-1.5 1.5H7a1.5 1.5 0 01-1.5-1.5z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M5.5 13h13" stroke="${ol}" stroke-width="1" fill="none"/>`,
honey:`<path d="M7 5h10v2l-1.5 1.5v3L17 14v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4l1.5-2.5v-3L7 7z" fill="currentColor" stroke="${ol}" stroke-width="1" stroke-linejoin="round"/><path d="M9 15h6" stroke="rgba(74,48,22,.25)" stroke-width="1" fill="none"/>`,
};

// ── category layout: which foods show, in what group, with what colour ────────
const CATS = [
  ['Grains & Cereals', [
    ['rice','rice','#e6d9bd'],['millet','ragi / millet','#b06a44'],['oats','oats','#d4bb7c'],
    ['wheat','wheat','#d9a945'],['suji','suji / poha','#e7dcc2'],['corn','corn','#ecc84e'],
  ]],
  ['Legumes & Pulses', [
    ['dal','toor dal','#e8bd4e'],['dal','moong dal','#9bb24a','v'],['dal','masoor dal','#d98a55','v'],
    ['chana','chana','#cda05c'],['rajma','rajma','#9c4338'],['peanut','peanut','#d9b27a'],['sprouts','sprouts','#bcd089'],
  ]],
  ['Vegetables', [
    ['carrot','carrot','#e8843a'],['carrot','carrot purple','#8a4fa0','v'],['spinach','spinach','#5a9a42'],
    ['beans','green beans','#6aa83f'],['bottlegourd','bottle gourd','#9bbe63'],['beetroot','beetroot','#9c3b6b'],
    ['pumpkin','pumpkin','#e2913f'],['sweetpotato','sweet potato','#c56b3e'],['potato','potato','#cda36a'],
    ['broccoli','broccoli','#4f8a3a'],['cauliflower','cauliflower','#ece2c9'],['tomato','tomato','#d6473b'],
    ['pepper','bell pepper','#d23b32'],['pepper','pepper yellow','#ecc23e','v'],['pepper','pepper green','#5b9a3f','v'],
    ['cucumber','cucumber','#7bb34a'],['zucchini','zucchini','#4f7a3a'],['peas','peas','#86c258'],
    ['onion','onion','#c9a3c0'],['garlic','garlic','#ece4d5'],['ginger','ginger','#d6b483'],['mushroom','mushroom','#cdb79a'],
  ]],
  ['Fruits', [
    ['banana','banana','#e9c44a'],['pear','pear','#bcc758'],['apple','apple','#d2473f'],['mango','mango','#f0a83a'],
    ['avocado','avocado','#5f7f33'],['blueberry','blueberry','#5560a8'],['strawberry','strawberry','#d63f49'],
    ['grapes','grapes','#7d4f9e'],['date','date','#7a4a2c'],['papaya','papaya','#e88a4a'],['orange','orange','#e58a30'],
    ['pomegranate','pomegranate','#c23a52'],['watermelon','watermelon','#d6473b'],['kiwi','kiwi','#7ba33f'],['coconut','coconut','#9c7a52'],
  ]],
  ['Dairy & Eggs', [
    ['paneer','paneer','#ece2c9'],['milk','milk','#f1eee4'],['ghee','ghee','#e8b94f'],['curd','curd / yogurt','#e4ddcd'],
    ['cheese','cheese','#edc85e'],['butter','butter','#f0d480'],['egg','egg','#efe6d0'],
  ]],
  ['Nuts & Seeds', [
    ['almond','almond','#b9824e'],['walnut','walnut','#a9743f'],['cashew','cashew','#e6d6b4'],['cumin','cumin / jeera','#9c7548'],
  ]],
  ['Proteins', [
    ['fish','fish','#86a6b6'],['chicken','chicken','#d59a62'],['tofu','tofu','#f0ece0','v'],
  ]],
  ['Fats & Sweeteners', [
    ['jaggery','jaggery','#a5623a'],['honey','honey','#e8a93a'],
  ]],
];

// ── emit symbols actually referenced ──
const used = [...new Set(CATS.flatMap(([,items]) => items.map(it => it[0])))];
const symbols = used.map(id => `<symbol id="zif-${id}" viewBox="0 0 24 24">${S[id]}</symbol>`).join('\n');

let nBase = used.length, nCells = CATS.reduce((a,[,it]) => a+it.length, 0), nVar = nCells - CATS.reduce((a,[,it])=>a+new Set(it.map(x=>x[0]+x[2])).size,0);
const cell = ([id,label,color,v]) =>
  `<div class="cell${v?' var':''}" style="--c:${color}"><svg class="zi" style="color:${color}"><use href="#zif-${id}"/></svg><span class="nm">${label}${v?'<br><i>(variant)</i>':''}</span></div>`;
const sections = CATS.map(([title,items]) => `
  <section><div class="ghead"><h2>${title}</h2><span class="cnt">${items.length}</span></div>
  <div class="grid">${items.map(cell).join('')}</div></section>`).join('\n');

const html = `<!DOCTYPE html>
<!-- SproutLab · zi_food sheet (generated by gen-zi-food.mjs). Flesh=currentColor; accents baked. -->
<html lang="en" data-zoom="default"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Nunito:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../split/styles.css">
<style>
  html,body{background:#efe7df;margin:0;}body{font-family:'Nunito',sans-serif;padding:30px 34px;color:var(--text);}
  h1{font-family:'Fraunces',serif;font-size:28px;font-weight:600;margin:0 0 2px;}
  .lead{font-size:13px;color:var(--mid);margin:0 0 22px;max-width:720px;}
  section{margin:0 0 20px;}
  .ghead{display:flex;align-items:baseline;gap:9px;border-bottom:1.5px solid var(--card-border);padding-bottom:5px;margin-bottom:11px;}
  h2{font-family:'Fraunces',serif;font-size:16px;font-weight:600;margin:0;}.cnt{font-size:11px;font-weight:800;color:var(--light);}
  .grid{display:grid;grid-template-columns:repeat(8,1fr);gap:10px;max-width:880px;}
  .cell{background:#fbf7f1;border:1px solid var(--card-border);border-radius:14px;padding:13px 4px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;}
  .cell .zi{width:34px;height:34px;}.nm{font-size:10px;font-weight:700;color:var(--mid);text-align:center;line-height:1.15;}
  .cell.var{background:#fff;border-style:dashed;}.cell i{font-weight:600;color:var(--light);font-style:normal;font-size:9px;}
  .legend{margin:14px 0 4px;font-size:12px;color:var(--light);max-width:760px;}
</style></head><body>
<svg style="display:none">${symbols}</svg>
<h1>zi_food — real-colour ingredients</h1>
<p class="lead">Flesh uses <code>currentColor</code> (consumer-set → one symbol, many variants — dashed cells); natural accents baked in. Flat-fill + warm outline. Organised by category, matching the <code>zi</code> inventory scheme. Namespace <code>zif-*</code>. <b>Growing set — not final.</b></p>
${sections}
<p class="legend"><b>${nBase} base symbols → ${nCells} cells</b> across 8 categories. Whites/creams carry a warm outline to read on light surfaces. See <code>zi-food-coverage.html</code> for the full ingredient roadmap.</p>
</body></html>`;

writeFileSync('docs/design/zi-food-sheet.html', html);
console.error(`wrote zi-food-sheet.html — ${nBase} symbols, ${nCells} cells`);
