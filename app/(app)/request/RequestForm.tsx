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

export default function RequestForm({ yearMonth, weeks, grid }: Props) {
  const [state, setState] = useState<Grid>(grid);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
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

  // 日付ごとに個別のname付きフィールドを持たせる方式だと、月全体分でリクエスト本文が
  // 8KBを超えてしまい、ホスティング環境のWAFにブロックされることが分かったため、
  // 変更があった分だけをJSONにまとめた1つの隠しフィールドで送信する
  // （JSが無効/失敗している場合はこのJSONが更新されず、提出しても変更前の内容のまま
  // 送信されてしまう制限があるが、WAFによる送信不可の方が実害が大きいためこちらを優先する）
  const payload = JSON.stringify(state);

  const selectedHolidayName = selectedDate ? japaneseHolidays.label(selectedDate) : null;

  return (
    <form action={saveRequestAction} className="request-form">
      <input type="hidden" name="month" value={yearMonth} />
      <input type="hidden" name="payload" value={payload} />

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
              <button
                type="button"
                key={date}
                className={`calendar-day day-cell-button ${dayClass}`}
                onClick={() => setSelectedDate(date)}
              >
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
              </button>
            );
          })}
        </div>
      ))}

      <div className="modal-overlay" hidden={selectedDate === null}>
        <div className="modal-box">
          {selectedDate && (
            <>
              <h3>
                {Number(selectedDate.slice(5, 7))}月{Number(selectedDate.slice(8, 10))}日
                {selectedHolidayName && <span className="holiday-name-inline"> {selectedHolidayName}</span>}
              </h3>

              {slotKeys.map((slotKey) => {
                const entry = state[selectedDate]?.[slotKey] ?? EMPTY_ENTRY;
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
                            checked={entry.status === value}
                            onChange={() => updateEntry(selectedDate, slotKey, { status: value })}
                            onClick={() => {
                              // 選択済みのものをもう一度タップした場合は選択解除する
                              // （ラジオボタンは同じものを再度押しても標準では解除されないため）
                              if (entry.status === value) {
                                updateEntry(selectedDate, slotKey, { status: "" });
                              }
                            }}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <div className="time-range">
                      <label>
                        出勤
                        <select
                          value={entry.startTime}
                          onChange={(e) => updateEntry(selectedDate, slotKey, { startTime: e.target.value })}
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
                          value={entry.endTime}
                          onChange={(e) => updateEntry(selectedDate, slotKey, { endTime: e.target.value })}
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
                      placeholder="ひとこと（任意）"
                      value={entry.memo}
                      onChange={(e) => updateEntry(selectedDate, slotKey, { memo: e.target.value })}
                    />
                  </div>
                );
              })}

              <div className="modal-actions">
                <button type="button" className="btn btn-primary" onClick={() => setSelectedDate(null)}>
                  閉じる
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <SubmitButton className="btn btn-primary btn-large" pendingText="送信中...">
        提出
      </SubmitButton>
    </form>
  );
}
