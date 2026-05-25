export type ScheduleEvent = {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay: boolean;
  backgroundColor?: string;
};

export function findMatchingEvents(
  events: ScheduleEvent[],
  options: { titleContains: string; onDate?: string }
): ScheduleEvent[] {
  const keyword = options.titleContains.trim().toLowerCase();
  if (!keyword) return [];

  let candidates = events.filter((e) => e.title.toLowerCase().includes(keyword));

  if (options.onDate) {
    const date = options.onDate.trim();
    candidates = candidates.filter(
      (e) => e.start.startsWith(date) || e.start.split('T')[0] === date
    );
  }

  return candidates;
}

export function pickSingleEvent(
  candidates: ScheduleEvent[],
  titleContains: string
): { event: ScheduleEvent } | { error: string } {
  if (candidates.length === 0) {
    return { error: '조건에 맞는 일정을 찾지 못했습니다.' };
  }

  if (candidates.length === 1) {
    return { event: candidates[0] };
  }

  const keyword = titleContains.trim().toLowerCase();
  const exact = candidates.filter((e) => e.title.toLowerCase() === keyword);
  if (exact.length === 1) {
    return { event: exact[0] };
  }

  const shortest = [...candidates].sort((a, b) => a.title.length - b.title.length)[0];
  const shortestMatches = candidates.filter((e) => e.title.length === shortest.title.length);
  if (shortestMatches.length === 1) {
    return { event: shortest };
  }

  const list = candidates.map((e) => `"${e.title}" (id: ${e.id})`).join(', ');
  return {
    error: `여러 일정이 매칭되었습니다. 하나만 지정해 주세요: ${list}`,
  };
}
