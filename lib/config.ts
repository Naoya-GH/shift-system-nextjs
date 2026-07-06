export const appConfig = {
  name: "シフト管理システム",
  timezone: "Asia/Tokyo",
  session: {
    cookieName: "shift_sess",
    maxAgeSeconds: 60 * 60 * 24,
  },
  // シフト希望で選べる時間帯（開店18:00だが仕込み等の準備時間を考慮し16:30から選択可。
  // 居酒屋のため深夜は24:00以降を24〜27時表記で扱う）
  businessHours: {
    start: "16:30",
    end: "27:00",
  },
};

// シフト区分（早番/遅番など）。空配列のままなら区分なし（1日単位のみ）で運用される。
export const shiftSlotsConfig: Record<string, string> = {
  // early: "早番",
  // late: "遅番",
};
