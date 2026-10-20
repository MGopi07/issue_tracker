"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, Permissions } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

const projectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters."),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters.")
    .max(10, "Code cannot exceed 10 characters.")
    .regex(/^[A-Z0-9_-]+$/, "Code must contain only uppercase letters, numbers, hyphens, or underscores."),
  description: z.string().optional(),
  projectUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  projectType: z.string().default("Web"),
  managerId: z.string().min(1, "Project manager is required."),
});

export async function getProjectsAction() {
  await requireAuth();

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      manager: {
        select: { id: true, name: true, email: true, role: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      _count: {
        select: {
          issues: true,
        },
      },
    },
  });

  return projects;
}

export async function getProjectByIdAction(id: string) {
  await requireAuth();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      manager: {
        select: { id: true, name: true, email: true, role: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      issues: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          assignee: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      },
      _count: {
        select: {
          issues: true,
        },
      },
    },
  });

  return project;
}

export async function createProjectAction(
  prevState: unknown,
  formData: FormData
) {
  const user = await requireAuth();

  if (!Permissions.canManageProjects(user)) {
    return {
      success: false,
      error: "You do not have permission to create projects. Administrator or Project Manager role required.",
    };
  }

  const raw = {
    name: formData.get("name"),
    code: (formData.get("code") as string)?.toUpperCase().trim(),
    description: formData.get("description") || undefined,
    projectUrl: formData.get("projectUrl") || undefined,
    projectType: formData.get("projectType") || "Web",
    managerId: formData.get("managerId") || user.id,
  };

  const validated = projectSchema.safeParse(raw);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Validation failed.",
    };
  }

  try {
    const existing = await prisma.project.findUnique({
      where: { code: validated.data.code },
    });

    if (existing) {
      return {
        success: false,
        error: `A project with code "${validated.data.code}" already exists.`,
      };
    }

    const newProject = await prisma.$transaction(async (tx) => {
      const proj = await tx.project.create({
        data: {
          name: validated.data.name,
          code: validated.data.code,
          description: validated.data.description,
          projectUrl: validated.data.projectUrl || null,
          projectType: validated.data.projectType,
          status: "ACTIVE",
          managerId: validated.data.managerId,
        },
      });

      // Automatically add manager as a project member
      await tx.projectMember.create({
        data: {
          projectId: proj.id,
          userId: validated.data.managerId,
          role: "MANAGER",
        },
      });

      return proj;
    });

    revalidatePath("/projects");
    return {
      success: true,
      data: newProject,
    };
  } catch (err: unknown) {
    console.error("Create project error:", err);
    return {
      success: false,
      error: "Failed to create project. Please check inputs and try again.",
    };
  }
}
