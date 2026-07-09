"use client";

import { useState } from "react";
import * as japaneseHolidays from "@/lib/helpers/japaneseHolidays";
import { saveShiftsAction, confirmShiftsAction } from "./actions";
import type { MonthView } from "@/lib/services/ownerShiftService";
import type { DayLabelEntry } from "@/lib/types";
import SubmitButton from "@/components/SubmitButton";

interface DayLabelState {
  lunch: boolean;
  obanzai: boolean;
  custom: string;
}

interface Props {
  yearMonth: string;
  dates: string[];
  staffList: MonthView["staffList"];
  cells: MonthView["cells"];
  statusCounts: MonthView["statusCounts"];
  initialDayLabels: Record<string, DayLabelEntry[]>;
  weeks: (string | null)[][];
  weekdayLabels: string[];
}

export default function OwnerShiftForm({
  yearMonth,
  dates,
  staffList,
  cells,
  statusCounts,
  initialDayLabels,
  weeks,
  weekdayLabels,
}: Props) {
  const [assigned, setAssigned] = useState<Record<string, Set<number>>>(() => {
    const init: Record<string, Set<number>> = {};
    for (const date of dates) {
      init[date] = new Set(staffList.filter((u) => cells[date]?.[u.id]?.assigned).map((u) => u.id));
    }
    return init;
  });

  const [dayLabels, setDayLabels] = useState<Record<string, DayLabelState>>(() => {
    const init: Record<string, DayLabelState> = {};
    for (const date of dates) {
      const entries = initialDayLabels[date] ?? [];
      init[date] = {
        lunch: entries.some((e) => e.type === "lunch"),
        obanzai: entries.some((e) => e.type === "obanzai"),
        custom: entries.find((e) => e.type === "custom")?.label ?? "",
      };
    }
    return init;
  });

  function toggleAssigned(date: string, userId: number) {
    setAssigned((prev) => {
      const next = new Set(prev[date]);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return { ...prev, [date]: next };
    });
  }

  function updateDayLabel(date: string, patch: Partial<DayLabelState>) {
    setDayLabels((prev) => ({ ...prev, [date]: { ...prev[date], ...patch } }));
  }

  // 日付×スタッフごとに個別のname付きチェックボックスを持たせる方式だと、
  // スタッフ数・日数が多い月でリクエスト本文が8KBを超え、ホスティング環境のWAFに
  // ブロックされることが分かったため、JSONにまとめた隠しフィールドで送信する
  const assignedPayload = JSON.stringify(
    Object.fromEntries(dates.map((d) => [d, Array.from(assigned[d] ?? [])]))
  );
  const dayLabelPayload = JSON.stringify(dayLabels);

  return (
    <>
      <div className="calendar-weekdays">
        {weekdayLabels.map((label, i) => (
          <span key={label} className={i === 0 ? "weekday-sun" : i === 6 ? "weekday-sat" : ""}>
            {label}
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
            const okCount = statusCounts[date]?.ok ?? 0;
            const maybeCount = statusCounts[date]?.maybe ?? 0;

            return (
              <a href={`#day-${date}`} key={date} className={`calendar-day overview-day ${dayClass}`}>
                <span className={`calendar-date ${dateClass}`}>{Number(date.slice(8, 10))}</span>
                {holidayName && <span className="holiday-name">{holidayName}</span>}
                {okCount === 0 && maybeCount === 0 ? (
                  <span className="ok-count">-</span>
                ) : (
                  <>
                    {okCount > 0 && <span className="ok-count">○{okCount}</span>}
                    {maybeCount > 0 && <span className="maybe-count">△{maybeCount}</span>}
                  </>
                )}
              </a>
            );
          })}
        </div>
      ))}

      <form className="owner-shift-form">
        <input type="hidden" name="month" value={yearMonth} />
        <input type="hidden" name="assignedPayload" value={assignedPayload} />
        <input type="hidden" name="dayLabelPayload" value={dayLabelPayload} />

        {dates.map((date) => {
          const weekday = new Date(date + "T00:00:00Z").getUTCDay();
          const holidayName = japaneseHolidays.label(date);
          const isSunday = weekday === 0 || holidayName !== null;
          const isSaturday = weekday === 6 && holidayName === null;
          const cardClass = isSunday ? "is-sunday-card" : isSaturday ? "is-saturday-card" : "";
          const label = dayLabels[date] ?? { lunch: false, obanzai: false, custom: "" };
          const visibleStaff = staffList.filter(
            (u) => (cells[date]?.[u.id]?.requests.length ?? 0) > 0 || assigned[date]?.has(u.id)
          );

          return (
            <div className={`day-card ${cardClass}`} id={`day-${date}`} key={date}>
              <div className="day-card-header">
                <span className="day-card-date">
                  {Number(date.slice(8, 10))}（{weekdayLabels[weekday]}）
                </span>
                {holidayName && <span className="holiday-name-inline">{holidayName}</span>}

                <details className="day-label-editor">
                  <summary>
                    この日の予定 ▽
                    {label.lunch && <span className="day-event-label day-event-lunch">ランチ</span>}
                    {label.obanzai && <span className="day-event-label day-event-obanzai">おばんざい</span>}
                    {label.custom !== "" && (
                      <span className="day-event-label day-event-custom">{label.custom}</span>
                    )}
                  </summary>
                  <div className="day-label-chips">
                    <label className="day-label-chip day-label-chip-lunch">
                      <input
                        type="checkbox"
                        checked={label.lunch}
                        onChange={(e) => updateDayLabel(date, { lunch: e.target.checked })}
                      />
                      ランチ
                    </label>
                    <label className="day-label-chip day-label-chip-obanzai">
                      <input
                        type="checkbox"
                        checked={label.obanzai}
                        onChange={(e) => updateDayLabel(date, { obanzai: e.target.checked })}
                      />
                      おばんざい
                    </label>
                  </div>
                  <input
                    type="text"
                    className="day-label-custom-input"
                    maxLength={20}
                    placeholder="特別営業名など（任意）"
                    value={label.custom}
                    onChange={(e) => updateDayLabel(date, { custom: e.target.value })}
                  />
                </details>
              </div>

              {visibleStaff.length === 0 ? (
                <p className="hint-text day-card-empty">希望を提出したスタッフがいません。</p>
              ) : (
                <ul className="day-card-list">
                  {visibleStaff.map((user) => {
                    const cell = cells[date]?.[user.id];
                    return (
                      <li className={`staff-row ${cell?.confirmed ? "is-confirmed" : ""}`} key={user.id}>
                        <label className="staff-row-checkbox">
                          <input
                            type="checkbox"
                            checked={assigned[date]?.has(user.id) ?? false}
                            onChange={() => toggleAssigned(date, user.id)}
                          />
                          <span className="staff-row-name">{user.displayName}</span>
                        </label>
                        <div className="staff-row-detail">
                          {!cell || cell.requests.length === 0 ? (
                            <span className="status-badge status-badge-none">未提出</span>
                          ) : (
                            cell.requests.map((request, i) => (
                              <span className="request-line" key={i}>
                                {request.slotLabel !== "" && (
                                  <span className="slot-label">{request.slotLabel}</span>
                                )}
                                <span className={`status-badge status-badge-${request.status}`}>
                                  {request.label}
                                </span>
                                {request.timeText !== "" && (
                                  <span className="time-text">{request.timeText}</span>
                                )}
                                {request.memo !== "" && <span className="memo-text">{request.memo}</span>}
                              </span>
                            ))
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}

        <div className="form-actions form-actions-sticky">
          <a href="#calendar-top" className="btn btn-secondary back-to-top">
            ▲ カレンダー
          </a>
          <SubmitButton formAction={saveShiftsAction} className="btn btn-secondary" pendingText="保存中...">
            保存
          </SubmitButton>
          <SubmitButton formAction={confirmShiftsAction} className="btn btn-primary" pendingText="確定中...">
            シフト確定
          </SubmitButton>
        </div>
      </form>
    </>
  );
}
