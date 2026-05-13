export function sortWithOutroLast(items: string[]): string[] {
  return [...items].sort((a, b) => {
    if (a === "Outro") return 1;
    if (b === "Outro") return -1;
    return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
  });
}
