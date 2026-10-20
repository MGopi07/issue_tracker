"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

export async function getDepartmentsWithCategoriesAction() {
  await requireAuth();

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: {
      categories: {
        orderBy: { name: "asc" },
      },
    },
  });

  return departments;
}

export async function getTeamMembersAction() {
  await requireAuth();

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      departments: {
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return users;
}
