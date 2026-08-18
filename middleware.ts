import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/auth";

const publicPaths = new Set(["/login", "/api/auth/login", "/api/auth/logout"]);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionIsValid = await verifySessionValue(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    if (sessionIsValid) return NextResponse.redirect(new URL("/", request.url));

    const headers = new Headers(request.headers);
    headers.set("x-auth-public", "login");
    return NextResponse.next({ request: { headers } });
  }

  if (publicPaths.has(pathname)) return NextResponse.next();
  if (sessionIsValid) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|txt)$).*)"],
};