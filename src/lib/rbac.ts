import { Role } from "@/types";
import { getSession, SessionUser } from "./auth";
import { redirect } from "next/navigation";

export class AuthorizationError extends Error {
  constructor(message: string = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Ensures user is authenticated; redirects to /login if unauthenticated in page contexts.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Ensures user has at least one of the specified roles.
 */
export async function requireRole(allowedRoles: Role[]): Promise<SessionUser> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new AuthorizationError(
      `Access denied. Required roles: ${allowedRoles.join(", ")}. Your role: ${session.role}`
    );
  }
  return session;
}

/**
 * Role permissions matrix helper
 */
export const Permissions = {
  isAdmin(user: SessionUser): boolean {
    return user.role === Role.ADMIN;
  },

  isProjectManager(user: SessionUser): boolean {
    return user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER;
  },

  canManageProjects(user: SessionUser): boolean {
    return user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER;
  },

  canManageCategories(user: SessionUser): boolean {
    return user.role === Role.ADMIN;
  },

  canCreateIssue(user: SessionUser): boolean {
    // All active members except read-only viewers can report issues
    return user.role !== Role.VIEWER;
  },

  canEditIssue(user: SessionUser, authorId?: string): boolean {
    if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN || user.role === Role.PROJECT_MANAGER) {
      return true;
    }
    if (authorId && user.id === authorId) {
      return true;
    }
    return user.role === Role.DEVELOPER || user.role === Role.QA_TESTER || user.role === Role.DEVOPS;
  },

  canAssignIssue(user: SessionUser): boolean {
    return user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER;
  },

  canResolveIssue(user: SessionUser): boolean {
    // Developers, DevOps, SEO, PMs, and Admins can propose solutions
    const allowed: Role[] = [
      Role.ADMIN,
      Role.PROJECT_MANAGER,
      Role.DEVELOPER,
      Role.DEVOPS,
      Role.SEO_TEAM,
    ];
    return allowed.includes(user.role);
  },

  canVerifyIssue(user: SessionUser): boolean {
    // QA Testers, PMs, and Admins can sign-off verification
    const allowed: Role[] = [Role.ADMIN, Role.PROJECT_MANAGER, Role.QA_TESTER];
    return allowed.includes(user.role);
  },

  canDeleteIssue(user: SessionUser, createdById?: string): boolean {
    // 1. System Administrator maintains administrative/compliance override
    if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
      return true;
    }
    // 2. Strict creator access: only the user who created/reported the issue can delete it
    if (createdById && user.id === createdById) {
      return true;
    }
    return false;
  },

  canPublishToKnowledgeBase(user: SessionUser): boolean {
    const allowed: Role[] = [
      Role.ADMIN,
      Role.PROJECT_MANAGER,
      Role.QA_TESTER,
      Role.DEVELOPER,
    ];
    return allowed.includes(user.role);
  },
};
