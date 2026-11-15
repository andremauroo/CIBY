import { catalogMeals } from "./catalog";
import { describe, it, expect } from "vitest";
import {
  initialState,
  parseState,
  suggestions,
  consume,
  needs,
  useSoon,
  daysUntil,
  compareOptions,
} from "./domain";
describe("Contratti HCI: proposte e consumo separati", () => {
  it("esclude ricette senza ingredienti o tempo sufficienti", () => {
    expect(suggestions(initialState.foods)).toEqual(["frittata", "riso"]);
    expect(suggestions(initialState.foods, 2, 10)).toEqual([]);
    expect(suggestions(initialState.foods, 2, 20, ["uova"])).not.toContain(
      "frittata",
    );
  });
  it("spostare e ridurre porzioni non modifica le scorte", () => {
    const state = {
      ...initialState,
      plan: { ...initialState.plan!, when: "Domani a pranzo", servings: 1 },
    };
    expect(state.foods).toEqual(initialState.foods);
    expect(needs("frittata", 1)).toEqual({ zucchine: 1, uova: 2 });
  });
  it("conferma il consumo una volta sola e non sottrae quantità mancanti", () => {
    const consumed = consume(initialState);
    expect(consumed.foods.find((f) => f.id === "uova")?.quantity).toBe(0);
    expect(consume(consumed)).toEqual(consumed);
    expect(consume({ ...initialState, foods: [] })).toEqual({
      ...initialState,
      foods: [],
    });
  });
  it("riconosce alimenti reinseriti e non confonde nomi o unità modificati", () => {
    const renamed = initialState.foods.map((f) =>
      f.id === "uova" ? { ...f, name: "Carote" } : f,
    );
    expect(suggestions(renamed)).not.toContain("frittata");
    expect(
      suggestions([...renamed, { ...initialState.foods[1], id: "nuovo" }]),
    ).toContain("frittata");
    expect(
      suggestions(
        initialState.foods.map((f) =>
          f.id === "uova" ? { ...f, unit: "g" as const } : f,
        ),
      ),
    ).not.toContain("frittata");
  });
  it("recupera salvataggi corrotti e conserva quelli validi", () => {
    expect(parseState("not json")).toEqual(initialState);
    expect(
      parseState(JSON.stringify({ ...initialState, plan: { recipe: "fake" } })),
    ).toEqual(initialState);
    expect(parseState(JSON.stringify(initialState))).toEqual(initialState);
  });
});

it("conserva un piano del catalogo italiano senza consumi automatici e aggiorna le icone", () => {
  const state = {
    ...initialState,
    plan: {
      recipe: `catalog:${catalogMeals[0].id}` as const,
      when: "Stasera",
      servings: 1,
      consumed: false,
    },
  };
  expect(consume(state)).toEqual(state);
  expect(parseState(JSON.stringify(state))).toEqual(state);
});

describe("Migrazione dei dati personali", () => {
  it("apre i salvataggi precedenti senza sostituire scorte e pasto", () => {
    const oldSave = {
      version: 1,
      foods: [
        {
          ...initialState.foods[0],
          id: "personal",
          name: "Carote",
          quantity: 9,
        },
      ],
      plan: { ...initialState.plan!, when: "Domani a cena", servings: 1 },
    };
    const restored = parseState(JSON.stringify(oldSave));
    expect(restored.foods).toEqual(oldSave.foods);
    expect(restored.plan).toEqual(oldSave.plan);
    expect(restored.shopping).toEqual([]);
    expect(restored.favoriteIds).toEqual([]);
  });

  it("scarta voci nuove corrotte senza perdere i dati validi", () => {
    const item = {
      id: "buy-carrots",
      name: "Carote",
      note: "Per la cena",
      checked: true,
      sources: [
        { id: catalogMeals[0].id, title: catalogMeals[0].title, measure: "2" },
      ],
    };
    const saved = {
      ...initialState,
      foods: [{ ...initialState.foods[0], quantity: 17 }],
      favoriteIds: [
        catalogMeals[0].id,
        "unknown-recipe",
        null,
        catalogMeals[0].id,
      ],
      shopping: [
        item,
        null,
        { ...item, id: "broken", sources: [{}] },
        { ...item, id: "missing-name", name: " " },
      ],
    };
    const restored = parseState(JSON.stringify(saved));
    expect(restored.foods).toEqual(saved.foods);
    expect(restored.plan).toEqual(saved.plan);
    expect(restored.favoriteIds).toEqual([catalogMeals[0].id]);
    expect(restored.shopping).toEqual([item]);
    expect(parseState(JSON.stringify(restored))).toEqual(restored);
  });
});

it("rimuove un vecchio piano ritirato senza perdere scorte, spesa e storico", () => {
  const saved = {
    ...initialState,
    plan: {
      recipe: "mealdb:53064",
      when: "Stasera",
      servings: 1,
      consumed: false,
    },
  };
  const loaded = parseState(JSON.stringify(saved));
  expect(loaded.plan).toBeNull();
  expect(loaded.foods).toEqual(initialState.foods);
  expect(loaded.shopping).toEqual(initialState.shopping);
});

it("B01 conserva la priorità manuale e ignora date impossibili", () => {
  const foods = [
    { ...initialState.foods[0], expires: "2026-12-20", priority: true },
    { ...initialState.foods[1], expires: "2026-11-16", priority: false },
  ];
  expect(useSoon(foods, new Date(2026, 10, 15))[0].id).toBe(foods[0].id);
  expect(daysUntil("2026-02-31")).toBeNull();
});
it("lo storico conta solo le scorte effettivamente sottratte", () => {
  const s = structuredClone(initialState);
  s.foods.push({
    ...s.foods[1],
    id: "uova-extra",
    priority: true,
    quantity: 6,
  });
  const result = consume(s);
  expect(result.foods.find((f) => f.id === "uova-extra")?.quantity).toBe(6);
  expect(result.cooked[0].priorityUsed).not.toContain("Uova");
  expect(consume(result).cooked).toHaveLength(1);
});
it("B02 confronta mancanti senza cambiare l'inventario", () => {
  const foods = initialState.foods.map((f) =>
    f.id === "uova" ? { ...f, quantity: 1 } : f,
  );
  const before = structuredClone(foods);
  const option = compareOptions(foods, 2).find((o) => o.id === "frittata")!;
  expect(option.ok).toBe(false);
  expect(option.items.find((i) => i.key === "uova")).toMatchObject({
    have: 1,
    need: 3,
  });
  expect(foods).toEqual(before);
});
