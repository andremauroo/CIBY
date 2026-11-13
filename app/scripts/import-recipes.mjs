import { writeFile } from "node:fs/promises";
const base = "https://www.themealdb.com/api/json/v1/1";
async function get(path) {
  const r = await fetch(base + path, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw Error(`TheMealDB: ${r.status}`);
  return r.json();
}
const list = await get("/filter.php?a=Italian");
const meals = [];
for (const entry of list.meals.slice(0, 12)) {
  const { meals: details } = await get("/lookup.php?i=" + entry.idMeal);
  const m = details[0];
  meals.push({
    id: m.idMeal,
    title: m.strMeal,
    category: m.strCategory,
    language: "en",
    minutes: null,
    servings: null,
    sourceUrl: m.strSource || "https://www.themealdb.com/meal/" + m.idMeal,
    instructions: m.strInstructions,
    ingredients: Array.from({ length: 20 }, (_, i) => ({
      name: m["strIngredient" + (i + 1)]?.trim(),
      measure: m["strMeasure" + (i + 1)]?.trim() || "",
    })).filter((i) => i.name),
  });
}
await writeFile(
  "src/data/recipes.json",
  JSON.stringify(
    {
      provider: "TheMealDB",
      importedAt: new Date().toISOString(),
      usage:
        "Educational prototype; test key 1. Review provider terms before public distribution.",
      meals,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Imported",
  meals.length,
  "recipes. No cooking-time or portion data provided by API.",
);
