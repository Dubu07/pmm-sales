import { NextResponse } from "next/server";
import { createSessionValue, getAuthConfig, safeEqual, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { userId?: unknown; password?: unknown };
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const config = getAuthConfig();

    if (!safeEqual(userId, config.userId) || !safeEqual(password, config.password)) {
      return NextResponse.json({ error: "Invalid ID or password." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set({ name: SESSION_COOKIE, value: await createSessionValue(config.userId), ...sessionCookieOptions(request) });
    return response;
  } catch {
    return NextResponse.json({ error: "Authentication is not configured." }, { status: 500 });
  }
}