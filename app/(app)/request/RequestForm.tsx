"use client";

import { useState } from "react";
import * as japaneseHolidays from "@/lib/helpers/japaneseHolidays";
import * as businessHours from "@/lib/helpers/businessHours";
import * as shiftSlots from "@/lib/helpers/shiftSlots";
import * as shiftStatus from "@/lib/helpers/shiftStatus";
import { weekdayLabels } from "@/lib/helpers/calendar";
import type { GridEntry } from "@/lib/services/shiftRequestService";
import { saveRequestAction } from "./actions";
import SubmitButton from "@/components/SubmitButton";

type Grid = Record<string, Record<string, GridEntry>>;

interface Props {
  yearMonth: string;
  weeks: (string | null)[][];
  grid: Grid;
}

const EMPTY_ENTRY: GridEntry = { status: "", startTime: "", endTime: "", memo: "" };

// entries[日付][区分][項目] という名前を持たせることで、JSが読み込まれる前/失敗した場合でも
// 素のHTMLフォームとして送信できるようにする（区分未設定の場合は区分部分を空にする）
function fieldName(date: string, slot: string, field: string): string {
  return `entries[${date}][${slot}][${field}]`;
}

export default function RequestForm({ yearMonth, weeks, grid }: Props) {
  const [state, setState] = useState<Grid>(grid);
  const slotKeys = shiftSlots.keys();
  const timeOptions = businessHours.timeOptions();

  function updateEntry(date: string, slot: string, patch: Partial<GridEntry>) {
    setState((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        [slot]: { ...(prev[date]?.[slot] ?? EMPTY_ENTRY), ...patch },
      },
    }));
  }

  return (
    <form action={saveRequestAction} className="request-form">
      <input type="hidden" name="month" value={yearMonth} />

      <div className="calendar-weekdays">
        {weekdayLabels.map((wLabel, i) => (
          <span key={wLabel} className={i === 0 ? "weekday-sun" : i === 6 ? "weekday-sat" : ""}>
            {wLabel}
          </span>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div className="calendar-week" key={wi}>
          {week.map((date, columnIndex) => {
            if (date === null) {
              return <div key={columnIndex} className="calendar-day calendar-day-blank" />;
            }

            const holidayName = japaneseHolidays.label(date);
            const isSunday = columnIndex === 0 || holidayName !== null;
            const isSaturday = columnIndex === 6 && holidayName === null;
            const dayClass = isSunday ? "day-holiday-bg" : isSaturday ? "day-saturday-bg" : "";
            const dateClass = isSunday ? "is-sunday" : isSaturday ? "is-saturday" : "";

            return (
              <details className={`calendar-day day-editor ${dayClass}`} key={date}>
                <summary>
                  <span className={`calendar-date ${dateClass}`}>{Number(date.slice(8, 10))}</span>
                  {holidayName && <span className="holiday-name">{holidayName}</span>}
                  <span className="day-summary">
                    {slotKeys.map((slotKey) => {
                      const entry = state[date]?.[slotKey] ?? EMPTY_ENTRY;
                      if (entry.status === "") return null;
                      return (
                        <span key={slotKey}>
                          <span className={`status-badge status-badge-${entry.status}`}>
                            {shiftStatus.label(entry.status)}
                          </span>
                          {(entry.startTime !== "" || entry.endTime !== "") && (
                            <span className="time-text">
                              {entry.startTime}〜{entry.endTime}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </span>
                </summary>

                {slotKeys.map((slotKey) => {
                  const entry = state[date]?.[slotKey] ?? EMPTY_ENTRY;
                  return (
                    <div className="slot-editor" key={slotKey}>
                      {slotKey !== "" && <div className="slot-name">{shiftSlots.label(slotKey)}</div>}
                      <div className="status-options">
                        {Object.entries(shiftStatus.all()).map(([value, label]) => (
                          <label
                            key={value}
                            className={`status-option status-option-${value} ${
                              entry.status === value ? "is-selected" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name={fieldName(date, slotKey, "status")}
                              value={value}
                              checked={entry.status === value}
                              onChange={() => updateEntry(date, slotKey, { status: value })}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                      <div className="time-range">
                        <label>
                          出勤
                          <select
                            name={fieldName(date, slotKey, "startTime")}
                            value={entry.startTime}
                            onChange={(e) => updateEntry(date, slotKey, { startTime: e.target.value })}
                          >
                            <option value="">--:--</option>
                            {timeOptions.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          退勤
                          <select
                            name={fieldName(date, slotKey, "endTime")}
                            value={entry.endTime}
                            onChange={(e) => updateEntry(date, slotKey, { endTime: e.target.value })}
                          >
                            <option value="">--:--</option>
                            {timeOptions.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <input
                        type="text"
                        className="memo-input"
                        name={fieldName(date, slotKey, "memo")}
                        placeholder="ひとこと（任意）"
                        value={entry.memo}
                        onChange={(e) => updateEntry(date, slotKey, { memo: e.target.value })}
                      />
                    </div>
                  );
                })}
              </details>
            );
          })}
        </div>
      ))}

      <SubmitButton className="btn btn-primary btn-large" pendingText="送信中...">
        提出
      </SubmitButton>
    </form>
  );
}
