'use server';

import { google } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider-v2';

const ollamaProvider = createOllama(
  process.env.OLLAMA_BASE_URL ? { baseURL: process.env.OLLAMA_BASE_URL } : undefined
);
import { generateText, tool, stepCountIs } from 'ai';
import { createEvent, updateEvent, deleteEvent, getEvents } from '@/lib/actions';
import { findMatchingEvents, pickSingleEvent } from '@/lib/schedule-match';
import { computeRescheduledTimes } from '@/lib/schedule-reschedule';
import { todayKstDate, resolveTargetDate, buildWeekCalendarHint } from '@/lib/kst-date';
import { auth } from '@/auth';
import { z } from 'zod';

const matchedEventFields = {
  titleContains: z.string().describe('대상 일정 제목 키워드 (예: "출근", "퇴근"). 사용자가 말한 일정만 넣을 것'),
  onDate: z
    .string()
    .optional()
    .describe('대상 일정이 있는 날짜 YYYY-MM-DD (예: "오늘 출근"이면 오늘 날짜)'),
};

const eventUpdateFields = {
  title: z.string().optional().describe('새로운 일정 제목'),
  description: z.string().optional().describe('일정 내용/메모'),
  start: z.string().optional().describe('새로운 시작 시간 (KST ISO)'),
  end: z.string().optional().describe('새로운 종료 시간 (KST ISO)'),
  allDay: z.boolean().optional().describe('하루 종일 여부'),
  backgroundColor: z.string().optional().describe('배경 색상 (Hex)'),
};

export async function scheduleAction(
  prompt: string,
  modelType: string = 'gemini'
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: '인증이 필요합니다.' };
  }

  const trimmed = prompt.trim();
  if (!trimmed) {
    return { success: false, error: '요청 내용을 입력해 주세요.' };
  }

  let model;
  switch (modelType) {
    case 'ollama':
      model = ollamaProvider('gemma4:e4b');
      break;
    case 'gemini':
    default:
      model = google('gemini-2.5-flash');
      break;
  }

  const today = todayKstDate();
  const weekHint = buildWeekCalendarHint(today);

  try {
    await generateText({
      model,
      messages: [{ role: 'user', content: trimmed }],
      system: `당신은 일정 관리 도우미입니다. 요청된 일정 작업만 수행하세요.
현재 시각(KST): ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
오늘 날짜(KST): ${today}
${weekHint}

[일정 수정/삭제 규칙]
1. 날짜만 옮길 때(미루기, ~일로 변경): rescheduleMatchedEvent 를 사용하세요. 시각은 자동 유지됩니다.
2. 제목 키워드 하나만 변경 대상으로 하세요 (출근만 → "출근", 퇴근 건드리지 않음).
3. onDate: 대상 일정이 있는 날짜 (오늘 → ${today}).
4. targetDate: "5월28일", "이번주금요일", "2026-05-28", "내일" 등 그대로 넣으면 서버가 YYYY-MM-DD로 변환합니다.
5. 시간만 바꿀 때: updateMatchedEvent + start/end 명시.
6. getEvents로 확인 후 한 건만 처리.

[시간 형식] KST ISO (예: ${today}T08:00:00+09:00)`,
      stopWhen: stepCountIs(7),
      tools: {
        getEvents: tool({
          description: '현재 저장된 모든 일정을 가져옵니다. 수정/삭제 전에 먼저 호출하세요.',
          inputSchema: z.object({}),
          execute: async (): Promise<unknown> => {
            try {
              return await getEvents(userId);
            } catch (e) {
              return { error: e instanceof Error ? e.message : '일정 조회 실패' };
            }
          },
        }),
        createEvent: tool({
          description: '새로운 일정을 추가합니다.',
          inputSchema: z.object({
            title: z.string().describe('일정 제목'),
            description: z.string().optional().describe('일정 내용'),
            start: z.string().describe('시작 시간 (KST ISO)'),
            end: z.string().describe('종료 시간 (KST ISO)'),
            allDay: z.boolean().default(false).describe('하루 종일 여부'),
            backgroundColor: z.string().optional().describe('배경 색상 (Hex)'),
          }),
          execute: async (args): Promise<unknown> => {
            try {
              return await createEvent(args, userId);
            } catch (e) {
              return { error: e instanceof Error ? e.message : '일정 추가 실패' };
            }
          },
        }),
        rescheduleMatchedEvent: tool({
          description:
            '일정 날짜만 변경(미루기/당기기). 시각은 유지됩니다. "이번주 금요일", "5월 28일" 등 targetDate에 자연어 가능.',
          inputSchema: z.object({
            ...matchedEventFields,
            targetDate: z
              .string()
              .describe(
                '이동할 날짜. YYYY-MM-DD 또는 "5월28일", "이번주금요일", "내일", "다음주월요일" 등'
              ),
          }),
          execute: async ({ titleContains, onDate, targetDate }): Promise<unknown> => {
            try {
              const resolved = resolveTargetDate(targetDate, today);
              if (!resolved) {
                return {
                  error: `날짜를 이해하지 못했습니다: "${targetDate}". YYYY-MM-DD 또는 이번주금요일 형식으로 다시 시도하세요.`,
                };
              }

              const events = await getEvents(userId);
              const candidates = findMatchingEvents(events, { titleContains, onDate });
              const picked = pickSingleEvent(candidates, titleContains);
              if ('error' in picked) return picked;

              const { start, end } = computeRescheduledTimes(picked.event, resolved);
              return await updateEvent(
                picked.event.id,
                { start, end },
                userId
              );
            } catch (e) {
              return { error: e instanceof Error ? e.message : '일정 날짜 변경 실패' };
            }
          },
        }),
        updateMatchedEvent: tool({
          description:
            '제목 키워드로 일정 하나만 찾아 수정합니다. 날짜 이동은 rescheduleMatchedEvent 사용.',
          inputSchema: z.object({
            ...matchedEventFields,
            ...eventUpdateFields,
          }),
          execute: async ({ titleContains, onDate, ...updates }): Promise<unknown> => {
            try {
              const events = await getEvents(userId);
              const candidates = findMatchingEvents(events, { titleContains, onDate });
              const picked = pickSingleEvent(candidates, titleContains);
              if ('error' in picked) return picked;

              const payload = Object.fromEntries(
                Object.entries(updates).filter(([, v]) => v !== undefined)
              );
              if (Object.keys(payload).length === 0) {
                return { error: '변경할 내용이 없습니다.' };
              }

              return await updateEvent(picked.event.id, payload, userId);
            } catch (e) {
              return { error: e instanceof Error ? e.message : '일정 수정 실패' };
            }
          },
        }),
        deleteMatchedEvent: tool({
          description:
            '제목 키워드로 일정 하나만 찾아 삭제합니다. 사용자가 말한 일정 키워드만 titleContains에 넣으세요.',
          inputSchema: z.object({ ...matchedEventFields }),
          execute: async ({ titleContains, onDate }): Promise<unknown> => {
            try {
              const events = await getEvents(userId);
              const candidates = findMatchingEvents(events, { titleContains, onDate });
              const picked = pickSingleEvent(candidates, titleContains);
              if ('error' in picked) return picked;

              return await deleteEvent(picked.event.id, userId);
            } catch (e) {
              return { error: e instanceof Error ? e.message : '일정 삭제 실패' };
            }
          },
        }),
        updateEvent: tool({
          description: 'ID가 확실할 때만 사용.',
          inputSchema: z.object({
            id: z.string().describe('수정할 일정의 ID'),
            ...eventUpdateFields,
          }),
          execute: async ({ id, ...data }): Promise<unknown> => {
            try {
              return await updateEvent(id, data, userId);
            } catch (e) {
              return { error: e instanceof Error ? e.message : '일정 수정 실패' };
            }
          },
        }),
        deleteEvent: tool({
          description: 'ID가 확실할 때만 사용.',
          inputSchema: z.object({
            id: z.string().describe('삭제할 일정의 ID'),
          }),
          execute: async ({ id }): Promise<unknown> => {
            try {
              return await deleteEvent(id, userId);
            } catch (e) {
              return { error: e instanceof Error ? e.message : '일정 삭제 실패' };
            }
          },
        }),
      },
    });

    return { success: true };
  } catch (e) {
    console.error('scheduleAction error:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : '일정 처리에 실패했습니다.',
    };
  }
}
