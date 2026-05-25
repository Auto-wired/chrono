export const DEFAULT_EVENT_COLOR = '#3b82f6';

export const EVENT_COLORS = [
  { name: '블루', value: '#3b82f6' },
  { name: '인디고', value: '#6366f1' },
  { name: '바이올렛', value: '#8b5cf6' },
  { name: '핑크', value: '#ec4899' },
  { name: '레드', value: '#ef4444' },
  { name: '오렌지', value: '#f97316' },
  { name: '앰버', value: '#f59e0b' },
  { name: '그린', value: '#22c55e' },
  { name: '틸', value: '#14b8a6' },
  { name: '슬레이트', value: '#64748b' },
] as const;

export const EVENT_COLOR_NAMES = EVENT_COLORS.map((c) => c.name) as [
  (typeof EVENT_COLORS)[number]['name'],
  ...(typeof EVENT_COLORS)[number]['name'][],
];

const COLOR_ALIASES: Record<string, (typeof EVENT_COLORS)[number]['value']> = {
  blue: '#3b82f6',
  블루: '#3b82f6',
  indigo: '#6366f1',
  인디고: '#6366f1',
  violet: '#8b5cf6',
  purple: '#8b5cf6',
  바이올렛: '#8b5cf6',
  보라: '#8b5cf6',
  pink: '#ec4899',
  핑크: '#ec4899',
  분홍: '#ec4899',
  red: '#ef4444',
  레드: '#ef4444',
  빨강: '#ef4444',
  orange: '#f97316',
  오렌지: '#f97316',
  주황: '#f97316',
  amber: '#f59e0b',
  앰버: '#f59e0b',
  노랑: '#f59e0b',
  green: '#22c55e',
  그린: '#22c55e',
  초록: '#22c55e',
  teal: '#14b8a6',
  틸: '#14b8a6',
  slate: '#64748b',
  슬레이트: '#64748b',
  회색: '#64748b',
};

/** UI·AI 공통 — 팔레트 색상만 허용 */
export function resolveEventColor(
  colorName?: string,
  backgroundColor?: string
): string {
  const name = colorName?.trim();
  if (name) {
    const byName = EVENT_COLORS.find((c) => c.name === name);
    if (byName) return byName.value;
  }

  const raw = backgroundColor?.trim();
  if (raw) {
    const byValue = EVENT_COLORS.find(
      (c) => c.value.toLowerCase() === raw.toLowerCase()
    );
    if (byValue) return byValue.value;

    const alias = COLOR_ALIASES[raw.toLowerCase()];
    if (alias) return alias;
  }

  return DEFAULT_EVENT_COLOR;
}

export function formatPaletteForPrompt(): string {
  return EVENT_COLORS.map((c) => `${c.name}=${c.value}`).join(', ');
}

/** DB/캘린더 표시용 — 팔레트에 없으면 기본색 */
export function normalizeStoredColor(value?: string | null): string {
  if (!value) return DEFAULT_EVENT_COLOR;
  return resolveEventColor(undefined, value);
}
