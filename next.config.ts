import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // OpenNext needs both Prisma package surfaces included for the workerd runtime.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default nextConfig;

// Makes Wrangler bindings (including D1) available during `next dev`.
initOpenNextCloudflareForDev();
