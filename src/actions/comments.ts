"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

const commentSchema = z.object({
  issueId: z.string().min(1),
  content: z.string().min(2, "Comment content must be at least 2 characters"),
  isInternal: z.enum(["true", "false"]).optional(),
});

export async function addCommentAction(
  prevState: unknown,
  formData: FormData
) {
  const user = await requireAuth();

  const raw = {
    issueId: formData.get("issueId"),
    content: formData.get("content"),
    isInternal: formData.get("isInternal") || "false",
  };

  const validated = commentSchema.safeParse(raw);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Validation failed.",
    };
  }

  const { issueId, content, isInternal } = validated.data;

  try {
    const comment = await prisma.$transaction(async (tx) => {
      const issue = await tx.issue.findUnique({
        where: { id: issueId },
        select: { id: true, issueNumber: true, assigneeId: true, createdById: true },
      });

      if (!issue) {
        throw new Error("Target issue not found.");
      }

      const newComment = await tx.issueComment.create({
        data: {
          issueId,
          authorId: user.id,
          content,
          isInternal: isInternal === "true",
        },
      });

      // Audit log
      await tx.issueActivityLog.create({
        data: {
          issueId,
          actorId: user.id,
          action: "COMMENT_ADDED",
          comment: `${isInternal === "true" ? "[Internal Note]" : "[Public Comment]"} ${content.slice(0, 100)}${content.length > 100 ? "..." : ""}`,
        },
      });

      // Notify assignee and creator if different
      const recipients = new Set<string>();
      if (issue.assigneeId && issue.assigneeId !== user.id) recipients.add(issue.assigneeId);
      if (issue.createdById && issue.createdById !== user.id) recipients.add(issue.createdById);

      for (const recipientId of recipients) {
        await tx.notification.create({
          data: {
            userId: recipientId,
            title: `New Comment: ${issue.issueNumber}`,
            message: `${user.name} commented on issue ${issue.issueNumber}`,
            linkUrl: `/issues/${issue.id}`,
          },
        });
      }

      return newComment;
    });

    revalidatePath(`/issues/${issueId}`);

    return {
      success: true,
      data: comment,
    };
  } catch (err: unknown) {
    console.error("Add comment error:", err);
    return {
      success: false,
      error: "Failed to post comment. Please try again.",
    };
  }
}
