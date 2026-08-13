"use client";

import { buttonSecondary } from "@/components/ui";

export function PrintButton() {
  return <button type="button" className={buttonSecondary} onClick={() => window.print()}>Print / Save PDF</button>;
}
