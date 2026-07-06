// 'YYYY-MM' 形式の年月を扱う月間カレンダーの補助関数（週の始まりは日曜日）
// 日付計算はすべてUTC基準で行い、サーバーのタイムゾーン設定に依存しないようにする。
// 「今日」「今月」だけは店舗のタイムゾーン（Asia/Tokyo）での実時刻が必要なため別途扱う。

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toYmd(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function parseYearMonth(yearMonth: string): { year: number; month: number } {
  const [y, m] = yearMonth.split("-").map(Number);
  return { year: y, month: m };
}

export function daysInMonth(yearMonth: string): string[] {
  const { year, month } = parseYearMonth(yearMonth);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const dates: string[] = [];
  for (let d = 1; d <= lastDay; d++) {
    dates.push(`${yearMonth}-${pad2(d)}`);
  }
  return dates;
}

// 週ごとの配列を返す。月の前後の空白セルは null で埋める
export function weeksGrid(yearMonth: string): (string | null)[][] {
  const { year, month } = parseYearMonth(yearMonth);
  const leadingBlank = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0=日曜
  const dates = daysInMonth(yearMonth);

  const cells: (string | null)[] = [...Array(leadingBlank).fill(null), ...dates];
  const trailingBlank = (7 - (cells.length % 7)) % 7;
  cells.push(...Array(trailingBlank).fill(null));

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export function prevMonth(yearMonth: string): string {
  const { year, month } = parseYearMonth(yearMonth);
  const d = new Date(Date.UTC(year, month - 2, 1));
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
}

export function nextMonth(yearMonth: string): string {
  const { year, month } = parseYearMonth(yearMonth);
  const d = new Date(Date.UTC(year, month, 1));
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
}

// サーバーのタイムゾーン設定によらず、Asia/Tokyoでの「今日」を返す
export function today(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function currentMonth(): string {
  return today().slice(0, 7);
}

export const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];

export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export { toYmd };
