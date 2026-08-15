import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { cache } from "react";

/**
 * Creates one Prisma client per request, backed by the Cloudflare D1 binding.
 * React cache avoids creating duplicate clients within the same server-component
 * request while still avoiding a long-lived global Worker client.
 */
export const getDb = cache(() => {
  const env = getCloudflareContext().env as any;
  return new PrismaClient({ adapter: new PrismaD1(env.DB) });
});

/** Direct D1 access is used only where an atomic batch is required. */
export function getD1() {
  const env = getCloudflareContext().env as any;
  return env.DB;
}

/** Static assets binding used by server-side PDF generation. */
export function getAssetsBinding() {
  const env = getCloudflareContext().env as any;
  return env.ASSETS;
}
