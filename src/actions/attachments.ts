"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB limit

const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  // Documents & logs
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
]);

export async function uploadAttachmentAction(
  prevState: unknown,
  formData: FormData
) {
  const user = await requireAuth();

  const issueId = formData.get("issueId") as string;
  const file = formData.get("file") as File | null;

  if (!issueId || !file) {
    return {
      success: false,
      error: "Issue ID and file are required.",
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: `File size exceeds the 25MB limit (current: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  // Validate MIME type
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    // Check extension fallback for logs/HAR
    const ext = path.extname(file.name).toLowerCase();
    const allowedExts = [".log", ".txt", ".json", ".har", ".sql", ".csv", ".png", ".jpg", ".jpeg", ".webp", ".pdf", ".zip"];
    if (!allowedExts.includes(ext)) {
      return {
        success: false,
        error: `File type "${file.type || ext}" is not permitted. Permitted formats: images, PDF, logs, text, JSON, HAR, SQL, ZIP.`,
      };
    }
  }

  try {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { id: true, issueNumber: true },
    });

    if (!issue) {
      return { success: false, error: "Target issue not found." };
    }

    // Prepare secure storage directory
    const uploadDir = path.join(process.cwd(), "uploads", "issues", issueId);
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate safe unique filename
    const fileExt = path.extname(file.name) || "";
    const baseName = path.basename(file.name, fileExt).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueId = crypto.randomBytes(8).toString("hex");
    const safeFileName = `${baseName}_${uniqueId}${fileExt}`;
    const destinationPath = path.join(uploadDir, safeFileName);

    // Write file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(destinationPath, buffer);

    // Create database attachment record
    const attachment = await prisma.$transaction(async (tx) => {
      const record = await tx.issueAttachment.create({
        data: {
          issueId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          storagePath: destinationPath,
          uploadedById: user.id,
        },
      });

      // Audit activity
      await tx.issueActivityLog.create({
        data: {
          issueId,
          actorId: user.id,
          action: "ATTACHMENT_ADDED",
          comment: `Uploaded diagnostic file: "${file.name}" (${(file.size / 1024).toFixed(1)} KB).`,
        },
      });

      return record;
    });

    revalidatePath(`/issues/${issueId}`);

    return {
      success: true,
      data: attachment,
    };
  } catch (err) {
    console.error("Upload attachment error:", err);
    return {
      success: false,
      error: "Failed to store file upload. Please try again.",
    };
  }
}

export async function deleteAttachmentAction(attachmentId: string) {
  const user = await requireAuth();

  try {
    const attachment = await prisma.issueAttachment.findUnique({
      where: { id: attachmentId },
      select: { id: true, issueId: true, fileName: true, storagePath: true, uploadedById: true },
    });

    if (!attachment) {
      return { success: false, error: "Attachment not found." };
    }

    // Role check: Admin, PM, or uploader
    const canDelete =
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN" ||
      user.role === "PROJECT_MANAGER" ||
      attachment.uploadedById === user.id;

    if (!canDelete) {
      return { success: false, error: "You are not authorized to delete this attachment." };
    }

    // Delete record and disk file
    await prisma.$transaction(async (tx) => {
      await tx.issueAttachment.delete({
        where: { id: attachmentId },
      });

      await tx.issueActivityLog.create({
        data: {
          issueId: attachment.issueId,
          actorId: user.id,
          action: "ATTACHMENT_REMOVED",
          comment: `Deleted diagnostic file: "${attachment.fileName}".`,
        },
      });
    });

    try {
      await fs.unlink(attachment.storagePath);
    } catch (e) {
      console.warn("Could not remove file from disk:", e);
    }

    revalidatePath(`/issues/${attachment.issueId}`);

    return { success: true };
  } catch (err) {
    console.error("Delete attachment error:", err);
    return { success: false, error: "Failed to delete attachment." };
  }
}

export async function getAttachmentsAction(issueId: string) {
  await requireAuth();

  return prisma.issueAttachment.findMany({
    where: { issueId },
    orderBy: { createdAt: "desc" },
  });
}
