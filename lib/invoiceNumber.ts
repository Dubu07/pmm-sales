export function buildInvoiceNumber(prefix: string, nextNumber: number, padding: number): string {
  return `${prefix}${String(nextNumber).padStart(padding, "0")}`;
}
