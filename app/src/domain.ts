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
export type RecipeId =
  | "frittata"
  | "riso"
  | "pomodori"
  | "pastaPomodoro"
  | "couscous"
  | "bowlPollo"
  | "pastaCeci"
  | "insalataRiso"
  | "frittataPatate"
  | "uovaPane"
  | "caprese"
  | "zuppaLenticchie";
export type MealSlot = "Pranzo" | "Cena";
/** A meal assigned to a concrete day: ingredients stay in stock until cooked. */
export type WeekMeal = {
  id: string;
  date: string;
  slot: MealSlot;
  recipe: RecipeId;
  servings: number;
};
/** What happened to a food removed from the pantry. Declared by the person. */
export type WasteEntry = {
  date: string;
  name: string;
  outcome: "finito" | "buttato";
};
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
  week: WeekMeal[];
  waste: WasteEntry[];
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
  week: [],
  waste: [],
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
    {
      id: "mozzarella",
      expires: isoDay(1),
      name: "Mozzarella",
      quantity: 1,
      unit: "pezzi",
      place: "Frigo",
      priority: false,
      art: "cheese.svg",
    },
    {
      id: "pasta",
      name: "Pasta",
      quantity: 500,
      unit: "g",
      place: "Dispensa",
      priority: false,
      art: "pasta.svg",
    },
  ],
  plan: { recipe: "frittata", when: "Stasera", servings: 2, consumed: false },
};
export const recipes: Record<
  RecipeId,
  {
    title: string;
    time: number;
    effort: string;
    steps: string[];
    /** No meat or fish among the listed ingredients. Not a dietary guarantee. */
    veg: boolean;
  }
> = {
  frittata: {
    title: "Frittata di zucchine",
    time: 20,
    effort: "Una padella",
    veg: true,
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
    veg: true,
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
    veg: true,
    steps: [
      "Verifica il tempo di cottura del riso sulla confezione.",
      "Taglia i pomodori e condiscili secondo le tue preferenze.",
      "Cuoci il riso e uniscilo ai pomodori. Verifica di avere olio e sale.",
    ],
  },
  pastaPomodoro: {
    title: "Pasta al pomodoro fresco",
    time: 15,
    effort: "Una pentola e una padella",
    veg: true,
    steps: [
      "Metti l’acqua a bollire e verifica il tempo della pasta sulla confezione.",
      "Taglia i pomodori a pezzi e scaldali in padella con poco olio.",
      "Scola la pasta e saltala nel sugo. Olio e sale sono da verificare.",
    ],
  },
  couscous: {
    title: "Cous cous e zucchine",
    time: 15,
    effort: "Una padella e una ciotola",
    veg: true,
    steps: [
      "Taglia le zucchine a cubetti e cuocile in padella con poco olio.",
      "Versa acqua calda sul cous cous seguendo la confezione e copri.",
      "Sgrana il cous cous e unisci le zucchine. Si può portare anche fuori casa.",
    ],
  },
  bowlPollo: {
    title: "Bowl di riso e pollo",
    time: 30,
    effort: "Una pentola e una padella",
    veg: false,
    steps: [
      "Cuoci il riso seguendo il tempo sulla confezione.",
      "Taglia il pollo a pezzi e cuocilo bene in padella; taglia le carote a bastoncini.",
      "Componi la bowl nelle porzioni previste. Olio e sale sono da verificare.",
    ],
  },
  pastaCeci: {
    title: "Pasta e ceci veloce",
    time: 25,
    effort: "Una pentola",
    veg: true,
    steps: [
      "Scalda i ceci già cotti in pentola con poco olio.",
      "Aggiungi acqua, porta a bollore e cuoci la pasta nello stesso tegame.",
      "Lascia restringere fino alla consistenza che preferisci. Sale da verificare.",
    ],
  },
  insalataRiso: {
    title: "Insalata di riso e tonno",
    time: 25,
    effort: "Una pentola",
    veg: false,
    steps: [
      "Cuoci il riso seguendo la confezione e raffreddalo sotto l’acqua.",
      "Taglia i pomodori e sgocciola il tonno.",
      "Unisci tutto. Olio e sale sono da verificare.",
    ],
  },
  frittataPatate: {
    title: "Frittata di patate",
    time: 30,
    effort: "Una padella",
    veg: true,
    steps: [
      "Taglia le patate a fette sottili e cuocile in padella finché sono morbide.",
      "Sbatti le uova e versale sulle patate.",
      "Completa la cottura girando la frittata. Olio e sale sono da verificare.",
    ],
  },
  uovaPane: {
    title: "Uova strapazzate e pane",
    time: 10,
    effort: "Una padella",
    veg: true,
    steps: [
      "Sbatti le uova con un pizzico di sale.",
      "Cuocile a fuoco basso mescolando.",
      "Servile sul pane, tostato se preferisci.",
    ],
  },
  caprese: {
    title: "Caprese",
    time: 5,
    effort: "Nessuna cottura",
    veg: true,
    steps: [
      "Taglia a fette pomodori e mozzarella.",
      "Alternali nel piatto.",
      "Condisci secondo le tue preferenze. Olio e sale sono da verificare.",
    ],
  },
  zuppaLenticchie: {
    title: "Zuppa di lenticchie e carote",
    time: 35,
    effort: "Una pentola",
    veg: true,
    steps: [
      "Taglia le carote a rondelle e falle andare in pentola con poco olio.",
      "Aggiungi le lenticchie secche e copri d’acqua: verifica il tempo sulla confezione.",
      "Cuoci finché sono morbide. Sale da verificare.",
    ],
  },
};
/** Recognised ingredients: display name, stock unit and accepted spellings. */
export const ingredients: Record<
  string,
  { label: string; unit: Food["unit"]; names: string[] }
> = {
  zucchine: {
    label: "Zucchine",
    unit: "pezzi",
    names: ["zucchina", "zucchine"],
  },
  uova: { label: "Uova", unit: "pezzi", names: ["uovo", "uova"] },
  riso: { label: "Riso", unit: "g", names: ["riso"] },
  pomodori: {
    label: "Pomodori",
    unit: "pezzi",
    names: ["pomodoro", "pomodori"],
  },
  pasta: {
    label: "Pasta",
    unit: "g",
    names: ["pasta", "spaghetti", "penne", "fusilli", "rigatoni"],
  },
  couscous: {
    label: "Cous cous",
    unit: "g",
    names: ["cous cous", "couscous", "cuscus"],
  },
  pollo: { label: "Pollo", unit: "g", names: ["pollo", "petto di pollo"] },
  carote: { label: "Carote", unit: "pezzi", names: ["carota", "carote"] },
  ceci: { label: "Ceci", unit: "g", names: ["ceci", "ceci cotti"] },
  tonno: { label: "Tonno", unit: "confezioni", names: ["tonno"] },
  patate: { label: "Patate", unit: "pezzi", names: ["patata", "patate"] },
  pane: { label: "Pane", unit: "pezzi", names: ["pane", "fette di pane"] },
  mozzarella: {
    label: "Mozzarella",
    unit: "pezzi",
    names: ["mozzarella", "mozzarelle"],
  },
  lenticchie: { label: "Lenticchie", unit: "g", names: ["lenticchie"] },
};
const eggs = (servings: number) => (servings === 1 ? 2 : 3);
const perServing: Record<
  RecipeId,
  (servings: number) => Record<string, number>
> = {
  frittata: (n) => ({ zucchine: n, uova: eggs(n) }),
  riso: (n) => ({ zucchine: n, riso: 80 * n }),
  pomodori: (n) => ({ pomodori: 2 * n, riso: 80 * n }),
  pastaPomodoro: (n) => ({ pasta: 80 * n, pomodori: 2 * n }),
  couscous: (n) => ({ couscous: 70 * n, zucchine: n }),
  bowlPollo: (n) => ({ riso: 80 * n, pollo: 150 * n, carote: n }),
  pastaCeci: (n) => ({ pasta: 70 * n, ceci: 120 * n }),
  insalataRiso: (n) => ({ riso: 80 * n, tonno: n, pomodori: n }),
  frittataPatate: (n) => ({ patate: 2 * n, uova: eggs(n) }),
  uovaPane: (n) => ({ uova: 2 * n, pane: 2 * n }),
  caprese: (n) => ({ pomodori: 2 * n, mozzarella: n }),
  zuppaLenticchie: (n) => ({ lenticchie: 80 * n, carote: n }),
};
export function needs(id: string, servings: number): Record<string, number> {
  if (!Object.hasOwn(recipes, id)) return {};
  return perServing[id as RecipeId](servings);
}
const canonicalNames = new Map(
  Object.entries(ingredients).flatMap(([key, value]) =>
    value.names.map((name) => [name, key] as const),
  ),
);
export function canonical(name: string): string | null {
  return (
    canonicalNames.get(name.trim().toLowerCase().replace(/\s+/g, " ")) || null
  );
}
export function matching(food: Food, key: string) {
  return canonical(food.name) === key && food.unit === ingredients[key]?.unit;
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
      const name = matches[0]?.name || ingredients[key].label;
      const unit = ingredients[key].unit;
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
/** Subtract a feasible recipe from the stock and describe what was cooked. */
function cook(foods: Food[], recipe: RecipeId, servings: number) {
  const used = { ...needs(recipe, servings) };
  const after = foods.map((f) => {
    const key = canonical(f.name);
    const amount =
      key && matching(f, key) ? Math.min(used[key] || 0, f.quantity) : 0;
    if (key) used[key] = Math.max(0, (used[key] || 0) - amount);
    return { ...f, quantity: f.quantity - amount };
  });
  const entry: CookedEntry = {
    date: isoDay(),
    title: recipes[recipe].title,
    priorityUsed: [
      ...new Set(
        foods
          .filter((f) => {
            const d = daysUntil(f.expires);
            return (
              after.some((a) => a.id === f.id && a.quantity < f.quantity) &&
              (f.priority || (d !== null && d <= 3))
            );
          })
          .map((f) => f.name),
      ),
    ],
  };
  return { foods: after, entry };
}
export function consume(state: State): State {
  if (
    !state.plan ||
    state.plan.consumed ||
    !available(state.foods, state.plan.recipe, state.plan.servings)
  )
    return state;
  const { foods, entry } = cook(
    state.foods,
    state.plan.recipe as RecipeId,
    state.plan.servings,
  );
  return {
    ...state,
    foods,
    plan: { ...state.plan, consumed: true },
    cooked: [...state.cooked, entry].slice(-50),
  };
}
/** Confirm a meal of the week as cooked: only then the stock changes. */
export function cookWeekMeal(state: State, id: string): State {
  const meal = state.week.find((m) => m.id === id);
  if (!meal || !available(state.foods, meal.recipe, meal.servings))
    return state;
  const { foods, entry } = cook(state.foods, meal.recipe, meal.servings);
  return {
    ...state,
    foods,
    week: state.week.filter((m) => m.id !== id),
    cooked: [...state.cooked, entry].slice(-50),
  };
}
/** Stock left once the planned occasions are covered (never negative). */
export function freeFoods(state: State, today = new Date()): Food[] {
  const reserved = Object.fromEntries(
    weekBalance(state, today).map((b) => [b.key, b.need]),
  );
  return state.foods.map((f) => {
    const key = canonical(f.name);
    if (!key || !matching(f, key)) return f;
    const amount = Math.min(reserved[key] || 0, f.quantity);
    reserved[key] = (reserved[key] || 0) - amount;
    return { ...f, quantity: f.quantity - amount };
  });
}
export function dayLabel(date: string, today = new Date()) {
  const days = daysUntil(date, today);
  if (days === 0) return "Oggi";
  if (days === 1) return "Domani";
  const [y, m, d] = date.split("-").map(Number);
  const text = new Date(y, m - 1, d).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
  });
  return text[0].toUpperCase() + text.slice(1);
}
export const weekId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `meal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
/** Meals still ahead, in order. Past days are kept out of the totals. */
export function upcomingMeals(week: WeekMeal[], today = new Date()) {
  return week
    .filter((m) => (daysUntil(m.date, today) ?? -1) >= 0)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        Number(a.slot === "Cena") - Number(b.slot === "Cena"),
    );
}
/**
 * B03/B04: what the planned occasions need, against the stock.
 * `free` is the quantity with no planned use; `missing` is what to buy.
 */
export function weekBalance(state: State, today = new Date()) {
  const planned: { title: string; needs: Record<string, number> }[] =
    upcomingMeals(state.week, today).map((m) => ({
      title: recipes[m.recipe].title,
      needs: needs(m.recipe, m.servings),
    }));
  if (
    state.plan &&
    !state.plan.consumed &&
    Object.hasOwn(recipes, state.plan.recipe)
  )
    planned.unshift({
      title: recipes[state.plan.recipe as RecipeId].title,
      needs: needs(state.plan.recipe, state.plan.servings),
    });
  const keys = new Set([
    ...planned.flatMap((p) => Object.keys(p.needs)),
    ...state.foods.flatMap((f) => {
      const key = f.quantity > 0 ? canonical(f.name) : null;
      return key && matching(f, key) ? [key] : [];
    }),
  ]);
  return [...keys].map((key) => {
    const matches = state.foods.filter((f) => matching(f, key));
    const have = matches.reduce((sum, f) => sum + f.quantity, 0);
    const need = planned.reduce((sum, p) => sum + (p.needs[key] || 0), 0);
    return {
      key,
      label: matches[0]?.name || ingredients[key].label,
      unit: ingredients[key].unit,
      have,
      need,
      missing: Math.max(0, need - have),
      free: Math.max(0, have - need),
      meals: planned.filter((p) => p.needs[key]).map((p) => p.title),
      soon: matches.some((f) => {
        const d = daysUntil(f.expires, today);
        return f.quantity > 0 && (f.priority || (d !== null && d <= 3));
      }),
    };
  });
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
      week: Array.isArray(s.week)
        ? s.week.filter(
            (m: WeekMeal) =>
              m &&
              typeof m.id === "string" &&
              daysUntil(m.date) !== null &&
              ["Pranzo", "Cena"].includes(m.slot) &&
              Object.hasOwn(recipes, m.recipe) &&
              [1, 2].includes(m.servings),
          )
        : [],
      waste: Array.isArray(s.waste)
        ? s.waste.filter(
            (w: WasteEntry) =>
              w &&
              typeof w.date === "string" &&
              typeof w.name === "string" &&
              ["finito", "buttato"].includes(w.outcome),
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
    [/mozzarell|formagg|parmigian|pecorino|ricotta/, "cheese.svg"],
    [/pollo|tacchino/, "chicken.svg"],
    [/tonno|sgombro/, "can.svg"],
  ] as const)
    if (pattern.test(n)) return file;
  return "generic-food.svg";
}

const pantryStaples = new Set([
  "riso",
  "pasta",
  "couscous",
  "ceci",
  "lenticchie",
  "tonno",
  "pane",
  "patate",
]);
/**
 * Suggested unit and place for a purchase. The quantity is never guessed:
 * recipe measures are references, the person states what was actually bought.
 */
export function purchaseDefaults(name: string): {
  unit: Food["unit"];
  place: Food["place"];
} {
  const key = canonical(name);
  return {
    unit: key ? ingredients[key].unit : "pezzi",
    place: key && pantryStaples.has(key) ? "Dispensa" : "Frigo",
  };
}
/** Bring several purchases into the pantry and off the list in one update. */
export function stockPurchases(
  state: State,
  rows: {
    itemId: string;
    name: string;
    quantity: number;
    unit: Food["unit"];
    place: Food["place"];
    expires?: string;
  }[],
  makeId: () => string,
): State {
  const valid = rows.filter(
    (r) =>
      r.name.trim() &&
      Number.isFinite(r.quantity) &&
      r.quantity > 0 &&
      state.shopping.some((item) => item.id === r.itemId),
  );
  if (!valid.length) return state;
  const added: Food[] = valid.map((r) => ({
    id: makeId(),
    name: r.name.trim(),
    quantity: r.quantity,
    unit: r.unit,
    place: r.place,
    priority: false,
    art: artFor(r.name),
    ...(r.expires && daysUntil(r.expires) !== null
      ? { expires: r.expires }
      : {}),
  }));
  const moved = new Set(valid.map((r) => r.itemId));
  return {
    ...state,
    foods: [...state.foods, ...added],
    shopping: state.shopping.filter((item) => !moved.has(item.id)),
  };
}
