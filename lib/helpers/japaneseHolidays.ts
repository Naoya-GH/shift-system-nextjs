// 日本の祝日を計算する（内閣府の祝日法に基づく一般的なルールの近似実装）。
// 春分・秋分の日は天文計算の近似式（1980〜2099年で妥当）を用いる。
// 五輪特例（2020・2021年）など政令による一時的な移動は反映していない。
const cache = new Map<number, Record<string, string>>();

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toYmd(year: number, monthZeroIndexed: number, day: number): string {
  const d = new Date(Date.UTC(year, monthZeroIndexed, day));
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

// 指定月の第N月曜日を 'YYYY-MM-DD' で返す
function nthMonday(year: number, month: number, nth: number): string {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const jsDay = first.getUTCDay(); // 0=日..6=土
  const isoN = jsDay === 0 ? 7 : jsDay; // 1=月..7=日
  const offsetToMon = (8 - isoN) % 7;
  const day = 1 + offsetToMon + (nth - 1) * 7;
  return toYmd(year, month - 1, day);
}

function springEquinox(year: number): string {
  const day = Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  return `${year}-03-${pad2(day)}`;
}

function autumnEquinox(year: number): string {
  const day = Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  return `${year}-09-${pad2(day)}`;
}

function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=日..6=土
}

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-${pad2(next.getUTCDate())}`;
}

// 祝日と祝日に挟まれた平日（日曜を除く）を「国民の休日」とする
function applyCitizensHoliday(holidays: Record<string, string>): Record<string, string> {
  const result = { ...holidays };
  for (const date of Object.keys(holidays)) {
    const gap = addDays(date, 1);
    const after = addDays(date, 2);
    if (!result[gap] && result[after] && weekdayOf(gap) !== 0) {
      result[gap] = "国民の休日";
    }
  }
  return result;
}

// 日曜日の祝日は、その次の祝日でない日を振替休日とする
function applySubstituteHolidays(holidays: Record<string, string>): Record<string, string> {
  const result = { ...holidays };
  for (const [date] of Object.entries(holidays)) {
    if (weekdayOf(date) !== 0) continue;

    let cursor = addDays(date, 1);
    while (result[cursor]) {
      cursor = addDays(cursor, 1);
    }
    result[cursor] = "振替休日";
  }
  return result;
}

export function forYear(year: number): Record<string, string> {
  const cached = cache.get(year);
  if (cached) return cached;

  let holidays: Record<string, string> = {};
  holidays[`${year}-01-01`] = "元日";
  holidays[nthMonday(year, 1, 2)] = "成人の日";
  holidays[`${year}-02-11`] = "建国記念の日";
  if (year >= 2020) {
    holidays[`${year}-02-23`] = "天皇誕生日";
  }
  holidays[springEquinox(year)] = "春分の日";
  holidays[`${year}-04-29`] = "昭和の日";
  holidays[`${year}-05-03`] = "憲法記念日";
  holidays[`${year}-05-04`] = "みどりの日";
  holidays[`${year}-05-05`] = "こどもの日";
  holidays[nthMonday(year, 7, 3)] = "海の日";
  if (year >= 2016) {
    holidays[`${year}-08-11`] = "山の日";
  }
  holidays[nthMonday(year, 9, 3)] = "敬老の日";
  holidays[autumnEquinox(year)] = "秋分の日";
  holidays[nthMonday(year, 10, 2)] = "スポーツの日";
  holidays[`${year}-11-03`] = "文化の日";
  holidays[`${year}-11-23`] = "勤労感謝の日";

  holidays = applyCitizensHoliday(holidays);
  holidays = applySubstituteHolidays(holidays);

  cache.set(year, holidays);
  return holidays;
}

export function label(date: string): string | null {
  const year = Number(date.slice(0, 4));
  return forYear(year)[date] ?? null;
}

export function isHoliday(date: string): boolean {
  return label(date) !== null;
}
