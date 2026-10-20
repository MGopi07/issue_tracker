"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

export async function getRcaReportsAction() {
  await requireAuth();

  const [resolvedIssues, allDepartments] = await Promise.all([
    prisma.issue.findMany({
      where: {
        resolution: { isNot: null },
      },
      orderBy: { resolvedAt: "desc" },
      include: {
        project: { select: { name: true, code: true } },
        department: { select: { name: true, code: true } },
        category: { select: { name: true } },
        resolution: {
          include: {
            resolver: { select: { name: true } },
            verifier: { select: { name: true } },
          },
        },
      },
    }),
    prisma.department.findMany({
      include: {
        _count: {
          select: { issues: true },
        },
      },
    }),
  ]);

  // Calculate resolution metrics per department
  const departmentMetrics = allDepartments.map((dept) => {
    const total = dept._count.issues;
    const resolvedInDept = resolvedIssues.filter(
      (i) => i.department.code === dept.code
    );
    const resolvedCount = resolvedInDept.length;
    const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

    // Estimate avg resolution time in hours
    let avgHours = 0;
    if (resolvedCount > 0) {
      const totalMs = resolvedInDept.reduce((acc, issue) => {
        const start = new Date(issue.createdAt).getTime();
        const end = issue.resolvedAt ? new Date(issue.resolvedAt).getTime() : Date.now();
        return acc + (end - start);
      }, 0);
      avgHours = Math.round(totalMs / (1000 * 60 * 60 * resolvedCount));
    }

    return {
      name: dept.name,
      code: dept.code,
      totalIssues: total,
      resolvedCount,
      resolutionRate,
      avgResolutionHours: avgHours,
    };
  });

  return {
    resolvedIssues,
    departmentMetrics,
  };
}
