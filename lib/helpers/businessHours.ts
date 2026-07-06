import { appConfig } from "../config";

// 営業時間内の時刻選択肢（config.businessHours に基づく30分刻み）
// 深夜営業のため 24:00 以降は 24:30, 25:00... のように 27:00 まで表記する
let cachedOptions: string[] | null = null;

export function timeOptions(): string[] {
  if (cachedOptions) {
    return cachedOptions;
  }

  const [startHour, startMinute] = appConfig.businessHours.start.split(":").map(Number);
  const [endHour, endMinute] = appConfig.businessHours.end.split(":").map(Number);

  const options: string[] = [];
  let hour = startHour;
  let minute = startMinute;

  while (hour < endHour || (hour === endHour && minute <= endMinute)) {
    options.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    minute += 30;
    if (minute >= 60) {
      minute -= 60;
      hour++;
    }
  }

  cachedOptions = options;
  return options;
}

export function isValid(time: string): boolean {
  return time === "" || timeOptions().includes(time);
}
