"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

const resolutionSchema = z.object({
  issueId: z.string().min(1, "Issue ID is required"),
  rootCause: z.string().min(10, "Root cause analysis must be at least 10 characters"),
  permanentSolution: z.string().min(10, "Permanent solution description must be at least 10 characters"),
  workaround: z.string().optional(),
  filesChanged: z.string().optional(),
  configChanges: z.string().optional(),
  databaseChanges: z.string().optional(),
  deploymentSteps: z.string().optional(),
  regressionPrevention: z.string().optional(),
  verificationChecklist: z.string().optional(),
  metricsBeforeAfter: z.string().optional(),
  finalSummary: z.string().optional(),
});

export async function submitResolutionAction(
  prevState: unknown,
  formData: FormData
) {
  const user = await requireAuth();

  const raw = {
    issueId: formData.get("issueId"),
    rootCause: formData.get("rootCause"),
    permanentSolution: formData.get("permanentSolution"),
    workaround: formData.get("workaround") || undefined,
    filesChanged: formData.get("filesChanged") || undefined,
    configChanges: formData.get("configChanges") || undefined,
    databaseChanges: formData.get("databaseChanges") || undefined,
    deploymentSteps: formData.get("deploymentSteps") || undefined,
    regressionPrevention: formData.get("regressionPrevention") || undefined,
    verificationChecklist: formData.get("verificationChecklist") || undefined,
    metricsBeforeAfter: formData.get("metricsBeforeAfter") || undefined,
    finalSummary: formData.get("finalSummary") || undefined,
  };

  const validated = resolutionSchema.safeParse(raw);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Validation failed.",
    };
  }

  const data = validated.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const issue = await tx.issue.findUnique({
        where: { id: data.issueId },
        select: { id: true, status: true, issueNumber: true, createdById: true },
      });

      if (!issue) {
        throw new Error("Target issue not found.");
      }

      // Upsert resolution (in case updating existing draft)
      const resolution = await tx.issueResolution.upsert({
        where: { issueId: data.issueId },
        create: {
          issueId: data.issueId,
          resolverId: user.id,
          rootCause: data.rootCause,
          permanentSolution: data.permanentSolution,
          workaround: data.workaround || null,
          filesChanged: data.filesChanged || null,
          configChanges: data.configChanges || null,
          databaseChanges: data.databaseChanges || null,
          deploymentSteps: data.deploymentSteps || null,
          regressionPrevention: data.regressionPrevention || null,
          verificationChecklist: data.verificationChecklist || null,
          metricsBeforeAfter: data.metricsBeforeAfter || null,
          finalSummary: data.finalSummary || null,
        },
        update: {
          resolverId: user.id,
          rootCause: data.rootCause,
          permanentSolution: data.permanentSolution,
          workaround: data.workaround || null,
          filesChanged: data.filesChanged || null,
          configChanges: data.configChanges || null,
          databaseChanges: data.databaseChanges || null,
          deploymentSteps: data.deploymentSteps || null,
          regressionPrevention: data.regressionPrevention || null,
          verificationChecklist: data.verificationChecklist || null,
          metricsBeforeAfter: data.metricsBeforeAfter || null,
          finalSummary: data.finalSummary || null,
          // Reset verification status if resolution is modified
          verificationPassed: null,
          verifiedAt: null,
          verifierId: null,
        },
      });

      // Update issue status to RESOLVED
      const oldStatus = issue.status;
      await tx.issue.update({
        where: { id: data.issueId },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
          version: { increment: 1 },
        },
      });

      // Audit log
      await tx.issueActivityLog.create({
        data: {
          issueId: data.issueId,
          actorId: user.id,
          action: "RESOLUTION_SUBMITTED",
          fromValue: oldStatus,
          toValue: "RESOLVED",
          comment: `Submitted root cause and permanent fix documentation. Issue marked as RESOLVED.`,
        },
      });

      // Notify issue creator / reporter
      if (issue.createdById !== user.id) {
        await tx.notification.create({
          data: {
            userId: issue.createdById,
            title: `Issue Resolved: ${issue.issueNumber}`,
            message: `${user.name} submitted a resolution for "${issue.issueNumber}". Ready for verification.`,
            linkUrl: `/issues/${issue.id}`,
          },
        });
      }

      return resolution;
    });

    revalidatePath(`/issues/${data.issueId}`);
    revalidatePath("/issues");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    console.error("Submit resolution error:", err);
    return {
      success: false,
      error: "Failed to submit resolution. Please try again.",
    };
  }
}

const verifySchema = z.object({
  issueId: z.string().min(1),
  passed: z.enum(["true", "false"]),
  notes: z.string().min(5, "Verification notes must be at least 5 characters"),
  promoteToKb: z.enum(["true", "false"]).optional(),
});

export async function verifyResolutionAction(
  prevState: unknown,
  formData: FormData
) {
  const user = await requireAuth();

  const raw = {
    issueId: formData.get("issueId"),
    passed: formData.get("passed"),
    notes: formData.get("notes"),
    promoteToKb: formData.get("promoteToKb") || "false",
  };

  const validated = verifySchema.safeParse(raw);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Validation failed.",
    };
  }

  const { issueId, passed, notes, promoteToKb } = validated.data;
  const isPassed = passed === "true";
  const shouldPromote = promoteToKb === "true";

  try {
    const result = await prisma.$transaction(async (tx) => {
      const issue = await tx.issue.findUnique({
        where: { id: issueId },
        include: { resolution: true },
      });

      if (!issue || !issue.resolution) {
        throw new Error("No resolution exists for this issue to verify.");
      }

      // Update the resolution with QA sign-off
      const updatedResolution = await tx.issueResolution.update({
        where: { issueId },
        data: {
          verifierId: user.id,
          verifiedAt: new Date(),
          verificationPassed: isPassed,
          verificationNotes: notes,
        },
      });

      const nextStatus = isPassed ? "VERIFIED" : "IN_PROGRESS";

      await tx.issue.update({
        where: { id: issueId },
        data: {
          status: nextStatus,
          isKnowledgeBase: isPassed && shouldPromote ? true : issue.isKnowledgeBase,
          kbSummary:
            isPassed && shouldPromote
              ? issue.resolution.finalSummary || issue.resolution.permanentSolution.slice(0, 300)
              : issue.kbSummary,
          version: { increment: 1 },
        },
      });

      // Audit log
      await tx.issueActivityLog.create({
        data: {
          issueId,
          actorId: user.id,
          action: isPassed ? "RESOLUTION_VERIFIED" : "RESOLUTION_REJECTED",
          fromValue: issue.status,
          toValue: nextStatus,
          comment: isPassed
            ? `QA verification PASSED: ${notes}`
            : `QA verification FAILED / REJECTED: ${notes}`,
        },
      });

      // Notify resolver
      if (issue.resolution.resolverId !== user.id) {
        await tx.notification.create({
          data: {
            userId: issue.resolution.resolverId,
            title: isPassed
              ? `Verification Passed: ${issue.issueNumber}`
              : `Verification Rejected: ${issue.issueNumber}`,
            message: `${user.name} reviewed your resolution. Outcome: ${isPassed ? "PASSED" : "NEEDS REWORK"}.`,
            linkUrl: `/issues/${issue.id}`,
          },
        });
      }

      return updatedResolution;
    });

    revalidatePath(`/issues/${issueId}`);
    revalidatePath("/issues");
    revalidatePath("/knowledge-base");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    console.error("Verify resolution error:", err);
    return {
      success: false,
      error: "Failed to record verification. Please try again.",
    };
  }
}
