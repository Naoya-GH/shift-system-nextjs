// 確定シフトの時間帯を、印刷用シートで使う記号に変換する。
// 該当する組み合わせがない場合は呼び出し側で時刻をそのまま表示する（symbolFor が null を返す）。

// 凡例のどれにも当てはまらない時間帯に使う記号（詳細は表の下の一覧に記載する）
export const OTHER_SYMBOL = "★";

interface LegendEntry {
  symbol: string;
  start: string;
  end: string;
}

const LEGEND: LegendEntry[] = [
  { symbol: "◎", start: "16:30", end: "27:00" },
  { symbol: "○", start: "19:00", end: "24:00" },
  { symbol: "●", start: "19:00", end: "27:00" },
  { symbol: "▲", start: "24:00", end: "27:00" },
  { symbol: "△", start: "16:30", end: "24:00" },
];

export function symbolFor(startTime: string, endTime: string): string | null {
  const entry = LEGEND.find((e) => e.start === startTime && e.end === endTime);
  return entry ? entry.symbol : null;
}

export function legend(): LegendEntry[] {
  return LEGEND;
}
