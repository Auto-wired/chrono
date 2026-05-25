'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { parseScheduleDateTime, formatScheduleDateTime } from "@/lib/datetime";
import { DEFAULT_EVENT_COLOR, normalizeStoredColor, resolveEventColor } from "@/lib/event-colors";

export async function getEvents(overrideUserId?: string) {
  let finalUserId = overrideUserId;
  if (!finalUserId) {
    const session = await auth();
    finalUserId = session?.user?.id;
  }
  if (!finalUserId) return [];

  const user = await prisma.user.findUnique({
    where: { userId: finalUserId }
  });

  if (!user) return [];

  const events = await prisma.event.findMany({
    where: { userId: user.userId },
    orderBy: { start: 'asc' }
  });

  return events.map(event => ({
    id: event.id,
    title: event.title,
    description: event.description ?? '',
    start: formatScheduleDateTime(event.start, event.allDay),
    end: formatScheduleDateTime(event.end, event.allDay),
    allDay: event.allDay,
    backgroundColor: normalizeStoredColor(event.backgroundColor),
  }));
}

export async function createEvent(data: {
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay: boolean;
  backgroundColor?: string;
}, overrideUserId?: string) {
  let finalUserId = overrideUserId;
  if (!finalUserId) {
    const session = await auth();
    finalUserId = session?.user?.id;
  }
  if (!finalUserId) throw new Error("인증이 필요합니다.");

  const user = await prisma.user.findUnique({
    where: { userId: finalUserId }
  });

  if (!user) throw new Error("사용자를 찾을 수 없습니다.");

  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description || null,
      start: parseScheduleDateTime(data.start),
      end: parseScheduleDateTime(data.end),
      allDay: data.allDay,
      backgroundColor: resolveEventColor(undefined, data.backgroundColor),
      userId: user.userId
    }
  });

  revalidatePath("/");
  return {
    ...event,
    start: formatScheduleDateTime(event.start, event.allDay),
    end: formatScheduleDateTime(event.end, event.allDay),
  };
}

export async function updateEvent(id: string, data: {
  title?: string;
  description?: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  backgroundColor?: string;
}, overrideUserId?: string) {
  let finalUserId = overrideUserId;
  if (!finalUserId) {
    const session = await auth();
    finalUserId = session?.user?.id;
  }
  if (!finalUserId) throw new Error("인증이 필요합니다.");

  const user = await prisma.user.findUnique({
    where: { userId: finalUserId },
  });
  if (!user) throw new Error("사용자를 찾을 수 없습니다.");

  const updateData: Record<string, unknown> = { ...data };
  if (data.description !== undefined) {
    updateData.description = data.description.trim() || null;
  }
  if (data.backgroundColor !== undefined) {
    updateData.backgroundColor = resolveEventColor(undefined, data.backgroundColor);
  }
  if (data.start) updateData.start = parseScheduleDateTime(data.start);
  if (data.end) updateData.end = parseScheduleDateTime(data.end);

  const updated = await prisma.event.updateMany({
    where: { id, userId: user.userId },
    data: updateData,
  });
  if (updated.count === 0) throw new Error("일정을 찾을 수 없습니다.");

  const event = await prisma.event.findUniqueOrThrow({ where: { id } });

  revalidatePath("/");
  return {
    ...event,
    start: formatScheduleDateTime(event.start, event.allDay),
    end: formatScheduleDateTime(event.end, event.allDay),
  };
}

export async function deleteEvent(id: string, overrideUserId?: string) {
  let finalUserId = overrideUserId;
  if (!finalUserId) {
    const session = await auth();
    finalUserId = session?.user?.id;
  }
  if (!finalUserId) throw new Error("인증이 필요합니다.");

  const user = await prisma.user.findUnique({
    where: { userId: finalUserId },
  });
  if (!user) throw new Error("사용자를 찾을 수 없습니다.");

  const deleted = await prisma.event.deleteMany({
    where: { id, userId: user.userId },
  });
  if (deleted.count === 0) throw new Error("일정을 찾을 수 없습니다.");

  revalidatePath("/");
  return { success: true };
}
