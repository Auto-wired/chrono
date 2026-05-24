'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getEvents() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const user = await prisma.user.findUnique({
    where: { userId: session.user.id }
  });

  if (!user) return [];

  const events = await prisma.event.findMany({
    where: { userId: user.userId },
    orderBy: { start: 'asc' }
  });

  return events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start.toISOString(),
    end: event.end.toISOString(),
    allDay: event.allDay,
    backgroundColor: event.backgroundColor || '#3b82f6',
  }));
}

export async function createEvent(data: {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  backgroundColor?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("인증이 필요합니다.");

  const user = await prisma.user.findUnique({
    where: { userId: session.user.id }
  });

  if (!user) throw new Error("사용자를 찾을 수 없습니다.");

  const event = await prisma.event.create({
    data: {
      title: data.title,
      start: new Date(data.start),
      end: new Date(data.end),
      allDay: data.allDay,
      backgroundColor: data.backgroundColor,
      userId: user.userId
    }
  });

  revalidatePath("/");
  return {
    ...event,
    start: event.start.toISOString(),
    end: event.end.toISOString(),
  };
}

export async function updateEvent(id: string, data: {
  title?: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  backgroundColor?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("인증이 필요합니다.");

  const updateData: any = { ...data };
  if (data.start) updateData.start = new Date(data.start);
  if (data.end) updateData.end = new Date(data.end);

  const event = await prisma.event.update({
    where: { id },
    data: updateData
  });

  revalidatePath("/");
  return {
    ...event,
    start: event.start.toISOString(),
    end: event.end.toISOString(),
  };
}

export async function deleteEvent(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("인증이 필요합니다.");

  await prisma.event.delete({
    where: { id }
  });

  revalidatePath("/");
  return { success: true };
}
