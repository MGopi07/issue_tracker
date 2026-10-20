"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { RelationType } from "@/types";
import { revalidatePath } from "next/cache";

const INVERSE_RELATIONS: Record<string, string> = {
  [RelationType.BLOCKS]: RelationType.IS_BLOCKED_BY,
  [RelationType.IS_BLOCKED_BY]: RelationType.BLOCKS,
  [RelationType.DUPLICATES]: RelationType.IS_DUPLICATED_BY,
  [RelationType.IS_DUPLICATED_BY]: RelationType.DUPLICATES,
  [RelationType.RELATES_TO]: RelationType.RELATES_TO,
};

const relationSchema = z.object({
  sourceIssueId: z.string().min(1),
  targetIdentifier: z.string().min(1, "Target issue number or ID is required"),
  type: z.enum([
    RelationType.BLOCKS,
    RelationType.IS_BLOCKED_BY,
    RelationType.DUPLICATES,
    RelationType.IS_DUPLICATED_BY,
    RelationType.RELATES_TO,
  ]),
});

export async function addIssueRelationAction(
  prevState: unknown,
  formData: FormData
) {
  const user = await requireAuth();

  const raw = {
    sourceIssueId: formData.get("sourceIssueId"),
    targetIdentifier: formData.get("targetIdentifier"),
    type: formData.get("type"),
  };

  const validated = relationSchema.safeParse(raw);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Validation failed.",
    };
  }

  const { sourceIssueId, targetIdentifier, type } = validated.data;

  try {
    const relation = await prisma.$transaction(async (tx) => {
      // Find source issue
      const sourceIssue = await tx.issue.findUnique({
        where: { id: sourceIssueId },
        select: { id: true, issueNumber: true },
      });

      if (!sourceIssue) {
        throw new Error("Source issue not found.");
      }

      // Find target issue by ID or issueNumber (e.g. ISS-2026-0002)
      const targetIssue = await tx.issue.findFirst({
        where: {
          OR: [
            { id: targetIdentifier },
            { issueNumber: targetIdentifier.trim().toUpperCase() },
          ],
        },
        select: { id: true, issueNumber: true, title: true },
      });

      if (!targetIssue) {
        throw new Error(`Target issue "${targetIdentifier}" not found. Verify issue number format.`);
      }

      if (sourceIssue.id === targetIssue.id) {
        throw new Error("An issue cannot be linked to itself.");
      }

      // Check if relation already exists
      const existing = await tx.issueRelation.findUnique({
        where: {
          sourceIssueId_targetIssueId_type: {
            sourceIssueId: sourceIssue.id,
            targetIssueId: targetIssue.id,
            type,
          },
        },
      });

      if (existing) {
        throw new Error("This relation is already established between these issues.");
      }

      // Create primary relation
      const primaryRelation = await tx.issueRelation.create({
        data: {
          sourceIssueId: sourceIssue.id,
          targetIssueId: targetIssue.id,
          type,
        },
      });

      // Also create symmetric inverse relation if not identical
      const inverseType = INVERSE_RELATIONS[type];
      if (inverseType) {
        await tx.issueRelation.upsert({
          where: {
            sourceIssueId_targetIssueId_type: {
              sourceIssueId: targetIssue.id,
              targetIssueId: sourceIssue.id,
              type: inverseType,
            },
          },
          update: {},
          create: {
            sourceIssueId: targetIssue.id,
            targetIssueId: sourceIssue.id,
            type: inverseType,
          },
        });
      }

      // Audit log on source issue
      await tx.issueActivityLog.create({
        data: {
          issueId: sourceIssue.id,
          actorId: user.id,
          action: "RELATION_ADDED",
          comment: `Linked ${type.replace(/_/g, " ")} ${targetIssue.issueNumber} ("${targetIssue.title}").`,
        },
      });

      // Audit log on target issue
      await tx.issueActivityLog.create({
        data: {
          issueId: targetIssue.id,
          actorId: user.id,
          action: "RELATION_ADDED",
          comment: `Linked ${inverseType?.replace(/_/g, " ") || type} ${sourceIssue.issueNumber}.`,
        },
      });

      return primaryRelation;
    });

    revalidatePath(`/issues/${sourceIssueId}`);
    revalidatePath("/issues");

    return {
      success: true,
      data: relation,
    };
  } catch (err) {
    console.error("Add issue relation error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to link issues.",
    };
  }
}

export async function removeIssueRelationAction(relationId: string) {
  const user = await requireAuth();

  try {
    await prisma.$transaction(async (tx) => {
      const relation = await tx.issueRelation.findUnique({
        where: { id: relationId },
        include: {
          sourceIssue: { select: { id: true, issueNumber: true } },
          targetIssue: { select: { id: true, issueNumber: true } },
        },
      });

      if (!relation) {
        throw new Error("Relation not found.");
      }

      // Delete primary
      await tx.issueRelation.delete({
        where: { id: relationId },
      });

      // Delete inverse if exists
      const inverseType = INVERSE_RELATIONS[relation.type];
      if (inverseType) {
        await tx.issueRelation.deleteMany({
          where: {
            sourceIssueId: relation.targetIssueId,
            targetIssueId: relation.sourceIssueId,
            type: inverseType,
          },
        });
      }

      // Audit logs
      await tx.issueActivityLog.create({
        data: {
          issueId: relation.sourceIssueId,
          actorId: user.id,
          action: "RELATION_REMOVED",
          comment: `Removed ${relation.type.replace(/_/g, " ")} link to ${relation.targetIssue.issueNumber}.`,
        },
      });
    });

    return { success: true };
  } catch (err) {
    console.error("Remove issue relation error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to remove link.",
    };
  }
}
