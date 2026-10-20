"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, Permissions } from "@/lib/rbac";
import { generateNextIssueNumber } from "@/lib/issue-number";
import { Priority, IssueStatus } from "@/types";
import { revalidatePath } from "next/cache";

const issueCreateSchema = z.object({
  title: z.string().min(4, "Title must be at least 4 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  projectId: z.string().min(1, "Please select a project."),
  departmentId: z.string().min(1, "Please select a department."),
  categoryId: z.string().min(1, "Please select a category."),
  priority: z.enum([
    Priority.LOW,
    Priority.MEDIUM,
    Priority.HIGH,
    Priority.CRITICAL,
    Priority.URGENT,
  ]).default(Priority.MEDIUM),
  environment: z.string().optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  reproSteps: z.string().optional(),
  errorMessages: z.string().optional(),
  affectedUrl: z.string().optional(),
  gitBranch: z.string().optional(),
  gitPullRequest: z.string().optional(),
  gitCommitSha: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
  tags: z.string().optional(), // comma-separated
});

export async function createIssueAction(
  prevState: unknown,
  formData: FormData
) {
  const user = await requireAuth();

  if (!Permissions.canCreateIssue(user)) {
    return {
      success: false,
      error: "You do not have permission to report issues.",
    };
  }

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    projectId: formData.get("projectId"),
    departmentId: formData.get("departmentId"),
    categoryId: formData.get("categoryId"),
    priority: formData.get("priority") || Priority.MEDIUM,
    environment: formData.get("environment") || undefined,
    expectedBehavior: formData.get("expectedBehavior") || undefined,
    actualBehavior: formData.get("actualBehavior") || undefined,
    reproSteps: formData.get("reproSteps") || undefined,
    errorMessages: formData.get("errorMessages") || undefined,
    affectedUrl: formData.get("affectedUrl") || undefined,
    gitBranch: formData.get("gitBranch") || undefined,
    gitPullRequest: formData.get("gitPullRequest") || undefined,
    gitCommitSha: formData.get("gitCommitSha") || undefined,
    assigneeId: formData.get("assigneeId") || null,
    tags: formData.get("tags") || undefined,
  };

  const validated = issueCreateSchema.safeParse(raw);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Validation failed.",
    };
  }

  try {
    const data = validated.data;

    const newIssue = await prisma.$transaction(async (tx) => {
      // 1. Concurrency-safe atomic issue number generation
      const issueNumber = await generateNextIssueNumber(tx);

      // 2. Initial status: ASSIGNED if assignee chosen, else OPEN
      const initialStatus = data.assigneeId ? IssueStatus.ASSIGNED : IssueStatus.OPEN;

      // 3. Create core issue record
      const issue = await tx.issue.create({
        data: {
          issueNumber,
          title: data.title,
          description: data.description,
          status: initialStatus,
          priority: data.priority,
          projectId: data.projectId,
          departmentId: data.departmentId,
          categoryId: data.categoryId,
          createdById: user.id,
          assigneeId: data.assigneeId || null,
          environment: data.environment || null,
          expectedBehavior: data.expectedBehavior || null,
          actualBehavior: data.actualBehavior || null,
          reproSteps: data.reproSteps || null,
          errorMessages: data.errorMessages || null,
          affectedUrl: data.affectedUrl || null,
          gitBranch: data.gitBranch || null,
          gitPullRequest: data.gitPullRequest || null,
          gitCommitSha: data.gitCommitSha || null,
        },
      });

      // 4. Handle Tags
      if (data.tags) {
        const tagNames = data.tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0);

        for (const tagName of tagNames) {
          const tag = await tx.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName },
          });

          await tx.issueTag.create({
            data: {
              issueId: issue.id,
              tagId: tag.id,
            },
          });
        }
      }

      // 5. Append-only activity log for creation
      await tx.issueActivityLog.create({
        data: {
          issueId: issue.id,
          actorId: user.id,
          action: "ISSUE_CREATED",
          comment: `Issue ${issueNumber} created with priority ${data.priority}.`,
        },
      });

      // 6. Record assignment if assigned
      if (data.assigneeId) {
        await tx.issueAssignment.create({
          data: {
            issueId: issue.id,
            assigneeId: data.assigneeId,
            assignedBy: user.id,
            notes: "Initial assignment on issue creation.",
          },
        });

        // In-app notification
        await tx.notification.create({
          data: {
            userId: data.assigneeId,
            title: `Assigned: ${issueNumber}`,
            message: `You were assigned to "${data.title}" by ${user.name}.`,
            linkUrl: `/issues/${issue.id}`,
          },
        });
      }

      return issue;
    });

    revalidatePath("/issues");
    revalidatePath("/dashboard");
    revalidatePath("/my-issues");

    return {
      success: true,
      data: {
        id: newIssue.id,
        issueNumber: newIssue.issueNumber,
      },
    };
  } catch (err: unknown) {
    console.error("Create issue error:", err);
    const message = err instanceof Error ? err.message : "Failed to create issue. Please check your inputs and try again.";
    return {
      success: false,
      error: message.includes("Unique constraint")
        ? "An issue with this identifier already exists. Please retry submission."
        : message,
    };
  }
}

export interface IssueFilterParams {
  search?: string;
  projectId?: string;
  departmentId?: string;
  categoryId?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  createdById?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "priority" | "issueNumber" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export async function getIssuesAction(params: IssueFilterParams = {}) {
  await requireAuth();

  const {
    search,
    projectId,
    departmentId,
    categoryId,
    status,
    priority,
    assigneeId,
    createdById,
    page = 1,
    pageSize = 15,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const where: Record<string, unknown> = {};

  if (projectId) where.projectId = projectId;
  if (departmentId) where.departmentId = departmentId;
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;
  if (createdById) where.createdById = createdById;

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { issueNumber: { contains: q } },
      { title: { contains: q } },
      { description: { contains: q } },
      { errorMessages: { contains: q } },
    ];
  }

  const skip = (page - 1) * pageSize;

  const [total, issues] = await Promise.all([
    prisma.issue.count({ where }),
    prisma.issue.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        project: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        tags: { include: { tag: true } },
      },
    }),
  ]);

  return {
    issues,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

export async function getIssueByIdAction(idOrNumber: string) {
  await requireAuth();

  const issue = await prisma.issue.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { issueNumber: idOrNumber }],
    },
    include: {
      project: true,
      department: true,
      category: true,
      creator: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
      tags: { include: { tag: true } },
      assignments: {
        orderBy: { assignedAt: "desc" },
        include: {
          assignee: { select: { id: true, name: true } },
        },
      },
      investigations: {
        orderBy: { createdAt: "desc" },
        include: {
          investigator: { select: { id: true, name: true, avatarUrl: true, role: true } },
        },
      },
      resolution: {
        include: {
          resolver: { select: { id: true, name: true, avatarUrl: true, role: true } },
          verifier: { select: { id: true, name: true, avatarUrl: true, role: true } },
        },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        },
      },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        include: {
          actor: { select: { id: true, name: true, avatarUrl: true, role: true } },
        },
      },
      attachments: {
        orderBy: { createdAt: "desc" },
      },
      outgoingRelations: {
        include: {
          targetIssue: {
            select: { id: true, issueNumber: true, title: true, status: true, priority: true },
          },
        },
      },
      incomingRelations: {
        include: {
          sourceIssue: {
            select: { id: true, issueNumber: true, title: true, status: true, priority: true },
          },
        },
      },
    },
  });

  return issue;
}

const issueUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(4, "Title must be at least 4 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  priority: z.enum([
    Priority.LOW,
    Priority.MEDIUM,
    Priority.HIGH,
    Priority.CRITICAL,
    Priority.URGENT,
  ]),
  environment: z.string().optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  reproSteps: z.string().optional(),
  errorMessages: z.string().optional(),
  affectedUrl: z.string().optional(),
  gitBranch: z.string().optional(),
  gitPullRequest: z.string().optional(),
  gitCommitSha: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
  version: z.number().int(),
});

export async function updateIssueAction(
  prevState: unknown,
  formData: FormData
) {
  const user = await requireAuth();

  const raw = {
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    environment: formData.get("environment") || undefined,
    expectedBehavior: formData.get("expectedBehavior") || undefined,
    actualBehavior: formData.get("actualBehavior") || undefined,
    reproSteps: formData.get("reproSteps") || undefined,
    errorMessages: formData.get("errorMessages") || undefined,
    affectedUrl: formData.get("affectedUrl") || undefined,
    gitBranch: formData.get("gitBranch") || undefined,
    gitPullRequest: formData.get("gitPullRequest") || undefined,
    gitCommitSha: formData.get("gitCommitSha") || undefined,
    assigneeId: formData.get("assigneeId") || null,
    version: parseInt(formData.get("version") as string, 10) || 1,
  };

  const validated = issueUpdateSchema.safeParse(raw);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Validation failed.",
    };
  }

  const { id, version, ...data } = validated.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Optimistic locking check
      const current = await tx.issue.findUnique({
        where: { id },
        select: { version: true, assigneeId: true, issueNumber: true },
      });

      if (!current) {
        throw new Error("Issue not found.");
      }

      if (current.version !== version) {
        throw new Error(
          "Conflict detected: This issue was modified by another engineer while you were editing. Please refresh and review latest changes."
        );
      }

      // 2. Perform atomic update and increment version
      const issue = await tx.issue.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          environment: data.environment || null,
          expectedBehavior: data.expectedBehavior || null,
          actualBehavior: data.actualBehavior || null,
          reproSteps: data.reproSteps || null,
          errorMessages: data.errorMessages || null,
          affectedUrl: data.affectedUrl || null,
          gitBranch: data.gitBranch || null,
          gitPullRequest: data.gitPullRequest || null,
          gitCommitSha: data.gitCommitSha || null,
          assigneeId: data.assigneeId || null,
          version: { increment: 1 },
        },
      });

      // 3. Track assignment change if changed
      if (data.assigneeId && data.assigneeId !== current.assigneeId) {
        await tx.issueAssignment.create({
          data: {
            issueId: id,
            assigneeId: data.assigneeId,
            assignedBy: user.id,
            notes: "Reassigned during issue update.",
          },
        });
      }

      // 4. Append-only activity log
      await tx.issueActivityLog.create({
        data: {
          issueId: id,
          actorId: user.id,
          action: "ISSUE_UPDATED",
          comment: `Issue details and parameters updated (version ${current.version + 1}).`,
        },
      });

      return issue;
    });

    revalidatePath(`/issues/${id}`);
    revalidatePath("/issues");

    return {
      success: true,
      data: updated,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update issue.",
    };
  }
}

export async function deleteIssueAction(issueId: string) {
  const user = await requireAuth();

  try {
    const existing = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { id: true, issueNumber: true, createdById: true },
    });

    if (!existing) {
      return { success: false, error: "Issue not found." };
    }

    if (!Permissions.canDeleteIssue(user, existing.createdById)) {
      return {
        success: false,
        error: "You do not have permission to delete this issue.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.issueActivityLog.deleteMany({ where: { issueId } });
      await tx.issueComment.deleteMany({ where: { issueId } });
      await tx.issueInvestigation.deleteMany({ where: { issueId } });
      await tx.issueResolution.deleteMany({ where: { issueId } });
      await tx.issueAttachment.deleteMany({ where: { issueId } });
      await tx.issueTag.deleteMany({ where: { issueId } });
      await tx.issueAssignment.deleteMany({ where: { issueId } });
      await tx.issueRelation.deleteMany({
        where: { OR: [{ sourceIssueId: issueId }, { targetIssueId: issueId }] },
      });
      await tx.issue.delete({ where: { id: issueId } });
    });

    revalidatePath("/issues");
    revalidatePath("/dashboard");
    revalidatePath("/my-issues");

    return { success: true };
  } catch (err: unknown) {
    console.error("Delete issue error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete issue.",
    };
  }
}

