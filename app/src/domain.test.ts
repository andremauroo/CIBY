import { catalogMeals } from "./catalog";
import { describe, it, expect } from "vitest";
import {
  initialState,
  parseState,
  suggestions,
  consume,
  needs,
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

it("conserva un piano TheMealDB senza consumi automatici e aggiorna le icone", () => {
  const state = {
    ...initialState,
    plan: {
      recipe: `mealdb:${catalogMeals[0].id}` as const,
      when: "Stasera",
      servings: 1,
      consumed: false,
    },
  };
  expect(consume(state)).toEqual(state);
  expect(parseState(JSON.stringify(state))).toEqual(state);
});
