export function formatMoney(value) {
  if (!value && value !== 0) return '$0.00';
  
  // Truncate to 2 decimal places (not rounding)
  const truncated = Math.floor(value * 100) / 100;
  
  // Format with commas
  return '$' + truncated.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}