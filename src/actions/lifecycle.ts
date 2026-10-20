"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { IssueStatus, Role } from "@/types";
import { revalidatePath } from "next/cache";

const VALID_TRANSITIONS: Record<string, string[]> = {
  [IssueStatus.OPEN]: [
    IssueStatus.IN_PROGRESS,
    IssueStatus.BLOCKED,
    IssueStatus.CLOSED,
    IssueStatus.DUPLICATE,
  ],
  [IssueStatus.ASSIGNED]: [
    IssueStatus.IN_PROGRESS,
    IssueStatus.BLOCKED,
    IssueStatus.RESOLVED,
    IssueStatus.OPEN,
  ],
  [IssueStatus.IN_PROGRESS]: [
    IssueStatus.RESOLVED,
    IssueStatus.BLOCKED,
    IssueStatus.OPEN,
  ],
  [IssueStatus.BLOCKED]: [
    IssueStatus.IN_PROGRESS,
    IssueStatus.OPEN,
  ],
  [IssueStatus.RESOLVED]: [
    IssueStatus.VERIFIED,
    IssueStatus.REOPENED,
    IssueStatus.CLOSED,
  ],
  [IssueStatus.VERIFIED]: [
    IssueStatus.CLOSED,
    IssueStatus.REOPENED,
  ],
  [IssueStatus.REOPENED]: [
    IssueStatus.IN_PROGRESS,
    IssueStatus.BLOCKED,
  ],
  [IssueStatus.CLOSED]: [
    IssueStatus.REOPENED,
  ],
  [IssueStatus.DUPLICATE]: [
    IssueStatus.OPEN,
    IssueStatus.REOPENED,
  ],
};

const transitionSchema = z.object({
  issueId: z.string().min(1),
  nextStatus: z.string().min(1),
  comment: z.string().optional(),
});

export async function transitionIssueStatusAction(
  prevState: unknown,
  formData: FormData
) {
  const user = await requireAuth();

  const raw = {
    issueId: formData.get("issueId"),
    nextStatus: formData.get("nextStatus"),
    comment: formData.get("comment") || undefined,
  };

  const validated = transitionSchema.safeParse(raw);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Validation failed.",
    };
  }

  const { issueId, nextStatus, comment } = validated.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const issue = await tx.issue.findUnique({
        where: { id: issueId },
        include: { resolution: true },
      });

      if (!issue) {
        throw new Error("Issue not found.");
      }

      // Check transition validity
      const allowed = VALID_TRANSITIONS[issue.status] || [];
      const isAdminOrPm =
        user.role === Role.ADMIN ||
        user.role === Role.SUPER_ADMIN ||
        user.role === Role.PROJECT_MANAGER;

      if (!allowed.includes(nextStatus) && !isAdminOrPm) {
        throw new Error(
          `Invalid state transition: Cannot transition from ${issue.status} to ${nextStatus}.`
        );
      }

      // If transitioning to RESOLVED, ensure resolution is submitted
      if (nextStatus === IssueStatus.RESOLVED && !issue.resolution) {
        throw new Error(
          "Cannot mark as RESOLVED without submitting root cause and permanent fix documentation."
        );
      }

      // Update issue status
      const updatedIssue = await tx.issue.update({
        where: { id: issueId },
        data: {
          status: nextStatus,
          resolvedAt:
            nextStatus === IssueStatus.RESOLVED && !issue.resolvedAt
              ? new Date()
              : issue.resolvedAt,
          version: { increment: 1 },
        },
      });

      // Audit log
      await tx.issueActivityLog.create({
        data: {
          issueId,
          actorId: user.id,
          action: "STATUS_CHANGED",
          fromValue: issue.status,
          toValue: nextStatus,
          comment:
            comment ||
            `Status transitioned from ${issue.status} to ${nextStatus}${
              !allowed.includes(nextStatus) && isAdminOrPm ? " (Administrative Override)" : ""
            }.`,
        },
      });

      return updatedIssue;
    });

    revalidatePath(`/issues/${issueId}`);
    revalidatePath("/issues");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: updated,
    };
  } catch (err: unknown) {
    console.error("Transition issue status error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update status.",
    };
  }
}
