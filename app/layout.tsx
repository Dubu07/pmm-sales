import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "PMM Sales & Invoice System",
  description: "Cloud-hosted sales, customer, invoice and reporting system",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const isLoginRoute = (await headers()).get("x-auth-public") === "login";

  return (
    <html lang="en">
      <body>
        {isLoginRoute ? <main>{children}</main> : <div className="min-h-screen lg:flex"><Nav /><main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main></div>}
      </body>
    </html>
  );
}
