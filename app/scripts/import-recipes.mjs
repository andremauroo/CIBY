// The previous automatic Italian-area import included American adaptations.
// Keep this entry point for compatibility, but never overwrite the curated data.
import { readFile } from "node:fs/promises";
const catalog = JSON.parse(
  await readFile(new URL("../src/data/recipes.json", import.meta.url), "utf8"),
);
const ids = new Set();
for (const meal of catalog.meals) {
  const host = new URL(meal.sourceUrl).hostname;
  if (
    !meal.id.startsWith("it-") ||
    ids.has(meal.id) ||
    meal.language !== "it" ||
    ![
      "ricette.giallozafferano.it",
      "www.cucchiaio.it",
      "www.lacucinaitaliana.it",
    ].includes(host) ||
    !meal.ingredients.length ||
    !meal.instructions ||
    !meal.sourceName
  )
    throw Error(`Scheda non valida: ${meal.id}`);
  ids.add(meal.id);
}
console.log(
  `${ids.size} schede italiane verificate. Catalogo curato manualmente: nessuna importazione automatica o modifica dei dati.`,
);
