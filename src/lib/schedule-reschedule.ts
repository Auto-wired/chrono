import { addDaysKst, diffDaysKst } from '@/lib/kst-date';
import type { ScheduleEvent } from '@/lib/schedule-match';

/** 일정 날짜만 변경하고 시각(또는 종일)은 유지 */
export function computeRescheduledTimes(
  event: ScheduleEvent,
  targetDateYmd: string
): { start: string; end: string } {
  const startDate = event.start.split('T')[0];
  const endDate = event.end.split('T')[0];
  const startTime = event.start.includes('T') ? event.start.split('T')[1] : '00:00:00';
  const endTime = event.end.includes('T') ? event.end.split('T')[1] : '00:00:00';
  const spanDays = diffDaysKst(startDate, endDate);

  if (event.allDay) {
    const newEnd = addDaysKst(targetDateYmd, spanDays);
    return { start: targetDateYmd, end: newEnd };
  }

  const newEndDate = addDaysKst(targetDateYmd, spanDays);
  return {
    start: `${targetDateYmd}T${startTime}`,
    end: `${newEndDate}T${endTime}`,
  };
}
