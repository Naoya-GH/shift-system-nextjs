// shift_requests.status（ok/maybe）と画面表示用の記号（○/△）の対応をここに集約する
// ×（出勤不可）は選択肢として持たず、希望が未提出であることをもって不可とみなす
const LABELS: Record<string, string> = {
  ok: "○",
  maybe: "△",
};

export function label(status: string): string {
  return LABELS[status] ?? "";
}

// [値 => 記号] の一覧（選択肢の描画に使う）
export function all(): Record<string, string> {
  return LABELS;
}

export function isValid(status: string): boolean {
  return Object.prototype.hasOwnProperty.call(LABELS, status);
}
