import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose/jwt/verify";

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-at-least-32-characters-long-key-xyz789"
);

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/issues",
  "/projects",
  "/team",
  "/knowledge-base",
  "/reports",
  "/settings",
  "/my-issues",
  "/assigned-to-me",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("techissue_session")?.value;

  let isValidSession = false;
  if (token) {
    try {
      await jwtVerify(token, SECRET_KEY);
      isValidSession = true;
    } catch {
      isValidSession = false;
    }
  }

  // Redirect unauthenticated users from protected pages to login
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isProtected && !isValidSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from login to dashboard
  if (pathname === "/login" && isValidSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Root path redirect
  if (pathname === "/") {
    if (isValidSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
