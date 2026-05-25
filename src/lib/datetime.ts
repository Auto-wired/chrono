/** 앱 일정 시간대 — DB·UI 모두 KST 벽시계 기준으로 다룹니다. */
export const APP_TIMEZONE = 'Asia/Seoul';

/**
 * KST 벽시계 문자열 → DB 저장용 Date.
 * MySQL DATETIME(타임존 없음)에 입력한 시각 그대로 저장되도록 UTC 필드에 벽시계 값을 넣습니다.
 */
export function parseScheduleDateTime(value: string): Date {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return wallClockToStorageDate(trimmed, '00:00:00');
  }

  if (!/[Zz]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}(?::\d{2})?))?/);
    if (match) {
      const time = (match[2] ?? '00:00:00').padEnd(8, ':00').slice(0, 8);
      return wallClockToStorageDate(match[1], time);
    }
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`유효하지 않은 날짜 형식입니다: ${value}`);
  }

  return wallClockFromInstant(parsed);
}

/** DB Date → FullCalendar·폼용 KST 벽시계 문자열 */
export function formatScheduleDateTime(date: Date, allDay = false): string {
  const y = date.getUTCFullYear();
  const mo = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');

  if (allDay) {
    return `${y}-${mo}-${d}`;
  }

  const h = String(date.getUTCHours()).padStart(2, '0');
  const mi = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}-${mo}-${d}T${h}:${mi}:${s}`;
}

function wallClockToStorageDate(datePart: string, timePart: string): Date {
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi, s = 0] = timePart.split(':').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h, mi, s));
}

/** 타임존이 포함된 ISO → KST 벽시계 storage Date */
function wallClockFromInstant(instant: Date): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '00';

  const datePart = `${get('year')}-${get('month')}-${get('day')}`;
  const timePart = `${get('hour')}:${get('minute')}:${get('second')}`;
  return wallClockToStorageDate(datePart, timePart);
}
