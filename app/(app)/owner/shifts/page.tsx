import * as calendar from "@/lib/helpers/calendar";
import * as ownerShiftService from "@/lib/services/ownerShiftService";
import * as dayLabelService from "@/lib/services/dayLabelService";
import FlashMessage from "@/components/FlashMessage";
import OwnerShiftForm from "./OwnerShiftForm";

export default async function OwnerShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; flash?: string }>;
}) {
  const params = await searchParams;
  const yearMonth = params.month ?? calendar.currentMonth();

  const view = await ownerShiftService.getMonthView(yearMonth);
  const dayLabels = await dayLabelService.getMonthLabels(yearMonth);
  const weeks = calendar.weeksGrid(yearMonth);

  return (
    <>
      <FlashMessage message={params.flash} />
      <h2 id="calendar-top">シフト作成（{yearMonth}）</h2>
      <p className="hint-text">日付をタップするとその日の割当欄に移動します。○△はそれぞれの人数です。</p>

      <div className="month-nav">
        <a href={`/owner/shifts?month=${calendar.prevMonth(yearMonth)}`}>&laquo; 前の月</a>
        <a href={`/owner/shifts?month=${calendar.nextMonth(yearMonth)}`}>次の月 &raquo;</a>
      </div>

      <p>
        <a href={`/owner/shifts/print?month=${yearMonth}`} target="_blank" rel="noopener noreferrer">
          確定シフト表を印刷用ページで開く &raquo;
        </a>
      </p>

      <OwnerShiftForm
        yearMonth={yearMonth}
        dates={view.dates}
        staffList={view.staffList}
        cells={view.cells}
        statusCounts={view.statusCounts}
        initialDayLabels={dayLabels}
        weeks={weeks}
        weekdayLabels={calendar.weekdayLabels}
      />
    </>
  );
}
