import { describe, expect, it } from "vitest";
import { addShoppingIngredients, type ShoppingItem } from "./shopping";

describe("Lista della spesa", () => {
  const recipe = { id: "recipe-1", title: "Prima ricetta" };
  it("non duplica ingredienti o riferimenti quando si aggiunge due volte una ricetta", () => {
    const once = addShoppingIngredients(
      [],
      [{ name: " Latte ", measure: "200ml" }],
      recipe,
    );
    const twice = addShoppingIngredients(
      once,
      [{ name: "LATTE", measure: "200ml" }],
      recipe,
    );
    expect(twice).toEqual(once);
    expect(twice[0].name).toBe("Latte");
  });
  it("conserva quantità originali da più ricette senza sommarle o convertirle", () => {
    const initial = addShoppingIngredients(
      [],
      [{ name: "Latte", measure: "200ml" }],
      recipe,
    );
    const result = addShoppingIngredients(
      initial,
      [{ name: "latte", measure: "1 cup" }],
      { id: "recipe-2", title: "Seconda ricetta" },
    );
    expect(result).toHaveLength(1);
    expect(result[0].sources.map((source) => source.measure)).toEqual([
      "200ml",
      "1 cup",
    ]);
    expect(initial[0].sources).toHaveLength(1);
    expect(result[0].note).toBe("");
  });
  it("preserva gli acquisti e le note della persona senza riaprire voci automaticamente", () => {
    const initial: ShoppingItem[] = [
      {
        id: "manual",
        name: "Latte",
        checked: true,
        note: "Comprato stamattina",
        sources: [],
      },
    ];
    const result = addShoppingIngredients(
      initial,
      [{ name: " latte ", measure: "200ml" }],
      recipe,
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "manual",
      checked: true,
      note: "Comprato stamattina",
    });
  });
  it("non confonde alimenti diversi e ignora nomi vuoti", () => {
    const result = addShoppingIngredients(
      [],
      [
        { name: "Latte", measure: "" },
        { name: "Latte di avena", measure: "1 l" },
        { name: "  ", measure: "1 kg" },
      ],
      recipe,
    );
    expect(result).toHaveLength(2);
    expect(result.every((item) => !item.checked)).toBe(true);
  });
});
