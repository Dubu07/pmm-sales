import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Local SQLite file backups are disabled in the Cloudflare version. The production database is Cloudflare D1.",
    },
    { status: 410 },
  );
}
