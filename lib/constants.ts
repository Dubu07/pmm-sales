export const PAYMENT_STATUSES = [
  "Paid",
  "Pending",
  "Partial",
  "Consignment",
  "Replacement",
  "Cancelled",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return typeof value === "string" && PAYMENT_STATUSES.includes(value as PaymentStatus);
}
