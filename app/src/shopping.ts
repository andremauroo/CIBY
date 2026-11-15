export type ShoppingItem = {
  id: string;
  name: string;
  note: string;
  checked: boolean;
  sources: { id: string; title: string; measure: string }[];
};

export const shoppingKey = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLocaleLowerCase("it");

export const shoppingId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `shopping-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Preserve original recipe measures: they are references, not purchase totals. */
export function addShoppingIngredients(
  items: ShoppingItem[],
  ingredients: { name: string; measure: string }[],
  meal: { id: string; title: string },
): ShoppingItem[] {
  return ingredients.reduce((result, ingredient) => {
    const name = ingredient.name.trim().replace(/\s+/g, " ");
    if (!name) return result;
    const existing = result.find(
      (item) => shoppingKey(item.name) === shoppingKey(name),
    );
    const source = {
      id: meal.id,
      title: meal.title,
      measure: ingredient.measure.trim(),
    };
    if (!existing)
      return [
        ...result,
        { id: shoppingId(), name, note: "", checked: false, sources: [source] },
      ];
    if (
      existing.sources.some(
        (s) => s.id === source.id && s.measure === source.measure,
      )
    )
      return result;
    return result.map((item) =>
      item.id === existing.id
        ? { ...item, sources: [...item.sources, source] }
        : item,
    );
  }, items);
}
