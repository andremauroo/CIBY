import type { ShoppingItem } from "./shopping";
import { catalogMeals } from "./catalog";
export type Food = {
  id: string;
  name: string;
  quantity: number;
  unit: "pezzi" | "g" | "kg" | "ml" | "l" | "confezioni";
  place: "Frigo" | "Dispensa";
  priority: boolean;
  art: string;
  /** Optional "da consumare entro" date (YYYY-MM-DD), chosen by the person. */
  expires?: string;
};
export type CookedEntry = {
  date: string;
  title: string;
  /** Names of the foods marked "da usare per primi" that the meal used. */
  priorityUsed: string[];
};
export type RecipeId = "frittata" | "riso" | "pomodori";
export type Plan = {
  recipe: RecipeId | `catalog:${string}` | `mealdb:${string}`;
  when: string;
  servings: number;
  consumed: boolean;
};
export type State = {
  version: 1;
  foods: Food[];
  plan: Plan | null;
  shopping: ShoppingItem[];
  favoriteIds: string[];
  cooked: CookedEntry[];
};
/** Local calendar date, YYYY-MM-DD, offset by a number of days. */
export function isoDay(offset = 0, from = new Date()) {
  const d = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate() + offset,
  );
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function daysUntil(expires: string | undefined, today = new Date()) {
  if (!expires || !/^\d{4}-\d{2}-\d{2}$/.test(expires)) return null;
  const [y, m, d] = expires.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  )
    return null;
  const target = date.getTime();
  const base = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  return Math.round((target - base) / 86400000);
}
export function expiryLabel(expires: string | undefined, today = new Date()) {
  const days = daysUntil(expires, today);
  if (days === null) return null;
  if (days < 0)
    return { text: "Data passata: verifica", tone: "late" as const };
  if (days === 0) return { text: "Entro oggi", tone: "soon" as const };
  if (days === 1) return { text: "Entro domani", tone: "soon" as const };
  if (days <= 3) return { text: `Entro ${days} giorni`, tone: "soon" as const };
  return { text: `Entro ${days} giorni`, tone: "ok" as const };
}
/** Foods to bring forward: chosen as priority, or close to their date. */
export function useSoon(foods: Food[], today = new Date()) {
  return foods
    .filter((f) => f.quantity > 0)
    .filter((f) => {
      const d = daysUntil(f.expires, today);
      return f.priority || (d !== null && d <= 3);
    })
    .sort(
      (a, b) =>
        Number(b.priority) - Number(a.priority) ||
        (daysUntil(a.expires, today) ?? 99) -
          (daysUntil(b.expires, today) ?? 99),
    );
}
export const initialState: State = {
  version: 1,
  shopping: [],
  favoriteIds: [],
  cooked: [],
  foods: [
    {
      id: "zucchine",
      expires: isoDay(2),
      name: "Zucchine",
      quantity: 2,
      unit: "pezzi",
      place: "Frigo",
      priority: true,
      art: "280eb.svg",
    },
    {
      id: "uova",
      expires: isoDay(9),
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
      expires: isoDay(4),
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
/** Per recipe: is it feasible now, and what is missing for these servings. */
export function compareOptions(foods: Food[], servings: number) {
  return (Object.keys(recipes) as RecipeId[]).map((id) => {
    const items = Object.entries(needs(id, servings)).map(([key, need]) => {
      const matches = foods.filter((f) => matching(f, key));
      const have = matches.reduce((sum, f) => sum + f.quantity, 0);
      const name = matches[0]?.name || key[0].toUpperCase() + key.slice(1);
      const unit = key === "riso" ? "g" : "pezzi";
      const priority = matches.some((f) => f.priority && f.quantity > 0);
      const expiring = matches.some((f) => {
        const d = daysUntil(f.expires);
        return f.quantity > 0 && d !== null && d <= 3;
      });
      return {
        key,
        name,
        need,
        have,
        unit,
        ok: have >= need,
        priority,
        expiring,
      };
    });
    return {
      id,
      ...recipes[id],
      items,
      ok: items.every((i) => i.ok),
      usesSoon: items
        .filter((i) => i.priority || i.expiring)
        .map((i) => i.name),
    };
  });
}
export function consume(state: State): State {
  if (
    !state.plan ||
    state.plan.consumed ||
    !available(state.foods, state.plan.recipe, state.plan.servings)
  )
    return state;
  const used = { ...needs(state.plan.recipe, state.plan.servings) };
  const foods = state.foods.map((f) => {
    const key = canonical(f.name);
    const amount =
      key && matching(f, key) ? Math.min(used[key] || 0, f.quantity) : 0;
    if (key) used[key] = Math.max(0, (used[key] || 0) - amount);
    return { ...f, quantity: f.quantity - amount };
  });

  return {
    ...state,
    foods,
    plan: { ...state.plan, consumed: true },
    cooked: [
      ...state.cooked,
      {
        date: isoDay(),
        title: recipes[state.plan.recipe as RecipeId].title,
        priorityUsed: [
          ...new Set(
            state.foods
              .filter((f) => {
                const key = canonical(f.name);
                const d = daysUntil(f.expires);
                return (
                  key &&
                  key in needs(state.plan!.recipe, state.plan!.servings) &&
                  matching(f, key) &&
                  foods.some(
                    (after) => after.id === f.id && after.quantity < f.quantity,
                  ) &&
                  (f.priority || (d !== null && d <= 3))
                );
              })
              .map((f) => f.name),
          ),
        ],
      },
    ].slice(-50),
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
          typeof f.art === "string" &&
          (f.expires === undefined ||
            (typeof f.expires === "string" &&
              /^\d{4}-\d{2}-\d{2}$/.test(f.expires))),
      )
    )
      throw Error();
    if (
      s.plan !== null &&
      (!s.plan ||
        (!Object.hasOwn(recipes, s.plan.recipe) &&
          !catalogMeals.some((m) => `catalog:${m.id}` === s.plan.recipe) &&
          !/^mealdb:/.test(s.plan.recipe)) ||
        ![1, 2].includes(s.plan.servings) ||
        typeof s.plan.when !== "string" ||
        typeof s.plan.consumed !== "boolean")
    )
      throw Error();
    // New collections are optional in older saves. Invalid new entries must
    // never erase the existing pantry or meal.
    const shopping: ShoppingItem[] = Array.isArray(s.shopping)
      ? s.shopping.filter(
          (item: ShoppingItem) =>
            item &&
            typeof item.id === "string" &&
            typeof item.name === "string" &&
            item.name.trim() &&
            typeof item.note === "string" &&
            typeof item.checked === "boolean" &&
            Array.isArray(item.sources) &&
            item.sources.every(
              (source) =>
                source &&
                typeof source.id === "string" &&
                typeof source.title === "string" &&
                typeof source.measure === "string",
            ),
        )
      : [];
    return {
      version: 1,
      foods: s.foods,
      plan: s.plan?.recipe?.startsWith("mealdb:") ? null : s.plan,
      shopping: shopping.filter(
        (item, index) =>
          shopping.findIndex((other) => other.id === item.id) === index,
      ),
      favoriteIds: Array.isArray(s.favoriteIds)
        ? [
            ...new Set<string>(
              s.favoriteIds.filter(
                (id: unknown) =>
                  typeof id === "string" &&
                  catalogMeals.some((meal) => meal.id === id),
              ),
            ),
          ]
        : [],
      cooked: Array.isArray(s.cooked)
        ? s.cooked.filter(
            (c: CookedEntry) =>
              c &&
              typeof c.date === "string" &&
              typeof c.title === "string" &&
              Array.isArray(c.priorityUsed) &&
              c.priorityUsed.every((n) => typeof n === "string"),
          )
        : [],
    };
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
