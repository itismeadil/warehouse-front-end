export const LOW_STOCK_THRESHOLD = 5;

export const stockStatusOf = (stock) => {
  const qty = stock || 0;
  if (qty === 0) return "out";
  if (qty <= LOW_STOCK_THRESHOLD) return "low";
  return "in";
};
