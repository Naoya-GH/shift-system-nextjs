import { shiftSlotsConfig } from "../config";

// シフト区分（早番/遅番など）。config.shiftSlotsConfig で定義する
export function all(): Record<string, string> {
  return shiftSlotsConfig;
}

// 区分キーの一覧。区分未設定の場合は「区分なし」を表す単一キー [''] を返す
export function keys(): string[] {
  const s = all();
  const k = Object.keys(s);
  return k.length === 0 ? [""] : k;
}

export function label(key: string): string {
  return key === "" ? "" : (all()[key] ?? key);
}

export function isValid(key: string): boolean {
  return keys().includes(key);
}
