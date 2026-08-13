export function parseMoneyToCents(value: unknown, fieldName = "Amount"): number {
  const raw = typeof value === "number" ? String(value) : String(value ?? "").trim();
  if (!raw) throw new Error(`${fieldName} is required.`);
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(raw)) {
    throw new Error(`${fieldName} must be a valid amount with up to 2 decimal places.`);
  }
  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;
  const [whole, decimals = ""] = unsigned.split(".");
  const cents = Number(whole) * 100 + Number((decimals + "00").slice(0, 2));
  if (!Number.isSafeInteger(cents)) throw new Error(`${fieldName} is too large.`);
  return negative ? -cents : cents;
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function moneyInputValue(cents: number): string {
  return (cents / 100).toFixed(2);
}
