import type { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Pin "today" relative to the fixture child's date of birth (PC-6).
//
// The fixture child (storage.json) has a fixed DOB, so her age grows with the wall clock. A spec
// whose premise is an age ("between the 6-month nut floor and the 12-month honey ceiling") passes
// until she outgrows it, then fails with no change to the app. Such a spec pins the clock to the
// age it is about, instead of reading the real date.
//
// Only Date is fixed (page.clock.setFixedTime); timers keep running, so app boot and waits behave
// as usual. Call it BEFORE page.goto so the app never sees the real date.

// The fixture DOB as a local-time Date (HR-12: built from parts, never parsed as a UTC date-only string).
export function fixtureDob(): Date {
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'storage.json'), 'utf8'));
  const entries: { name: string; value: string }[] = fixture.origins[0].localStorage;
  const profile = JSON.parse(entries.find((e) => e.name === 'ziva_profile')!.value);
  const m = String(profile.child.dob).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) throw new Error('fixture DOB is not YYYY-MM-DD…: ' + profile.child.dob);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

// The local date on which the fixture child has completed `months` months, plus `days` more.
// The default 10 days keeps the age clear of a month boundary; the time is mid-morning.
export function dateAtAge(months: number, days = 10): Date {
  const dob = fixtureDob();
  return new Date(dob.getFullYear(), dob.getMonth() + months, dob.getDate() + days, 10, 0, 0);
}

export async function pinAgeMonths(page: Page, months: number, days = 10): Promise<Date> {
  const at = dateAtAge(months, days);
  await page.clock.setFixedTime(at);
  return at;
}
