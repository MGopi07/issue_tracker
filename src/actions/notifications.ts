"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function getNotificationsAction() {
  const user = await requireAuth();

  const [unreadCount, notifications] = await Promise.all([
    prisma.notification.count({
      where: { userId: user.id, isRead: false },
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    unreadCount,
    notifications,
  };
}

export async function markNotificationReadAction(notificationId: string) {
  const user = await requireAuth();

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { isRead: true },
  });

  revalidatePath("/issues");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const user = await requireAuth();

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/issues");
  revalidatePath("/dashboard");

  return { success: true };
}
