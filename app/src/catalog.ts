import catalog from "./data/recipes.json";
import type { Food } from "./domain";
export const catalogMeals = catalog.meals;
export type CatalogMeal = (typeof catalogMeals)[number];
const aliases: Record<string, string[]> = {
  pasta: [
    "pasta",
    "penne",
    "spaghetti",
    "linguine",
    "fettuccine",
    "fettucine",
    "lasagne",
    "tagliatelle",
  ],
  lenticchie: ["lentils", "red lentils"],
  pomodori: ["tomato", "tomatoes", "cherry tomatoes", "chopped tomatoes"],
  uova: ["egg", "eggs"],
  latte: ["milk"],
  pane: ["bread"],
  carote: ["carrot", "carrots"],
  ceci: ["chickpeas"],
  riso: ["rice", "risotto rice"],
  zucchine: ["courgette", "courgettes", "zucchini"],
  patate: ["potato", "potatoes"],
  cipolla: ["onion", "onions"],
  aglio: ["garlic", "garlic clove", "garlic cloves"],
  olio: ["olive oil", "oil"],
  sale: ["salt"],
  pollo: ["chicken", "chicken breast", "chicken breasts"],
  burro: ["butter"],
  formaggio: ["cheese", "parmesan", "parmigiano reggiano"],
};
export function recognizedFoods(meal: CatalogMeal, foods: Food[]) {
  return foods
    .filter(
      (f) =>
        f.quantity > 0 &&
        meal.ingredients.some((i) => {
          const name = i.name.toLowerCase();
          return (
            name === f.name.toLowerCase() ||
            (aliases[f.name.toLowerCase()] || []).includes(name)
          );
        }),
    )
    .map((f) => f.name);
}
export function catalogSearch(meal: CatalogMeal, query: string) {
  const q = query.trim().toLowerCase();
  const hay = (
    meal.title +
    " " +
    meal.ingredients.map((i) => i.name).join(" ")
  ).toLowerCase();
  return (
    !q ||
    hay.includes(q) ||
    (aliases[q] || []).some((a) =>
      meal.ingredients.some((i) => i.name.toLowerCase() === a),
    )
  );
}
