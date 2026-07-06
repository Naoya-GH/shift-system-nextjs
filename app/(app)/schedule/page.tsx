import { redirect } from "next/navigation";
import * as calendar from "@/lib/helpers/calendar";
import * as japaneseHolidays from "@/lib/helpers/japaneseHolidays";
import { currentUser } from "@/lib/services/authService";
import * as staffScheduleService from "@/lib/services/staffScheduleService";
import * as dayLabelService from "@/lib/services/dayLabelService";
import FlashMessage from "@/components/FlashMessage";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; tab?: string; flash?: string }>;
}) {
  const params = await searchParams;
  const yearMonth = params.month ?? calendar.currentMonth();
  const tab = params.tab === "all" ? "all" : "mine";

  const user = await currentUser();
  if (!user) {
    redirect("/login");
  }

  const weeks = calendar.weeksGrid(yearMonth);
  const prevMonth = calendar.prevMonth(yearMonth);
  const nextMonth = calendar.nextMonth(yearMonth);

  const schedule = tab === "mine" ? await staffScheduleService.getMonthSchedule(user.id, yearMonth) : null;
  const overview = tab === "all" ? await staffScheduleService.getMonthOverview(yearMonth) : null;
  const dayLabels = tab === "all" ? await dayLabelService.getMonthLabels(yearMonth) : null;

  return (
    <>
      <FlashMessage message={params.flash} />
      <h2>確定シフト確認（{yearMonth}）</h2>

      <div className="tab-nav">
        <a href={`/schedule?tab=mine&month=${yearMonth}`} className={`tab-link ${tab === "mine" ? "is-active" : ""}`}>
          自分のシフト
        </a>
        <a href={`/schedule?tab=all&month=${yearMonth}`} className={`tab-link ${tab === "all" ? "is-active" : ""}`}>
          全員のシフト
        </a>
      </div>

      <div className="month-nav">
        <a href={`/schedule?tab=${tab}&month=${prevMonth}`}>&laquo; 前の月</a>
        <a href={`/schedule?tab=${tab}&month=${nextMonth}`}>次の月 &raquo;</a>
      </div>

      <div className="calendar-weekdays">
        {calendar.weekdayLabels.map((label, i) => (
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
            const dateClass = isSunday ? "is-sunday" : isSaturday ? "is-saturday" : "";

            if (tab === "all") {
              const names = overview?.[date] ?? [];
              const eventLabels = dayLabels?.[date] ?? [];
              return (
                <div className={`calendar-day ${names.length > 0 ? "day-working" : "day-off"}`} key={date}>
                  <div className={`calendar-date ${dateClass}`}>{Number(date.slice(8, 10))}</div>
                  {holidayName && <div className="holiday-name">{holidayName}</div>}
                  {eventLabels.map((e, i) => (
                    <span key={i} className={`day-event-label day-event-${e.type}`}>
                      {e.label}
                    </span>
                  ))}
                  <div className="overview-names">
                    {names.length === 0 ? (
                      <span className="day-label">-</span>
                    ) : (
                      names.map((n, i) => (
                        <span key={i} className="overview-name">
                          {n}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              );
            }

            const entry = schedule?.[date] ?? { working: false, timeText: "" };
            return (
              <div className={`calendar-day ${entry.working ? "day-working" : "day-off"}`} key={date}>
                <div className={`calendar-date ${dateClass}`}>{Number(date.slice(8, 10))}</div>
                {holidayName && <div className="holiday-name">{holidayName}</div>}
                <div className="day-label">{entry.working ? "出勤" : "休み"}</div>
                {entry.working && entry.timeText !== "" && <div className="day-time-text">{entry.timeText}</div>}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}
