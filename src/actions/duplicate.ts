"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { Prisma } from "@prisma/client";

export interface SimilarIssueResult {
  id: string;
  issueNumber: string;
  title: string;
  status: string;
  priority: string;
  isKnowledgeBase: boolean;
  resolutionSummary?: string | null;
  projectName: string;
}

const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "for", "to", "of", "with", "and", "or", "is", "are", "was",
  "were", "this", "that", "it", "not", "be", "from", "by", "as", "into", "when", "how", "why",
]);

export async function findSimilarIssuesAction(
  query: string,
  projectId?: string
): Promise<SimilarIssueResult[]> {
  await requireAuth();

  if (!query || query.trim().length < 3) {
    return [];
  }

  // Extract meaningful tokens
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
    .slice(0, 5);

  if (tokens.length === 0) {
    return [];
  }

  // Match any token in title or description
  const where: Prisma.IssueWhereInput = {
    OR: tokens.map((token) => ({
      OR: [
        { title: { contains: token } },
        { description: { contains: token } },
        { errorMessages: { contains: token } },
      ],
    })),
  };

  if (projectId) {
    where.projectId = projectId;
  }

  const issues = await prisma.issue.findMany({
    where,
    take: 5,
    orderBy: { updatedAt: "desc" },
    include: {
      project: { select: { name: true } },
      resolution: { select: { rootCause: true, permanentSolution: true } },
    },
  });

  return issues.map((issue) => ({
    id: issue.id,
    issueNumber: issue.issueNumber,
    title: issue.title,
    status: issue.status,
    priority: issue.priority,
    isKnowledgeBase: issue.isKnowledgeBase,
    projectName: issue.project.name,
    resolutionSummary:
      issue.resolution?.permanentSolution ||
      issue.resolution?.rootCause ||
      null,
  }));
}
