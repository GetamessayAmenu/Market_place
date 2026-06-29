/**
 * Ethiopian calendar utilities for the marketplace dashboard.
 *
 * The Ethiopian calendar has 13 months: 12 months of 30 days + 1 month (Pagumē)
 * of 5 or 6 days. The Ethiopian year is approximately 7–8 years behind the
 * Gregorian year. Year starts on September 11 (or 12 in leap years).
 *
 * Key Ethiopian holidays referenced in requirements.md:
 * - Enkutatash (Ethiopian New Year) – September 11 (Sept 12 in Gregorian leap years)
 * - Timkat (Epiphany)              – January 19 (Jan 20 in leap years)
 * - Fasika (Ethiopian Easter)      – varies (approx 1–2 weeks after Western Easter)
 */

export interface EthiopianEvent {
  name: string;
  nameAmharic: string;
  gregorianDate: Date; // approximate Gregorian date this year
  daysUntil: number;
  alertThresholdDays: number; // show alert when <= this many days away
  suggestion: string;
  actionLabel: string;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

/**
 * Convert a Gregorian date to approximate Ethiopian date string.
 * Returns a simplified display like "Sene 19, 2016 E.C."
 */
export function toEthiopianDateString(gregorian: Date): string {
  // Ethiopian New Year (Enkutatash) is Sep 11 in Gregorian
  // Ethiopian year offset: 7 years and ~8-9 months behind Gregorian
  const ethMonths = [
    'Meskerem', 'Tikemt', 'Hidar', 'Tahsas', 'Ter', 'Yekatit',
    'Megabit', 'Miyazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagumē',
  ];

  const year = gregorian.getFullYear();
  const month = gregorian.getMonth() + 1; // 1-indexed
  const day = gregorian.getDate();

  // Ethiopian New Year falls on Sep 11 (Gregorian)
  // After Sep 11: Ethiopian year = Gregorian year - 7
  // Before Sep 11: Ethiopian year = Gregorian year - 8
  const ethYear = month > 9 || (month === 9 && day >= 11) ? year - 7 : year - 8;

  // Approximate Ethiopian month (each starts ~Sep 11, Oct 11, Nov 10, ...)
  // New Year = Meskerem 1 = Sept 11
  const newYearBase = new Date(year, 8, 11); // Sep 11 of Gregorian year
  let diffDays = Math.floor((gregorian.getTime() - newYearBase.getTime()) / 86400000);
  if (diffDays < 0) {
    // Before Ethiopian New Year, use previous Gregorian year's New Year
    const prevNewYear = new Date(year - 1, 8, 11);
    diffDays = Math.floor((gregorian.getTime() - prevNewYear.getTime()) / 86400000);
  }

  const ethMonthIndex = Math.min(Math.floor(diffDays / 30), 12);
  const ethDay = (diffDays % 30) + 1;
  const monthName = ethMonths[ethMonthIndex] ?? 'Pagumē';

  return `${monthName} ${ethDay}, ${ethYear} E.C.`;
}

// ─── Upcoming Events ──────────────────────────────────────────────────────────

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Compute Western Easter date using Anonymous Gregorian algorithm.
 */
function westernEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

/**
 * Ethiopian Easter (Fasika) = Western Easter + 7 days (approximately).
 */
function ethiopianEaster(year: number): Date {
  const western = westernEaster(year);
  const fasika = new Date(western);
  fasika.setDate(fasika.getDate() + 7);
  return fasika;
}

function daysUntil(target: Date, from: Date = new Date()): number {
  const ms = target.getTime() - from.setHours(0, 0, 0, 0);
  return Math.ceil(ms / 86400000);
}

/**
 * Returns a list of upcoming Ethiopian cultural events within 90 days,
 * each with suggestion text and how many days away they are.
 */
export function getUpcomingEthiopianEvents(from: Date = new Date()): EthiopianEvent[] {
  const year = from.getFullYear();
  const month = from.getMonth() + 1;
  const leap = isLeapYear(year);
  const events: EthiopianEvent[] = [];

  // Enkutatash – Ethiopian New Year: Sep 11 (Sep 12 in Gregorian leap years)
  const enkDay = leap ? 12 : 11;
  let enkDate = new Date(year, 8, enkDay); // Sep
  if (daysUntil(enkDate, new Date(from)) < -30) enkDate = new Date(year + 1, 8, enkDay);
  const enkDays = daysUntil(enkDate, new Date(from));
  if (enkDays >= 0 && enkDays <= 14) {
    events.push({
      name: 'Ethiopian New Year (Enkutatash)',
      nameAmharic: 'እንቁጣጣሽ',
      gregorianDate: enkDate,
      daysUntil: enkDays,
      alertThresholdDays: 14,
      suggestion: `Ethiopian New Year in ${enkDays} day${enkDays !== 1 ? 's' : ''} — stock festive clothing (Habesha Kemis, suits) now!`,
      actionLabel: 'Create Sale',
    });
  }

  // Timkat – January 19 (Jan 20 in leap years)
  const timkatDay = isLeapYear(year) ? 20 : 19;
  let timkatDate = new Date(year, 0, timkatDay); // Jan
  if (daysUntil(timkatDate, new Date(from)) < -30) timkatDate = new Date(year + 1, 0, timkatDay);
  const timkatDays = daysUntil(timkatDate, new Date(from));
  if (timkatDays >= 0 && timkatDays <= 30) {
    events.push({
      name: 'Timkat (Epiphany)',
      nameAmharic: 'ጥምቀት',
      gregorianDate: timkatDate,
      daysUntil: timkatDays,
      alertThresholdDays: 30,
      suggestion: `Timkat in ${timkatDays} day${timkatDays !== 1 ? 's' : ''} — promote traditional white clothing!`,
      actionLabel: 'Promote Listings',
    });
  }

  // Fasika – Ethiopian Easter (variable)
  let fasikaDate = ethiopianEaster(year);
  if (daysUntil(fasikaDate, new Date(from)) < -30) fasikaDate = ethiopianEaster(year + 1);
  const fasikaDays = daysUntil(fasikaDate, new Date(from));
  if (fasikaDays >= 0 && fasikaDays <= 45) {
    events.push({
      name: 'Fasika (Ethiopian Easter)',
      nameAmharic: 'ፋሲካ',
      gregorianDate: fasikaDate,
      daysUntil: fasikaDays,
      alertThresholdDays: 45,
      suggestion: `Easter in ${fasikaDays} day${fasikaDays !== 1 ? 's' : ''} — custom order demand will spike for new dresses!`,
      actionLabel: 'Enable Custom Orders',
    });
  }

  // Wedding season – June, July, August
  if (month >= 6 && month <= 8) {
    events.push({
      name: 'Wedding Season',
      nameAmharic: 'የሠርግ ወቅት',
      gregorianDate: new Date(year, 7, 31), // end of August
      daysUntil: daysUntil(new Date(year, 7, 31), new Date(from)),
      alertThresholdDays: 92,
      suggestion: 'Wedding season is here — highlight bridal collections and formal wear!',
      actionLabel: 'Create Sale',
    });
  }

  // Rainy season – June to September (suggest jackets, sweaters)
  if (month >= 6 && month <= 9) {
    events.push({
      name: 'Rainy Season',
      nameAmharic: 'ክረምት',
      gregorianDate: new Date(year, 8, 30),
      daysUntil: daysUntil(new Date(year, 8, 30), new Date(from)),
      alertThresholdDays: 122,
      suggestion: 'Rainy season — promote jackets, sweaters, and rain-appropriate clothing!',
      actionLabel: 'Promote Listings',
    });
  }

  // Christmas / Black Friday (if within 30 days)
  const blackFriday = new Date(year, 10, 29); // approx last Friday of November
  const bfDays = daysUntil(blackFriday, new Date(from));
  if (bfDays >= 0 && bfDays <= 30) {
    events.push({
      name: 'Black Friday',
      nameAmharic: 'ብላክ ፍራይዴይ',
      gregorianDate: blackFriday,
      daysUntil: bfDays,
      alertThresholdDays: 30,
      suggestion: `Black Friday in ${bfDays} day${bfDays !== 1 ? 's' : ''} — create special discounts to attract buyers!`,
      actionLabel: 'Create Sale',
    });
  }

  const christmas = new Date(year, 11, 25); // Dec 25
  const xmasDays = daysUntil(christmas, new Date(from));
  if (xmasDays >= 0 && xmasDays <= 30) {
    events.push({
      name: 'Christmas',
      nameAmharic: 'ገና',
      gregorianDate: christmas,
      daysUntil: xmasDays,
      alertThresholdDays: 30,
      suggestion: `Christmas in ${xmasDays} day${xmasDays !== 1 ? 's' : ''} — run a holiday sale to boost revenue!`,
      actionLabel: 'Create Sale',
    });
  }

  return events.sort((a, b) => a.daysUntil - b.daysUntil);
}
