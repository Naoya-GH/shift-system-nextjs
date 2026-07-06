import { redirect } from "next/navigation";
import { currentUser } from "@/lib/services/authService";
import * as calendar from "@/lib/helpers/calendar";
import * as shiftRequestService from "@/lib/services/shiftRequestService";
import FlashMessage from "@/components/FlashMessage";
import RequestForm from "./RequestForm";

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; flash?: string }>;
}) {
  const params = await searchParams;
  const yearMonth = params.month ?? calendar.currentMonth();
  const user = await currentUser();
  if (!user) {
    redirect("/login");
  }

  const grid = await shiftRequestService.getMonthGrid(user.id, yearMonth);
  const weeks = calendar.weeksGrid(yearMonth);

  return (
    <>
      <FlashMessage message={params.flash} />
      <h2>シフト希望提出（{yearMonth}）</h2>
      <p className="hint-text">日付をタップすると希望を入力できます。締切までは何度でも変更できます。</p>

      <div className="month-nav">
        <a href={`/request?month=${calendar.prevMonth(yearMonth)}`}>&laquo; 前の月</a>
        <a href={`/request?month=${calendar.nextMonth(yearMonth)}`}>次の月 &raquo;</a>
      </div>

      <RequestForm yearMonth={yearMonth} weeks={weeks} grid={grid} />
    </>
  );
}
