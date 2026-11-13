import { catalogMeals } from "./catalog";
export type Food = {
  id: string;
  name: string;
  quantity: number;
  unit: "pezzi" | "g" | "kg" | "ml" | "l" | "confezioni";
  place: "Frigo" | "Dispensa";
  priority: boolean;
  art: string;
};
export type RecipeId = "frittata" | "riso" | "pomodori";
export type Plan = {
  recipe: RecipeId | `mealdb:${string}`;
  when: string;
  servings: number;
  consumed: boolean;
};
export type State = { version: 1; foods: Food[]; plan: Plan | null };
export const initialState: State = {
  version: 1,
  foods: [
    {
      id: "zucchine",
      name: "Zucchine",
      quantity: 2,
      unit: "pezzi",
      place: "Frigo",
      priority: true,
      art: "280eb.svg",
    },
    {
      id: "uova",
      name: "Uova",
      quantity: 3,
      unit: "pezzi",
      place: "Frigo",
      priority: false,
      art: "104a0.svg",
    },
    {
      id: "riso",
      name: "Riso",
      quantity: 250,
      unit: "g",
      place: "Dispensa",
      priority: false,
      art: "6bf46.svg",
    },
    {
      id: "pomodori",
      name: "Pomodori",
      quantity: 4,
      unit: "pezzi",
      place: "Frigo",
      priority: false,
      art: "dd50e.svg",
    },
  ],
  plan: { recipe: "frittata", when: "Stasera", servings: 2, consumed: false },
};
export const recipes: Record<
  RecipeId,
  { title: string; time: number; effort: string; steps: string[] }
> = {
  frittata: {
    title: "Frittata di zucchine",
    time: 20,
    effort: "Una padella",
    steps: [
      "Taglia le zucchine sottili e cuocile in padella con poco olio.",
      "Sbatti le uova, uniscile alle zucchine e completa la cottura.",
      "Dividi nelle porzioni previste. Olio e sale sono da verificare prima di iniziare.",
    ],
  },
  riso: {
    title: "Riso e zucchine",
    time: 20,
    effort: "Due pentole",
    steps: [
      "Verifica il tempo del riso sulla confezione: la stima totale può cambiare.",
      "Taglia le zucchine e cuocile in padella con poco olio.",
      "Cuoci il riso, scolalo e uniscilo alle zucchine. Olio e sale sono da verificare.",
    ],
  },
  pomodori: {
    title: "Riso e pomodori",
    time: 20,
    effort: "Due pentole",
    steps: [
      "Verifica il tempo di cottura del riso sulla confezione.",
      "Taglia i pomodori e condiscili secondo le tue preferenze.",
      "Cuoci il riso e uniscilo ai pomodori. Verifica di avere olio e sale.",
    ],
  },
};
export function needs(id: string, servings: number): Record<string, number> {
  if (!Object.hasOwn(recipes, id)) return {};
  return id === "frittata"
    ? { zucchine: servings, uova: servings === 1 ? 2 : 3 }
    : id === "riso"
      ? { zucchine: servings, riso: 80 * servings }
      : { pomodori: 2 * servings, riso: 80 * servings };
}
export function canonical(name: string): string | null {
  const n = name.trim().toLowerCase();
  return (
    (
      {
        zucchina: "zucchine",
        zucchine: "zucchine",
        uovo: "uova",
        uova: "uova",
        riso: "riso",
        pomodoro: "pomodori",
        pomodori: "pomodori",
      } as Record<string, string>
    )[n] || null
  );
}
export function matching(food: Food, key: string) {
  return (
    canonical(food.name) === key &&
    food.unit === (key === "riso" ? "g" : "pezzi")
  );
}
export function available(
  foods: Food[],
  id: string,
  servings: number,
  exclude: string[] = [],
) {
  if (!Object.hasOwn(recipes, id)) return false;
  return Object.entries(needs(id, servings)).every(
    ([key, qty]) =>
      !exclude.includes(key) &&
      foods
        .filter((f) => matching(f, key))
        .reduce((sum, f) => sum + f.quantity, 0) >= qty,
  );
}
export function suggestions(
  foods: Food[],
  servings = 2,
  time = 20,
  exclude: string[] = [],
): RecipeId[] {
  return (Object.keys(recipes) as RecipeId[])
    .filter(
      (id) =>
        recipes[id].time <= time && available(foods, id, servings, exclude),
    )
    .slice(0, 2);
}
export function consume(state: State): State {
  if (
    !state.plan ||
    state.plan.consumed ||
    !available(state.foods, state.plan.recipe, state.plan.servings)
  )
    return state;
  const used = { ...needs(state.plan.recipe, state.plan.servings) };
  return {
    ...state,
    foods: state.foods.map((f) => {
      const key = canonical(f.name);
      const amount =
        key && matching(f, key) ? Math.min(used[key] || 0, f.quantity) : 0;
      if (key) used[key] = Math.max(0, (used[key] || 0) - amount);
      return { ...f, quantity: f.quantity - amount };
    }),
    plan: { ...state.plan, consumed: true },
  };
}
export function parseState(raw: string | null): State {
  try {
    const s = JSON.parse(raw || "null");
    if (
      s?.version !== 1 ||
      !Array.isArray(s.foods) ||
      !s.foods.every(
        (f: Food) =>
          typeof f.id === "string" &&
          typeof f.name === "string" &&
          Number.isFinite(f.quantity) &&
          f.quantity >= 0 &&
          ["g", "pezzi", "kg", "ml", "l", "confezioni"].includes(f.unit) &&
          ["Frigo", "Dispensa"].includes(f.place) &&
          typeof f.priority === "boolean" &&
          typeof f.art === "string",
      )
    )
      throw Error();
    if (
      s.plan !== null &&
      (!s.plan ||
        (!Object.hasOwn(recipes, s.plan.recipe) &&
          !catalogMeals.some((m) => `mealdb:${m.id}` === s.plan.recipe)) ||
        ![1, 2].includes(s.plan.servings) ||
        typeof s.plan.when !== "string" ||
        typeof s.plan.consumed !== "boolean")
    )
      throw Error();
    return s;
  } catch {
    return structuredClone(initialState);
  }
}
export function artFor(name: string) {
  const n = name.toLowerCase();
  for (const [pattern, file] of [
    [/zucchin/, "280eb.svg"],
    [/uov/, "104a0.svg"],
    [/riso/, "6bf46.svg"],
    [/pomodor/, "dd50e.svg"],
    [/pasta|spaghetti|penne|fusilli|rigatoni|lasagn/, "pasta.svg"],
    [/lenticch/, "lentils.svg"],
    [/latte|bevanda.*avena/, "milk.svg"],
    [/pane|panin/, "bread.svg"],
    [/carot/, "carrot.svg"],
    [/mel[ae]|pera|pere/, "apple.svg"],
    [/ceci|fagiol|legum/, "beans.svg"],
    [/patat/, "potato.svg"],
  ] as const)
    if (pattern.test(n)) return file;
  return "generic-food.svg";
}
