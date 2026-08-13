import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const source = path.join(dataDir, "pmm-sales.db");
    const backupDir = path.join(dataDir, "backups");
    await fs.mkdir(backupDir, { recursive: true });
    await fs.access(source);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `pmm-sales-backup-${stamp}.db`;
    await fs.copyFile(source, path.join(backupDir, fileName));
    return NextResponse.json({ ok: true, fileName });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database backup failed." }, { status: 500 });
  }
}
