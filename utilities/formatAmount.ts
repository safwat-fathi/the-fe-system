export function formatAmount(
  value: number | string | null | undefined,
  fraction: number = 2,
): string {
  const num = Number(value);

  if (isNaN(num)) return "0";

  return num.toLocaleString("en-US", {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  });
}
