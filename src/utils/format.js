export function formatNumber(value, minimumFractionDigits = 2, maximumFractionDigits = 2) {
  const parsed = Number(value || 0);
  const safeValue = Number.isFinite(parsed) ? parsed : 0;
  return safeValue.toLocaleString("en-IN", {
    minimumFractionDigits,
    maximumFractionDigits,
  });
}

export function formatMoney(value) {
  return `Rs ${formatNumber(value, 2, 2)}`;
}
