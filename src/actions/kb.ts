"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export interface KbFilterParams {
  search?: string;
  departmentId?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}

export async function getKnowledgeBaseAction(params: KbFilterParams = {}) {
  await requireAuth();

  const { search, departmentId, categoryId, page = 1, pageSize = 12 } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.IssueWhereInput = {
    isKnowledgeBase: true,
  };

  if (departmentId) {
    where.departmentId = departmentId;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { kbSummary: { contains: q } },
      { issueNumber: { contains: q } },
      {
        resolution: {
          OR: [
            { rootCause: { contains: q } },
            { permanentSolution: { contains: q } },
            { workaround: { contains: q } },
          ],
        },
      },
    ];
  }

  const [totalCount, issues] = await Promise.all([
    prisma.issue.count({ where }),
    prisma.issue.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
      include: {
        project: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true } },
        resolution: {
          include: {
            resolver: { select: { id: true, name: true } },
            verifier: { select: { id: true, name: true } },
          },
        },
        tags: {
          include: { tag: true },
        },
      },
    }),
  ]);

  return {
    issues,
    pagination: {
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
}

export async function promoteIssueToKbAction(
  issueId: string,
  kbSummary: string
) {
  const user = await requireAuth();

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const issue = await tx.issue.findUnique({
        where: { id: issueId },
        include: { resolution: true },
      });

      if (!issue) {
        throw new Error("Issue not found.");
      }

      if (!issue.resolution) {
        throw new Error("Cannot promote an issue without a documented resolution.");
      }

      const res = await tx.issue.update({
        where: { id: issueId },
        data: {
          isKnowledgeBase: true,
          kbSummary: kbSummary || issue.resolution.permanentSolution.slice(0, 300),
          version: { increment: 1 },
        },
      });

      await tx.issueActivityLog.create({
        data: {
          issueId,
          actorId: user.id,
          action: "PROMOTED_TO_KB",
          comment: "Promoted to corporate technical knowledge base.",
        },
      });

      return res;
    });

    revalidatePath(`/issues/${issueId}`);
    revalidatePath("/knowledge-base");

    return {
      success: true,
      data: updated,
    };
  } catch (err: unknown) {
    console.error("Promote to KB error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to promote to Knowledge Base.",
    };
  }
}
