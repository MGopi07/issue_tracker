"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

export async function getTeamDirectoryAction() {
  await requireAuth();

  const [departments, users] = await Promise.all([
    prisma.department.findMany({
      orderBy: { name: "asc" },
      include: {
        categories: { orderBy: { name: "asc" } },
        _count: {
          select: {
            issues: true,
            users: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        departments: {
          include: {
            department: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        _count: {
          select: {
            assignedIssues: true,
            createdIssues: true,
          },
        },
      },
    }),
  ]);

  return {
    departments,
    users,
  };
}
