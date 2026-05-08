const cadFormatter = new Intl.NumberFormat("en-CA", {
  currency: "CAD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

export function formatCurrency(value: number | null | undefined) {
  return cadFormatter.format(value ?? 0);
}

export function formatQuantity(value: number | null | undefined) {
  return new Intl.NumberFormat("en-CA", {
    maximumFractionDigits: 3,
  }).format(value ?? 0);
}
