export function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function readNullableString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value || null;
}

export function readNumber(formData: FormData, key: string) {
  const value = readString(formData, key);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function readRequiredString(formData: FormData, key: string) {
  const value = readString(formData, key);

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}
