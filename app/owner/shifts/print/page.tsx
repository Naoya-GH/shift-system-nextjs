import "./print.css";
import * as calendar from "@/lib/helpers/calendar";
import * as shiftTimeSymbol from "@/lib/helpers/shiftTimeSymbol";
import * as ownerShiftService from "@/lib/services/ownerShiftService";
import * as dayLabelService from "@/lib/services/dayLabelService";
import PrintButton from "./PrintButton";

export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const yearMonth = params.month ?? calendar.currentMonth();

  const view = await ownerShiftService.getPrintView(yearMonth);
  const dayLabels = await dayLabelService.getMonthLabels(yearMonth);
  const prevMonth = calendar.prevMonth(yearMonth);
  const nextMonth = calendar.nextMonth(yearMonth);
  const monthLabel = `${Number(yearMonth.slice(5, 7))}月`;

  return (
    <div className="print-page">
      <div className="no-print print-toolbar">
        <a href={`/owner/shifts/print?month=${prevMonth}`}>&laquo; 前の月</a>
        <a href={`/owner/shifts/print?month=${nextMonth}`}>次の月 &raquo;</a>
        <PrintButton />
        <a href={`/owner/shifts?month=${yearMonth}`}>シフト作成画面に戻る</a>
      </div>

      <div className="print-scroll">
        <table className="print-sheet">
          <thead>
            <tr>
              <th className="corner-cell">{monthLabel}</th>
              {view.dates.map((date) => (
                <th key={date}>{Number(date.slice(8, 10))}</th>
              ))}
            </tr>
            <tr>
              <th className="corner-cell"></th>
              {view.dates.map((date) => {
                const weekday = new Date(date + "T00:00:00Z").getUTCDay();
                return (
                  <th key={date} className={weekday === 0 || weekday === 6 ? "weekend" : ""}>
                    {calendar.weekdayLabels[weekday]}
                  </th>
                );
              })}
            </tr>
            <tr>
              <th className="corner-cell"></th>
              {view.dates.map((date) => (
                <td key={date} className="day-label-cell">
                  {(dayLabels[date] ?? []).map((entry, i) => (
                    <span key={i} className={`vertical-label vertical-label-${entry.type}`}>
                      {entry.label}
                    </span>
                  ))}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.staffList.map((user) => (
              <tr key={user.id}>
                <th className="staff-name-cell">{user.displayName}</th>
                {view.dates.map((date) => (
                  <td key={date}>{view.cellText[date]?.[user.id] ?? ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="print-legend">
        {shiftTimeSymbol.legend().map((entry) => (
          <span className="legend-item" key={entry.symbol}>
            {entry.symbol}
            {entry.start}〜{entry.end === "27:00" ? "3:00" : entry.end}
          </span>
        ))}
        {view.footnotes.length > 0 && (
          <span className="legend-item">{shiftTimeSymbol.OTHER_SYMBOL}個別の時間（下記参照）</span>
        )}
      </div>

      {view.footnotes.length > 0 && (
        <div className="print-footnotes">
          {view.footnotes.map((footnote, i) => {
            const d = new Date(footnote.date + "T00:00:00Z");
            const day = `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
            return (
              <span className="footnote-item" key={i}>
                {shiftTimeSymbol.OTHER_SYMBOL} {day} {footnote.userName}：{footnote.timeText}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
