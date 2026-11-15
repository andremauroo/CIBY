import { describe, it, expect } from "vitest";
import {
  catalogMeals,
  recognizedFoods,
  ingredientMatches,
  ingredientLabel,
  catalogSearch,
  type CatalogMeal,
} from "./catalog";
import type { Food } from "./domain";
const food = (name: string, quantity = 1): Food => ({
  id: name,
  name,
  quantity,
  unit: "pezzi",
  place: "Dispensa",
  priority: false,
  art: "generic-food.svg",
});
const meal = (...names: string[]): CatalogMeal => ({
  ...catalogMeals[0],
  ingredients: names.map((name) => ({ name, measure: "1 cup" })),
});
describe("Ricettario: nomi riconosciuti senza sostituzioni implicite", () => {
  it("riconosce traduzioni, singolari, spazi e maiuscole", () => {
    const result = ingredientMatches(meal("Eggs", "Carrots", "Garlic Clove"), [
      food(" UOVO  "),
      food("carota"),
      food("aglio"),
    ]);
    expect(result.every((i) => i.recognized)).toBe(true);
    expect(ingredientLabel("PARMESAN CHEESE")).toBe("Parmigiano");
  });
  it("non equipara categorie, varietà e preparazioni differenti", () => {
    expect(
      recognizedFoods(
        meal(
          "Parmesan",
          "Fettuccine",
          "Heavy Cream",
          "Cherry Tomatoes",
          "Chicken Breasts",
        ),
        [
          food("Formaggio"),
          food("Pasta"),
          food("Latte"),
          food("Pomodori"),
          food("Pollo"),
        ],
      ),
    ).toEqual([]);
    expect(recognizedFoods(meal("Spaghetti"), [food("Fettuccine")])).toEqual(
      [],
    );
    expect(recognizedFoods(meal("Milk"), [food("Latte di avena")])).toEqual([]);
  });
  it("non conta scorte esaurite o duplicati due volte", () => {
    expect(
      recognizedFoods(meal("Eggs", "Eggs"), [
        food("Uova"),
        { ...food("Uovo"), id: "other" },
        food("Burro", 0),
      ]),
    ).toEqual(["Uova"]);
    expect(recognizedFoods(meal("Butter"), [food("Burro", 0)])).toEqual([]);
  });
  it("mantiene dosi originali e scorte senza dedurre sufficienza o convertire unità", () => {
    const foods = [{ ...food("Uova", 0.1), unit: "kg" as const }];
    const before = structuredClone(foods);
    const result = ingredientMatches(meal("Eggs"), foods);
    expect(result[0].recognized).toBe(true);
    expect(result[0].measure).toBe("1 cup");
    expect(result[0].foods[0].quantity).toBe(0.1);
    expect(foods).toEqual(before);
  });
  it("trova famiglie nella ricerca senza usarle come corrispondenze di dispensa", () => {
    expect(catalogSearch(meal("Linguine Pasta"), "pasta")).toBe(true);
    expect(catalogSearch(meal("Eggs"), "uovo")).toBe(true);
    expect(catalogSearch(meal("Parmesan"), "formaggio")).toBe(true);
    expect(recognizedFoods(meal("Parmesan"), [food("formaggio")])).toEqual([]);
    expect(catalogSearch(meal("Eggs"), "lenticchie")).toBe(false);
  });
  it("mantiene leggibili gli ingredienti non tradotti e li riconosce solo per nome esatto", () => {
    expect(ingredientLabel("Fromage Frais")).toBe("Fromage Frais");
    expect(
      recognizedFoods(meal("Fromage Frais"), [food(" fromage frais ")]),
    ).toEqual(["Fromage Frais"]);
  });
});

it("mantiene un catalogo italiano curato con fonti e senza le ricette ritirate", () => {
  expect(catalogMeals.length).toBeGreaterThan(12);
  expect(
    catalogMeals.every(
      (meal) =>
        meal.language === "it" &&
        meal.sourceName &&
        meal.sourceUrl.startsWith("https://") &&
        meal.instructions &&
        meal.ingredients.length,
    ),
  ).toBe(true);
  expect(
    catalogMeals.some((meal) =>
      /alfredo|primavera|pilchard|pizza express|gratin with chicken/i.test(
        meal.title,
      ),
    ),
  ).toBe(false);
  expect(new Set(catalogMeals.map((meal) => meal.id)).size).toBe(
    catalogMeals.length,
  );
});
