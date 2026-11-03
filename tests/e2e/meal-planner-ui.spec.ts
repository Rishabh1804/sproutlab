import { test, expect, type Page } from '@playwright/test';
declare const KEYS: any; declare let mealPlan: any; declare let _mpSheetState: any; declare let _mpSel: any; declare let foods: any[];

// Meal planner P1b — the Plan section atop Diet → Recipes (spec docs/specs/meal-planner-v1.md
// §4, §6 P1b e2e list; signed-off mock-ups in docs/SURFACE_CATALOG.html). Hermetic (?nosync).
// QA chain canon-cc-008: Ceres (diet.js), core trio (styles.css), Carina (core.js dispatch).

async function openRecipes(page: Page): Promise<void> {
  await page.goto('/index.html?nosync');
  await page.waitForFunction(() => typeof (window as any).mpDispatch === 'function' && Array.isArray((window as any).RECIPES), null, { timeout: 15_000 });
  await page.waitForTimeout(800);   // let boot restore its own tab first
  await page.evaluate(() => {
    localStorage.removeItem(KEYS.mealPlan);
    (window as any).mealPlan = undefined;
    const w = window as any;
    w.switchTab('track'); w.switchTrackSub('diet'); w.switchDietSub(document.querySelector('[data-diet-sub=recipes]'));
  });
  await page.waitForSelector('#dietPlanRoot .mp-strip');
}
const day = (page: Page, offset: number) => page.evaluate((o) => (window as any)._mpAddDays((window as any).today(), o), offset);

test.describe('meal planner UI', () => {
  test.beforeEach(async ({ page }) => { await openRecipes(page); });

  test('the Plan section renders above Suggested: a 7-day strip that fits, and the selected day\'s card', async ({ page }) => {
    const r = await page.evaluate(() => {
      const root = document.getElementById('dietRecipesRoot')!;
      const plan = document.getElementById('dietPlanRoot')!;
      const hero = root.querySelector('.recipe-hero, .recipe-empty')!;
      return { chips: plan.querySelectorAll('.mp-day').length, cards: plan.querySelectorAll('.mp-daycard').length,
        before: !!(plan.compareDocumentPosition(hero) & Node.DOCUMENT_POSITION_FOLLOWING),
        overflow: document.documentElement.scrollWidth > window.innerWidth };
    });
    expect(r).toEqual({ chips: 7, cards: 1, before: true, overflow: false });
  });

  test('plan a meal: the picker offers at most 5 pickable suggestions, a tap adds it, and the sheet stays open for a combo', async ({ page }) => {
    const d = await day(page, 1);
    await page.evaluate((k) => (window as any).mpDispatch('mpOpenPicker', k + '|lunch'), d);
    await page.waitForSelector('#mpSheet.open');
    const offered = await page.locator('#mpPickerList .recipe-row[data-action="mpPick"]').count();
    expect(offered).toBeGreaterThan(0);
    expect(offered).toBeLessThanOrEqual(5);
    await page.locator('#mpPickerList .recipe-row[data-action="mpPick"]').first().click();
    await page.locator('#mpPickerList .recipe-row[data-action="mpPick"]').first().click();   // a second item: a combo
    const r = await page.evaluate((k) => ({ items: (window as any)._mpLiveItems(k, 'lunch').length, open: !!document.querySelector('#mpSheet.open') }), d);
    expect(r).toEqual({ items: 2, open: true });
    await page.locator('#mpSheet [data-action="mpCloseSheet"]').click();
    await page.evaluate((k) => (window as any).mpDispatch('mpSelectDay', k), d);
    expect(await page.locator('#dietPlanRoot .mp-entry').count()).toBe(2);
  });

  test('a free food from search joins the slot; a slot holds at most 3', async ({ page }) => {
    const d = await day(page, 1);
    await page.evaluate((k) => {
      const w = window as any;
      w._mpSetSlot(k, 'snack', [{ kind: 'recipe', id: 'soft-fruit-bowl-quartered' }, { kind: 'food', name: 'pear' }]);
      w.mpDispatch('mpOpenPicker', k + '|snack');
    }, d);
    await page.fill('#mpSheet .mp-search', 'banana');
    await page.locator('#mpPickerList [data-action="mpPickFood"]').first().click();
    const r = await page.evaluate((k) => ({ n: (window as any)._mpLiveItems(k, 'snack').length, full: !!document.querySelector('#mpPickerBody .mp-search') }), d);
    expect(r).toEqual({ n: 3, full: false });
  });

  test('a recipe age-locked on the planned date shows its reason, takes no action, and never makes the top 5', async ({ page }) => {
    const d = await day(page, 1);
    await page.evaluate((k) => (window as any).mpDispatch('mpOpenPicker', k + '|snack'), d);
    const top = await page.locator('#mpPickerList .recipe-row[data-action="mpPick"][data-arg="banana-honey-toast"]').count();
    await page.locator('#mpPickerList [data-action="mpPickerAll"]').click();
    const locked = page.locator('#mpPickerList .mp-locked .recipe-row', { hasText: 'Banana & Honey Toast' });
    await expect(locked).toHaveCount(1);
    expect(top).toBe(0);
    expect(await locked.getAttribute('data-action')).toBeNull();
    expect(await locked.getAttribute('aria-disabled')).toBe('true');
    await expect(locked).toContainText("Can't be planned yet");
  });

  test('Add to plan from a recipe: Add to plan → a day → done, in 3 taps or fewer', async ({ page }) => {
    const id = 'toddler-veg-khichdi';
    await page.evaluate(() => (window as any).expandRecipeRow('toddler-veg-khichdi'));
    await page.locator(`#rdet-c-${id} [data-action="mpAddRecipe"]`).click();          // tap 1
    await page.waitForSelector('#mpSheet.open');
    await page.locator('#mpSheet [data-action="mpAddToDay"]').nth(2).click();           // tap 2
    const d = await day(page, 2);
    const r = await page.evaluate((k) => ({ items: (window as any)._mpLiveItems(k, 'lunch'), sheet: !!document.getElementById('mpSheet') }), d);
    expect(r.items).toEqual([{ kind: 'recipe', id }]);
    expect(r.sheet).toBe(false);
  });

  test('travel day: the card turns peach with Pack for today, the picker narrows to travel recipes, and the dinner gap offers travel lunches', async ({ page }) => {
    const d = await day(page, 1);
    await page.evaluate((k) => {
      const w = window as any;
      w._mpSetSlot(k, 'lunch', [{ kind: 'recipe', id: 'travel-veg-dalia-flask' }]);
      w.mpDispatch('mpSelectDay', k);
    }, d);
    await page.locator('#dietPlanRoot [data-action="mpToggleTravel"]').click();
    await expect(page.locator('#dietPlanRoot .mp-daycard--travel')).toHaveCount(1);
    await expect(page.locator('#dietPlanRoot .mp-pack')).toContainText('1 food flask');
    await expect(page.locator('#dietPlanRoot .mp-cue')).toContainText('still too hot to eat');
    // dinner has no travel recipe: suggestions are add actions (sg-chip), and one plans it
    const sugg = page.locator('#dietPlanRoot .sg-chip[data-action="mpPlanSuggestion"]');
    expect(await sugg.count()).toBeGreaterThan(0);
    await sugg.first().click();
    expect((await page.evaluate((k) => (window as any)._mpLiveItems(k, 'dinner'), d)).length).toBe(1);
    // the picker narrows to travel recipes for the slot
    await page.evaluate((k) => (window as any).mpDispatch('mpOpenPicker', k + '|snack'), d);
    const ids = await page.locator('#mpPickerList .recipe-row[data-action="mpPick"]').evaluateAll(els => els.map(e => e.getAttribute('data-arg')));
    const allTravel = await page.evaluate((list) => list.every((id: string) => !!(window as any).RECIPES_BY_ID[id].travel), ids);
    expect(ids.length).toBeGreaterThan(0);
    expect(allTravel).toBe(true);
  });

  test('Copy day copies the meals (target keeps its travel flag) and Undo restores the target', async ({ page }) => {
    const src = await day(page, 1), dst = await day(page, 2);
    await page.evaluate(([s, t]) => {
      const w = window as any;
      w._mpSetSlot(s, 'breakfast', [{ kind: 'recipe', id: 'ragi-banana-porridge' }]);
      w._mpSetSlot(t, 'dinner', [{ kind: 'food', name: 'banana' }]);
      w._mpSetTravel(t, true);
      w.mpDispatch('mpSelectDay', s);
      w.mpDispatch('mpCopyDay', s);
      w.mpDispatch('mpCopyTo', t);
    }, [src, dst]);
    const after = await page.evaluate((t) => ({ b: (window as any)._mpLiveItems(t, 'breakfast').length, d: (window as any)._mpLiveItems(t, 'dinner').length, travel: (window as any)._mpTravelOn(mealPlan.days[t]) }), dst);
    expect(after).toEqual({ b: 1, d: 0, travel: true });
    expect(await page.locator('#qlToast [data-action="undoLastQL"]').count()).toBe(1);
    await page.evaluate(() => (window as any).undoLastQL());
    const undone = await page.evaluate((t) => ({ b: (window as any)._mpLiveItems(t, 'breakfast').length, d: (window as any)._mpLiveItems(t, 'dinner').length }), dst);
    expect(undone).toEqual({ b: 0, d: 1 });
  });

  test('Clear day confirms with a rose primary, clears the plan, and leaves the diary alone', async ({ page }) => {
    const d = await day(page, 0);
    await page.evaluate((k) => {
      const w = window as any;
      w._mpSetSlot(k, 'lunch', [{ kind: 'recipe', id: 'toddler-veg-khichdi' }]);
      w.mpDispatch('mpSelectDay', k);
    }, d);
    const diaryBefore = await page.evaluate(() => localStorage.getItem(KEYS.feeding));
    await page.locator('#dietPlanRoot [data-action="mpClearDay"]').click();
    await expect(page.locator('.confirm-box #confirmYes')).toHaveClass(/btn-rose/);
    await page.locator('.confirm-box #confirmYes').click();
    const r = await page.evaluate((k) => ({ lunch: (window as any)._mpLiveItems(k, 'lunch').length, diary: localStorage.getItem(KEYS.feeding) }), d);
    expect(r.lunch).toBe(0);
    expect(r.diary).toBe(diaryBefore);
  });

  test('a flagged entry keeps the flag loudest: no filled primary on it, and the flag reads before the meal', async ({ page }) => {
    const d = await day(page, 1);
    await page.evaluate((k) => {
      const w = window as any;
      foods.push({ name: 'Egg', reaction: 'watch', date: w._mpAddDays(w.today(), -10) });
      w._mpSetSlot(k, 'dinner', [{ kind: 'recipe', id: 'soft-egg-curry-rice' }]);
      w.mpDispatch('mpSelectDay', k);
    }, d);
    const slot = page.locator('#dietPlanRoot .mp-slot', { hasText: 'Mild Egg Curry' });
    await expect(slot.locator('.rcp-safe--flag')).toContainText('You marked egg to watch. Talk to her doctor');
    const order = await slot.evaluate(el => { const f = el.querySelector('.rcp-safe--flag')!, e = el.querySelector('.mp-entries')!; return !!(f.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING); });
    expect(order).toBe(true);
    expect(await slot.locator('.btn-sage').count()).toBe(0);
  });

  test('a sync render never redraws under an open planner sheet; it lands when the sheet closes', async ({ page }) => {
    const d = await day(page, 1);
    await page.evaluate((k) => (window as any).mpDispatch('mpOpenPicker', k + '|lunch'), d);
    const r = await page.evaluate((k) => {
      const w = window as any;
      const before = document.getElementById('dietPlanRoot')!.innerHTML;
      w._mpSetSlot(k, 'dinner', [{ kind: 'food', name: 'banana' }]);   // as if the other phone's edit arrived
      w.renderMealPlanSection();
      const during = document.getElementById('dietPlanRoot')!.innerHTML === before;
      w.mpDispatch('mpCloseSheet');
      return { during, sheetState: _mpSheetState };
    }, d);
    expect(r).toEqual({ during: true, sheetState: null });
  });

  test('the high-mercury flag quotes the fish record (drift check)', async ({ page }) => {
    const line = await page.evaluate(() => (window as any)._mpHighMercuryLine());
    expect(line).toMatch(/^high-mercury fish/);
    expect(line).toContain('surmai');
  });

  test('Next names the right meal through the day, and a skipped meal counts as decided (V-V-279-1, V-K-279-2)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any; const t = w.today(); const at = (h: number) => { const d = new Date(); d.setHours(h, 0, 0, 0); return w._mpNextSlot(t, d); };
      const empty = [6, 9, 13, 18, 23].map(at);
      w._mpSetSlot(t, 'breakfast', [{ kind: 'food', name: 'banana' }]);
      const part = [13, 18].map(at);
      return { empty, part };
    });
    expect(r.empty).toEqual(['breakfast', 'breakfast', 'lunch', 'dinner', null]);
    expect(r.part).toEqual(['lunch', 'dinner']);
  });

  test('the safety lead: an established oat stays quiet, a new egg is a caution, a reaction outranks it, and grapes get their own form line', async ({ page }) => {
    const d = await day(page, 1);
    const r = await page.evaluate((k) => {
      const w = window as any;
      const oats = w._mpSlotLead([{ kind: 'food', name: 'oats' }], k);
      const egg = w._mpSlotLead([{ kind: 'food', name: 'egg' }], k);
      const grapes = w._mpSlotLead([{ kind: 'food', name: 'grapes' }], k);
      foods.push({ name: 'Egg', reaction: 'bad', date: w._mpAddDays(w.today(), -3) });
      const react = w._mpSlotLead([{ kind: 'food', name: 'egg' }, { kind: 'food', name: 'grapes' }], k);
      return { oats, egg, grapes, react };
    }, d);
    expect(r.oats).toBeNull();
    expect(r.egg[0]).toBe('caution');
    expect(r.egg[1]).toContain('Egg is a common allergen and new for her');
    expect(r.grapes[1]).toMatch(/^Grapes: QUARTER lengthwise/);
    expect(r.grapes[1]).not.toContain('records');
    expect(r.react[0]).toBe('flag');
    expect(r.react[1]).toMatch(/^You marked egg to watch\. Talk to her doctor before offering it again\. Grapes: QUARTER/);
  });

  test('the safety lead reads right for a boy: new for him, his doctor, not for him (child-sex S2, V-C-282-5)', async ({ page }) => {
    const d = await day(page, 1);
    const r = await page.evaluate((k) => {
      const w = window as any;
      w._profSave(Object.assign({}, (window as any).eval('profile').child, { sex: 'm' }), (window as any).eval('profile').place);
      const egg = w._mpSlotLead([{ kind: 'food', name: 'egg' }], k);
      foods.push({ name: 'Egg', reaction: 'bad', date: w._mpAddDays(w.today(), -3) });
      const react = w._mpSlotLead([{ kind: 'food', name: 'egg' }], k);
      return { egg: egg[1], react: react[1], mercury: w._mpMercuryFlag('surmai') };
    }, d);
    expect(r.egg).toContain('Egg is a common allergen and new for him');
    expect(r.react).toContain('Talk to his doctor before offering it again');
    expect(r.mercury).toMatch(/^Not for him: high-mercury fish/);
    for (const s of [r.egg, r.react, r.mercury]) expect(s).not.toMatch(/\b(she|her)\b/i);
  });

  test('travel day: a non-packing recipe is named in its note, and a packed free food carries none (V-V-279-7)', async ({ page }) => {
    const d = await day(page, 1);
    await page.evaluate((k) => {
      const w = window as any;
      w._mpSetTravel(k, true);
      w._mpSetSlot(k, 'lunch', [{ kind: 'recipe', id: 'travel-veg-dalia-flask' }, { kind: 'food', name: 'banana' }]);
      w._mpSetSlot(k, 'dinner', [{ kind: 'recipe', id: 'sweet-potato-moong-mash' }]);   // not a packing recipe
      w.mpDispatch('mpSelectDay', k);
    }, d);
    const read = () => page.evaluate(() => [...document.querySelectorAll('#dietPlanRoot .mp-gap-note')].map(e => e.textContent || '').filter(n => /not a packing recipe/.test(n)));
    await expect.poll(read).toHaveLength(1);   // the render can land a beat later under load
    const notes = await read();
    expect(notes[0]).toMatch(/^.+: not a packing recipe — serve it fresh where you are\.$/);
    expect(notes[0]).not.toMatch(/Dalia|banana/i);
  });

  test('a recipe she is too young for, all through the plan window, has no Add to plan (V-V-279-5)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const hi = w._mpAgeMonthsOn(w._mpWindow(w.today()).hi);
      const late = w.RECIPES.find((x: any) => w._recipeEffectiveMinAge(x) > hi);
      const ok = w.RECIPES.find((x: any) => w._recipeEffectiveMinAge(x) <= w._mpAgeMonthsOn(w.today()));
      const has = (x: any) => x ? /data-action="mpAddRecipe"/.test(w._recipeDetailHtml(x, w._mpAgeMonthsOn(w.today()))) : null;
      return { late: has(late), ok: has(ok) };
    });
    if (r.late !== null) expect(r.late).toBe(false);
    expect(r.ok).toBe(true);
  });

  test('a planned recipe opens its own recipe card in the slot, with numbered steps (Architect review)', async ({ page }) => {
    await page.evaluate(() => {
      const w = window as any; const t = w.today();
      w._mpSetSlot(t, 'lunch', [{ kind: 'recipe', id: 'toddler-veg-khichdi' }, { kind: 'food', name: 'banana' }]);
      w.renderMealPlanSection();
    });
    const entry = page.locator('#dietPlanRoot .mp-entry--btn', { hasText: 'Toddler Veg Khichdi' });
    await expect(entry).toHaveAttribute('aria-expanded', 'false');
    await entry.click();
    const card = page.locator('#dietPlanRoot .mp-recipe-card');
    await expect(card).toBeVisible();
    await expect(card.locator('.rcp-prow--steps')).toHaveCount(1);
    await expect(card.locator('[data-action="mpAddRecipe"]')).toHaveCount(0);   // already planned: no Add to plan
    const disc = await card.locator('.recipe-steps li').first().evaluate(el => getComputedStyle(el, '::before').content);
    expect(disc).toMatch(/counter/);
  });

  test('chips and planner buttons carry colour on a touch screen; the ghost base style is not hover-only', async ({ page }) => {
    await page.evaluate(() => {
      const w = window as any; w._mpSetSlot(w.today(), 'lunch', [{ kind: 'food', name: 'banana' }]); w.renderMealPlanSection();
    });
    const r = await page.evaluate(() => {
      const chip = document.querySelector('#dietPlanRoot .recipe-chip.fdom-chip--fruits')!;
      const soft = document.querySelector('#dietPlanRoot .btn-soft')!;
      return { chipColor: getComputedStyle(chip).color, chipShadow: getComputedStyle(chip).boxShadow, softBg: getComputedStyle(soft).backgroundColor,
        ghostRuleOutsideHover: [...document.styleSheets].some(ss => { try { return [...ss.cssRules].some((r: any) => r.selectorText === '.btn-ghost' && !(r.parentRule && r.parentRule.media)); } catch { return false; } }) };
    });
    expect(r.chipColor).not.toBe('rgb(61, 44, 46)');
    expect(r.chipShadow).not.toBe('none');
    expect(r.softBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(r.ghostRuleOutsideHover).toBe(true);
  });

  test('an open planner sheet holds the page still, and closing it lets the page scroll again', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      w.mpDispatch('mpOpenPicker', w.today() + '|breakfast');
      const during = document.body.style.overflow;
      w.mpDispatch('mpCloseSheet');
      return { during, after: document.body.style.overflow, contain: getComputedStyle(document.createElement('div')).overscrollBehavior !== undefined };
    });
    expect(r.during).toBe('hidden');
    expect(r.after).toBe('');
  });

  test('the logging screen offers the planned meal; one tap fills the items, nothing is saved until Save', async ({ page }) => {
    await page.evaluate(() => {
      const w = window as any; const t = w.today();
      w._mpSetSlot(t, 'lunch', [{ kind: 'recipe', id: 'toddler-veg-khichdi' }, { kind: 'food', name: 'banana' }]);
      w.openQuickModal('feed');
    });
    await page.locator('#qlMealPills .ql-meal-pill[data-meal="lunch"]').click();
    const chip = page.locator('.fc-planned-chip');
    await expect(chip).toContainText('Toddler Veg Khichdi + Banana');
    const before = await page.evaluate(() => JSON.stringify(((window as any).feedingData || {})[(window as any).today()] || {}));
    await chip.click();
    const r = await page.evaluate(() => ({ items: (window as any)._fcSheetInstance.items.map((i: any) => String(i.name).toLowerCase()), src: (window as any)._fcSheetInstance.items.every((i: any) => i.source === 'plan'),
      day: JSON.stringify(((window as any).feedingData || {})[(window as any).today()] || {}) }));
    expect(r.items).toContain('banana');
    expect(r.items).toContain('rice');
    expect(r.src).toBe(true);
    expect(r.day).toBe(before);   // filled, not saved
    await expect(page.locator('.fc-planned-chip')).toHaveCount(0);   // the rail hides once items are present
  });

  test('a flagged plan entry is shown on the Planned rail and never filled by the tap (V-C-279-12)', async ({ page }) => {
    await page.evaluate(() => {
      const w = window as any; const t = w.today();
      foods.push({ name: 'Banana', reaction: 'watch', date: w._mpAddDays(t, -3) });
      w._mpSetSlot(t, 'lunch', [{ kind: 'recipe', id: 'toddler-veg-khichdi' }, { kind: 'food', name: 'banana' }]);
      w.openQuickModal('feed');
    });
    await page.locator('#qlMealPills .ql-meal-pill[data-meal="lunch"]').click();
    const rail = page.locator('.fc-rail-wrap', { has: page.locator('.fc-planned-chip') });
    await expect(rail.locator('.rcp-safe--flag')).toContainText('You marked banana to watch');
    await expect(rail.locator('.fc-planned-chip')).not.toHaveClass(/primary/);
    await expect(rail).toContainText('Not added with the tap: banana');
    await rail.locator('.fc-planned-chip').click();
    const names = await page.evaluate(() => (window as any)._fcSheetInstance.items.map((i: any) => String(i.name).toLowerCase()));
    expect(names).not.toContain('banana');
    expect(names).toContain('rice');
  });

  test('a meal planned now shows on the Diet log card without a reload (V-V-279-26)', async ({ page }) => {
    await page.evaluate(() => { const w = window as any; w.switchDietSub(document.querySelector('[data-diet-sub=log]')); });
    await page.evaluate(() => { const w = window as any; w.switchDietSub(document.querySelector('[data-diet-sub=recipes]')); });
    await page.evaluate(() => { const w = window as any; w._mpSetSlot(w.today(), 'dinner', [{ kind: 'food', name: 'pear' }]); w.renderMealPlanSection(); });
    await page.evaluate(() => { const w = window as any; w.switchDietSub(document.querySelector('[data-diet-sub=log]')); });
    await expect(page.locator('.fc-card-dinner .fc-planned-chip')).toContainText('Pear');
  });
});
