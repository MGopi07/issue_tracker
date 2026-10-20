"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSessionToken, setSessionCookie, clearSessionCookie, getSession, SessionUser } from "@/lib/auth";
import { Role } from "@/types";
import { redirect } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type ActionState<T = unknown> = {
  success?: boolean;
  error?: string;
  data?: T;
};

export async function loginAction(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState<SessionUser>> {
  try {
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const validated = loginSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Validation failed.",
      };
    }

    const { email, password } = validated.data;

    // Look up user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        departments: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    if (!user.isActive) {
      return {
        success: false,
        error: "Your account is deactivated. Contact an administrator.",
      };
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      avatarUrl: user.avatarUrl,
      departments: user.departments.map((d) => ({
        id: d.department.id,
        name: d.department.name,
        code: d.department.code,
      })),
    };

    const token = await signSessionToken(sessionUser);
    setSessionCookie(token);

    return {
      success: true,
      data: sessionUser,
    };
  } catch (err: unknown) {
    console.error("Login action error:", err);
    return {
      success: false,
      error: "An unexpected error occurred during authentication. Please try again.",
    };
  }
}

export async function logoutAction() {
  clearSessionCookie();
  redirect("/login");
}

export async function getSessionUserAction() {
  return getSession();
}
