import { APP_TIMEZONE } from '@/lib/datetime';

const WEEKDAY_MAP: Record<string, number> = {
  일: 0,
  월: 1,
  화: 2,
  수: 3,
  목: 4,
  금: 5,
  토: 6,
};

export function todayKstDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE }).format(new Date());
}

export function addDaysKst(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return formatYmdUtc(dt);
}

function formatYmdUtc(dt: Date): string {
  const y = dt.getUTCFullYear();
  const mo = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

function dayOfWeekKst(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** 이번 주(일~토) 또는 다음 주의 특정 요일 YYYY-MM-DD */
function weekdayInWeek(todayYmd: string, weekday: number, weekOffset: 0 | 1): string {
  const dow = dayOfWeekKst(todayYmd);
  const startOfWeek = addDaysKst(todayYmd, -dow + weekOffset * 7);
  return addDaysKst(startOfWeek, weekday);
}

/**
 * 자연어/날짜 문자열 → YYYY-MM-DD (KST 기준)
 * 예: "5월 28일", "이번주 금요일", "내일", "2026-05-28"
 */
export function resolveTargetDate(input: string, todayYmd = todayKstDate()): string | null {
  const trimmed = input.trim();
  const t = trimmed.replace(/\s+/g, '');

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed) || /^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return trimmed.match(/^\d{4}-\d{2}-\d{2}$/) ? trimmed : t;
  }

  if (t === '오늘') return todayYmd;
  if (t === '내일') return addDaysKst(todayYmd, 1);
  if (t === '모레') return addDaysKst(todayYmd, 2);

  const md = t.match(/^(\d{1,2})월(\d{1,2})일?$/);
  if (md) {
    const year = todayYmd.slice(0, 4);
    return `${year}-${md[1].padStart(2, '0')}-${md[2].padStart(2, '0')}`;
  }

  const weekDay = t.match(/^(이번주|다음주)(일|월|화|수|목|금|토)요일$/);
  if (weekDay) {
    const offset = weekDay[1] === '다음주' ? 1 : 0;
    return weekdayInWeek(todayYmd, WEEKDAY_MAP[weekDay[2]], offset);
  }

  const dayOnly = t.match(/^(일|월|화|수|목|금|토)요일$/);
  if (dayOnly) {
    const target = WEEKDAY_MAP[dayOnly[1]];
    const dow = dayOfWeekKst(todayYmd);
    const diff = (target - dow + 7) % 7;
    return addDaysKst(todayYmd, diff === 0 ? 7 : diff);
  }

  return null;
}

export function diffDaysKst(startYmd: string, endYmd: string): number {
  const [y1, m1, d1] = startYmd.split('-').map(Number);
  const [y2, m2, d2] = endYmd.split('-').map(Number);
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  return Math.round((b - a) / 86400000);
}

export function buildWeekCalendarHint(todayYmd: string): string {
  const dow = dayOfWeekKst(todayYmd);
  const labels = ['일', '월', '화', '수', '목', '금', '토'];
  const thisWeek = labels.map((label, i) => {
    const date = addDaysKst(todayYmd, -dow + i);
    return `${label}=${date}`;
  });
  const nextWeekStart = addDaysKst(todayYmd, -dow + 7);
  const nextFriday = weekdayInWeek(todayYmd, 5, 1);
  return `이번주: ${thisWeek.join(', ')} / 다음주 시작=${nextWeekStart} / 다음주 금요일=${nextFriday}`;
}
