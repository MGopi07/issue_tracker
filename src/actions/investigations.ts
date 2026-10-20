"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

const investigationSchema = z.object({
  issueId: z.string().min(1, "Issue ID is required"),
  observation: z.string().min(5, "Observation is required (min 5 characters)"),
  hypothesis: z.string().optional(),
  diagnosticSteps: z.string().optional(),
  toolsUsed: z.string().optional(),
  findings: z.string().min(5, "Findings are required (min 5 characters)"),
  failedAttempts: z.string().optional(),
  evidence: z.string().optional(),
  conclusion: z.string().optional(),
});

export async function createInvestigationAction(
  prevState: unknown,
  formData: FormData
) {
  const user = await requireAuth();

  const raw = {
    issueId: formData.get("issueId"),
    observation: formData.get("observation"),
    hypothesis: formData.get("hypothesis") || undefined,
    diagnosticSteps: formData.get("diagnosticSteps") || undefined,
    toolsUsed: formData.get("toolsUsed") || undefined,
    findings: formData.get("findings"),
    failedAttempts: formData.get("failedAttempts") || undefined,
    evidence: formData.get("evidence") || undefined,
    conclusion: formData.get("conclusion") || undefined,
  };

  const validated = investigationSchema.safeParse(raw);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Validation failed.",
    };
  }

  const data = validated.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify issue exists
      const issue = await tx.issue.findUnique({
        where: { id: data.issueId },
        select: { id: true, issueNumber: true, status: true },
      });

      if (!issue) {
        throw new Error("Target issue not found.");
      }

      // 2. Create the investigation record
      const investigation = await tx.issueInvestigation.create({
        data: {
          issueId: data.issueId,
          investigatorId: user.id,
          observation: data.observation,
          hypothesis: data.hypothesis || null,
          diagnosticSteps: data.diagnosticSteps || null,
          toolsUsed: data.toolsUsed || null,
          findings: data.findings,
          failedAttempts: data.failedAttempts || null,
          evidence: data.evidence || null,
          conclusion: data.conclusion || null,
        },
      });

      // 3. Automatically advance status from OPEN to IN_PROGRESS if first investigation
      if (issue.status === "OPEN") {
        await tx.issue.update({
          where: { id: data.issueId },
          data: { status: "IN_PROGRESS", version: { increment: 1 } },
        });

        await tx.issueActivityLog.create({
          data: {
            issueId: data.issueId,
            actorId: user.id,
            action: "STATUS_CHANGED",
            fromValue: "OPEN",
            toValue: "IN_PROGRESS",
            comment: "Status automatically moved to IN_PROGRESS upon diagnostic investigation entry.",
          },
        });
      }

      // 4. Log investigation activity
      await tx.issueActivityLog.create({
        data: {
          issueId: data.issueId,
          actorId: user.id,
          action: "INVESTIGATION_ADDED",
          comment: `Added diagnostic entry: "${data.observation.slice(0, 80)}${data.observation.length > 80 ? "..." : ""}"`,
        },
      });

      return investigation;
    });

    revalidatePath(`/issues/${data.issueId}`);
    revalidatePath("/issues");

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    console.error("Create investigation entry error:", err);
    return {
      success: false,
      error: "Failed to record investigation entry. Please try again.",
    };
  }
}
