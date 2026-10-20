"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { IssueStatus, Priority } from "@/types";

export interface DashboardMetrics {
  totalIssues: number;
  openCount: number;
  inProgressCount: number;
  awaitingQaCount: number;
  resolvedClosedCount: number;
  criticalUrgentCount: number;
  kbArticlesCount: number;
  byDepartment: { name: string; code: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  recentIssues: {
    id: string;
    issueNumber: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string | Date;
    projectName: string;
    assigneeName?: string | null;
  }[];
}

export async function getDashboardMetricsAction(): Promise<DashboardMetrics> {
  await requireAuth();

  const [
    totalIssues,
    openCount,
    inProgressCount,
    awaitingQaCount,
    resolvedClosedCount,
    criticalUrgentCount,
    kbArticlesCount,
    departments,
    recentIssuesRaw,
  ] = await Promise.all([
    prisma.issue.count(),
    prisma.issue.count({ where: { status: IssueStatus.OPEN } }),
    prisma.issue.count({ where: { status: IssueStatus.IN_PROGRESS } }),
    prisma.issue.count({ where: { status: IssueStatus.RESOLVED } }),
    prisma.issue.count({
      where: {
        status: { in: [IssueStatus.VERIFIED, IssueStatus.CLOSED] },
      },
    }),
    prisma.issue.count({
      where: {
        priority: { in: [Priority.CRITICAL, Priority.URGENT] },
        status: { notIn: [IssueStatus.CLOSED, IssueStatus.VERIFIED] },
      },
    }),
    prisma.issue.count({ where: { isKnowledgeBase: true } }),
    prisma.department.findMany({
      include: {
        _count: {
          select: { issues: true },
        },
      },
    }),
    prisma.issue.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    }),
  ]);

  const byDepartment = departments.map((d) => ({
    name: d.name,
    code: d.code,
    count: d._count.issues,
  }));

  // Fetch count by priority
  const priorityCounts = await Promise.all([
    prisma.issue.count({ where: { priority: Priority.LOW } }),
    prisma.issue.count({ where: { priority: Priority.MEDIUM } }),
    prisma.issue.count({ where: { priority: Priority.HIGH } }),
    prisma.issue.count({ where: { priority: Priority.CRITICAL } }),
    prisma.issue.count({ where: { priority: Priority.URGENT } }),
  ]);

  const byPriority = [
    { priority: Priority.LOW, count: priorityCounts[0] },
    { priority: Priority.MEDIUM, count: priorityCounts[1] },
    { priority: Priority.HIGH, count: priorityCounts[2] },
    { priority: Priority.CRITICAL, count: priorityCounts[3] },
    { priority: Priority.URGENT, count: priorityCounts[4] },
  ];

  const recentIssues = recentIssuesRaw.map((issue) => ({
    id: issue.id,
    issueNumber: issue.issueNumber,
    title: issue.title,
    status: issue.status,
    priority: issue.priority,
    createdAt: issue.createdAt,
    projectName: issue.project.name,
    assigneeName: issue.assignee?.name || null,
  }));

  return {
    totalIssues,
    openCount,
    inProgressCount,
    awaitingQaCount,
    resolvedClosedCount,
    criticalUrgentCount,
    kbArticlesCount,
    byDepartment,
    byPriority,
    recentIssues,
  };
}
