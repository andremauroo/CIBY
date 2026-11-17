import type { ShoppingItem } from "./shopping";
import { catalogMeals, ingredientLabel } from "./catalog";
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
/** A recipe that can be planned: a computable preparation or an Italian catalog recipe. */
export type RecipeRef = RecipeId | `catalog:${string}`;
/**
 * A meal assigned to a concrete occasion. The calendar is the only plan:
 * "il prossimo pasto" is simply the first meal still ahead.
 */
export type WeekMeal = {
  id: string;
  date: string;
  slot: MealSlot;
  recipe: RecipeRef;
  servings: number;
};
/** What happened to a food removed from the pantry. Declared by the person. */
export type WasteEntry = {
  date: string;
  name: string;
  outcome: "finito" | "buttato";
};
/** Saves before the calendar was unified. Read only by parseState. */
type LegacyPlan = {
  recipe: string;
  when: string;
  servings: number;
  consumed: boolean;
};
export type State = {
  version: 1;
  foods: Food[];
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
  week: [
    {
      id: "seed-dinner",
      date: isoDay(0),
      slot: "Cena",
      recipe: "frittata",
      servings: 2,
    },
  ],
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
/** Units of the same kind convert into each other; pieces and packs never do. */
const unitBase: Record<Food["unit"], [Food["unit"], number]> = {
  g: ["g", 1],
  kg: ["g", 1000],
  ml: ["ml", 1],
  l: ["ml", 1000],
  pezzi: ["pezzi", 1],
  confezioni: ["confezioni", 1],
};
const round3 = (value: number) => Math.round(value * 1000) / 1000;
export function convert(
  quantity: number,
  from: Food["unit"],
  to: Food["unit"],
): number | null {
  const [baseFrom, factorFrom] = unitBase[from];
  const [baseTo, factorTo] = unitBase[to];
  return baseFrom === baseTo
    ? round3((quantity * factorFrom) / factorTo)
    : null;
}
/** How much of an ingredient this food provides, in the ingredient's unit. */
export function amountFor(food: Food, key: string): number | null {
  if (canonical(food.name) !== key || !ingredients[key]) return null;
  return convert(food.quantity, food.unit, ingredients[key].unit);
}
export function matching(food: Food, key: string) {
  return amountFor(food, key) !== null;
}
export function stockOf(foods: Food[], key: string) {
  return round3(
    foods.reduce((sum, f) => sum + Math.max(0, amountFor(f, key) ?? 0), 0),
  );
}
/** "1500 g" reads better as "1,5 kg"; Italian decimal comma. */
export function formatAmount(quantity: number, unit: Food["unit"]) {
  const [value, shown] =
    unit === "g" && quantity >= 1000
      ? [quantity / 1000, "kg"]
      : unit === "ml" && quantity >= 1000
        ? [quantity / 1000, "l"]
        : [quantity, unit];
  return `${round3(value).toLocaleString("it-IT", { maximumFractionDigits: 2 })} ${shown}`;
}

/* ---------- Recipes: computable and catalog ---------- */
export const isLocalRecipe = (ref: string): ref is RecipeId =>
  Object.hasOwn(recipes, ref);
export function catalogMealFor(ref: string) {
  return ref.startsWith("catalog:")
    ? catalogMeals.find((m) => `catalog:${m.id}` === ref) || null
    : null;
}
export const isRecipeRef = (ref: unknown): ref is RecipeRef =>
  typeof ref === "string" && (isLocalRecipe(ref) || !!catalogMealFor(ref));
export function mealInfo(ref: RecipeRef) {
  if (isLocalRecipe(ref)) {
    const r = recipes[ref];
    return {
      title: r.title,
      time: r.time as number | null,
      effort: r.effort,
      local: true,
      sourceServings: null as number | null,
    };
  }
  const m = catalogMealFor(ref);
  return {
    title: m?.title || "Ricetta non disponibile",
    time: m?.minutes ?? null,
    effort: m?.sourceName || "Ricettario",
    local: false,
    sourceServings: m?.servings ?? null,
  };
}
/** "320 g", "1,5 l", "6", "6 medie", "250 g pulita". Anything else needs confirmation. */
export function parseMeasure(
  measure: string,
): { quantity: number; unit: Food["unit"] } | null {
  const match = measure
    .trim()
    .toLowerCase()
    .match(
      /^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l)?(?:\s+(?:pulit[oa]|medi[ae]|grand[ie]|piccol[ie]))?$/,
    );
  if (!match) return null;
  const quantity = Number(match[1].replace(",", "."));
  return quantity > 0
    ? { quantity, unit: (match[2] as Food["unit"]) || "pezzi" }
    : null;
}
export type NeedLine = {
  key: string | null;
  name: string;
  measure: string;
  /** In the ingredient's unit, scaled to the planned servings. */
  amount: number | null;
  unit: Food["unit"] | null;
  verified: boolean;
  reason: string;
};
/**
 * What a planned meal needs. Computable recipes are fully verified. For a
 * catalog recipe a quantity is verified only when the ingredient is tracked,
 * the measure is numeric and the source states its servings; otherwise it is
 * listed as "da confermare" and never subtracted automatically.
 */
export function mealNeeds(ref: RecipeRef, servings: number): NeedLine[] {
  if (isLocalRecipe(ref))
    return Object.entries(needs(ref, servings)).map(([key, amount]) => ({
      key,
      name: ingredients[key].label,
      measure: formatAmount(amount, ingredients[key].unit),
      amount,
      unit: ingredients[key].unit,
      verified: true,
      reason: "",
    }));
  const meal = catalogMealFor(ref);
  if (!meal) return [];
  return meal.ingredients.map((ingredient) => {
    const label = ingredientLabel(ingredient.name);
    const key = canonical(label) ?? canonical(ingredient.name);
    const parsed = parseMeasure(ingredient.measure);
    const base = key ? ingredients[key].unit : null;
    const converted =
      key && parsed && base
        ? convert(parsed.quantity, parsed.unit, base)
        : null;
    const line = {
      key,
      name: key ? ingredients[key].label : label,
      measure: ingredient.measure || "quantità non indicata",
    };
    if (!key)
      return {
        ...line,
        amount: null,
        unit: null,
        verified: false,
        reason: "non tracciato in dispensa",
      };
    if (!parsed)
      return {
        ...line,
        amount: null,
        unit: base,
        verified: false,
        reason: "quantità della fonte non numerica",
      };
    if (converted === null)
      return {
        ...line,
        amount: null,
        unit: base,
        verified: false,
        reason: "unità da confrontare",
      };
    if (!meal.servings)
      return {
        ...line,
        amount: null,
        unit: base,
        verified: false,
        reason: "porzioni della fonte non indicate",
      };
    const scaled = (converted * servings) / meal.servings;
    const amount =
      base === "pezzi" || base === "confezioni"
        ? Math.ceil(scaled)
        : Math.round(scaled);
    return { ...line, amount, unit: base, verified: true, reason: "" };
  });
}
/** Verified quantities only, summed by ingredient. */
export function verifiedNeeds(ref: RecipeRef, servings: number) {
  const total: Record<string, number> = {};
  for (const line of mealNeeds(ref, servings))
    if (line.verified && line.key && line.amount !== null)
      total[line.key] = round3((total[line.key] || 0) + line.amount);
  return total;
}
export function available(
  foods: Food[],
  id: string,
  servings: number,
  exclude: string[] = [],
) {
  if (!isRecipeRef(id)) return false;
  return Object.entries(verifiedNeeds(id, servings)).every(
    ([key, qty]) => !exclude.includes(key) && stockOf(foods, key) >= qty,
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
      const have = stockOf(foods, key);
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
/** Subtract the verified quantities, converting into each food's own unit. */
function cook(foods: Food[], recipe: RecipeRef, servings: number) {
  const left = { ...verifiedNeeds(recipe, servings) };
  const after = foods.map((f) => {
    const key = canonical(f.name);
    const own = key ? amountFor(f, key) : null;
    if (!key || own === null || !left[key]) return f;
    const take = Math.min(left[key], own);
    left[key] = round3(left[key] - take);
    const quantity = round3(
      f.quantity - (convert(take, ingredients[key].unit, f.unit) ?? 0),
    );
    return { ...f, quantity: Math.max(0, quantity) };
  });
  const entry: CookedEntry = {
    date: isoDay(),
    title: mealInfo(recipe).title,
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
/** Confirm a planned meal as cooked: only then the stock changes, once. */
export function cookMeal(state: State, id: string): State {
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
/** @deprecated name kept for the existing flows: cook a meal of the calendar. */
export const cookWeekMeal = cookMeal;
/** Cook the next meal of the calendar. */
export function consume(state: State): State {
  const meal = nextMeal(state);
  return meal ? cookMeal(state, meal.id) : state;
}
export function nextMeal(state: State, today = new Date()): WeekMeal | null {
  return upcomingMeals(state.week, today)[0] || null;
}
/** "Stasera", "Domani a pranzo", "Giovedì 20 a cena". */
export function occasionLabel(
  meal: Pick<WeekMeal, "date" | "slot">,
  today = new Date(),
) {
  const days = daysUntil(meal.date, today);
  if (days === 0) return meal.slot === "Cena" ? "Stasera" : "Oggi a pranzo";
  return `${dayLabel(meal.date, today)} a ${meal.slot.toLowerCase()}`;
}
/** Old "when" labels, for saves written before the calendar was unified. */
function legacyOccasion(when: string, today = new Date()) {
  const w = when.toLowerCase();
  return {
    date: isoDay(/domani/.test(w) ? 1 : 0, today),
    slot: (/pranzo/.test(w) ? "Pranzo" : "Cena") as MealSlot,
  };
}
export function freeFoods(state: State, today = new Date()): Food[] {
  const reserved = Object.fromEntries(
    weekBalance(state, today).map((b) => [b.key, b.need]),
  );
  return state.foods.map((f) => {
    const key = canonical(f.name);
    const own = key ? amountFor(f, key) : null;
    if (!key || own === null || !reserved[key]) return f;
    const take = Math.min(reserved[key], own);
    reserved[key] = round3(reserved[key] - take);
    return {
      ...f,
      quantity: round3(
        f.quantity - (convert(take, ingredients[key].unit, f.unit) ?? 0),
      ),
    };
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
  const planned = upcomingMeals(state.week, today).map((m) => ({
    title: mealInfo(m.recipe).title,
    needs: verifiedNeeds(m.recipe, m.servings),
  }));
  const keys = new Set([
    ...planned.flatMap((p) => Object.keys(p.needs)),
    ...state.foods.flatMap((f) => {
      const key = f.quantity > 0 ? canonical(f.name) : null;
      return key && matching(f, key) ? [key] : [];
    }),
  ]);
  return [...keys].map((key) => {
    const matches = state.foods.filter((f) => matching(f, key));
    const have = stockOf(state.foods, key);
    const need = round3(
      planned.reduce((sum, p) => sum + (p.needs[key] || 0), 0),
    );
    return {
      key,
      label: matches[0]?.name || ingredients[key].label,
      unit: ingredients[key].unit,
      have,
      need,
      missing: round3(Math.max(0, need - have)),
      free: round3(Math.max(0, have - need)),
      meals: planned.filter((p) => p.needs[key]).map((p) => p.title),
      soon: matches.some((f) => {
        const d = daysUntil(f.expires, today);
        return f.quantity > 0 && (f.priority || (d !== null && d <= 3));
      }),
    };
  });
}
/** Catalog quantities that the person still has to check, by planned meal. */
export function weekToConfirm(state: State, today = new Date()) {
  return upcomingMeals(state.week, today).flatMap((m) =>
    mealNeeds(m.recipe, m.servings)
      .filter((line) => !line.verified)
      .map((line) => ({ meal: mealInfo(m.recipe).title, ...line })),
  );
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
    // Saves from before the unified calendar: the separate "prossimo pasto"
    // becomes a meal of the calendar, unless that occasion is already taken.
    const legacy: LegacyPlan | null =
      s.plan &&
      isRecipeRef(s.plan.recipe) &&
      [1, 2].includes(s.plan.servings) &&
      typeof s.plan.when === "string" &&
      s.plan.consumed === false
        ? s.plan
        : null;
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
      week: ((): WeekMeal[] => {
        const week: WeekMeal[] = Array.isArray(s.week)
          ? s.week.filter(
              (m: WeekMeal) =>
                m &&
                typeof m.id === "string" &&
                daysUntil(m.date) !== null &&
                ["Pranzo", "Cena"].includes(m.slot) &&
                isRecipeRef(m.recipe) &&
                [1, 2].includes(m.servings),
            )
          : [];
        if (!legacy) return week;
        const occasion = legacyOccasion(legacy.when);
        return week.some(
          (m) => m.date === occasion.date && m.slot === occasion.slot,
        )
          ? week
          : [
              {
                id: "migrated-plan",
                ...occasion,
                recipe: legacy.recipe as RecipeRef,
                servings: legacy.servings,
              },
              ...week,
            ];
      })(),
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
  const n = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  // Specific names first: compound names ("brodo di pollo", "aceto di vino",
  // "olio di semi") must not fall into the category of their last word.
  for (const [pattern, file] of [
    [/\bacqua\b|\bwater\b/, "water.svg"],
    [/brodo|stock|dado/, "broth.svg"],
    [/\bolio\b|\boil\b/, "oil.svg"],
    [/aceto|vino|vinegar|wine/, "wine.svg"],
    [/\bmiele|honey/, "honey.svg"],
    [/panna|creme fraiche|crema di latte|mascarpone|cream/, "cream.svg"],
    [/burro|butter/, "butter.svg"],
    [/yogurt|yoghurt/, "yogurt.svg"],
    [/parmigian|parmesan|grana/, "parmesan.svg"],
    [/pecorino/, "pecorino.svg"],
    [/ricotta/, "ricotta.svg"],
    [/mozzarell|formagg|cheese|stracchino|scamorza/, "cheese.svg"],
    [/peperoncin|chil/, "chili.svg"],
    [
      /\bsale\b|\bpepe\b|pepper|salt|noce moscata|nutmeg|cannella|cinnamon|zafferano|saffron|paprika|curry|cumino|chiodi di garofano/,
      "spices.svg",
    ],
    [
      /basilic|prezzemol|rosmarin|salvia|\btimo\b|alloro|origano|maggiorana|menta|erba cipollina|aneto|basil|parsley|rosemary|thyme|sage|oregano|bay lea|marjoram|herb/,
      "herbs.svg",
    ],
    [/zuccher|sugar/, "sugar.svg"],
    [/farin|semol|flour|lievito/, "flour.svg"],
    [/tacchino|turkey/, "turkey.svg"],
    [/pollo|chicken/, "chicken.svg"],
    [
      /guancial|pancett|salsicc|prosciutt|salame|speck|bacon|mortadella|wurstel/,
      "cured-meat.svg",
    ],
    [
      /manzo|macinat|vitell|maiale|carne|\\bossi\\b|midollo|bistecc|polpett|beef|veal|pork|mince/,
      "minced-meat.svg",
    ],
    [/sgombro|mackerel/, "mackerel.svg"],
    [/tonno|tuna/, "can.svg"],
    [
      /gamber|scamp|cozze|vongol|calamar|seppi|prawn|shrimp|pesce|salmone|merluzzo/,
      "shrimp.svg",
    ],
    [/passata|pelati|concentrato|sugo|polpa di pomodoro/, "sauce.svg"],
    [/melanzan|eggplant|aubergine/, "eggplant.svg"],
    [/\bper[ae]\b|\bpear/, "pear.svg"],
    [/fagiol|borlott|cannellin|bean/, "kidney-beans.svg"],
    [/aglio|garlic/, "garlic.svg"],
    [/cipoll|scalogn|onion|shallot/, "onion.svg"],
    [/porr|sedano|finocchi|celery|leek|fennel/, "celery.svg"],
    [/spinac|bietol|spinach/, "spinach.svg"],
    [/lattug|insalat|rucola|radicchi|lettuce/, "lettuce.svg"],
    [/cavolfior|cauliflower/, "cauliflower.svg"],
    [/broccol/, "broccoli.svg"],
    [/cavol|verza|kale|cabbage/, "cabbage.svg"],
    [/fungh|fungo|porcin|champignon|mushroom/, "mushroom.svg"],
    [/limon|aranc|lime|lemon|orange|scorza/, "lemon.svg"],
    [/oliv/, "olives.svg"],
    [/pisell|peas/, "peas.svg"],
    [/\bzucca\b|pumpkin/, "pumpkin.svg"],
    [/cetriol|cucumber/, "cucumber.svg"],
    [/patat|potato/, "potato.svg"],
    [/zucchin|courgette/, "280eb.svg"],
    [/\buov[ao]|tuorl|albume|\beggs?\b/, "104a0.svg"],
    [/riso|rice|couscous|cous cous|cuscus/, "6bf46.svg"],
    [/pomodor|tomat/, "dd50e.svg"],
    [
      /pasta|spaghett|penne|fusilli|rigaton|lasagn|ditalin|ditalon|maltagliat|\bpipe\b|fettucc|linguin|farfall|tagliatell|orecchiett|paccher|tortell|gnocch/,
      "pasta.svg",
    ],
    [/lenticch|lentil/, "lentils.svg"],
    [/latte|bevanda.*avena|milk/, "milk.svg"],
    [/\bpane|panin|mollica|pangrattato|bread/, "bread.svg"],
    [/carot/, "carrot.svg"],
    [/\bmel[ae]\b|apple/, "apple.svg"],
    [/ceci|cece|legum|chickpea/, "beans.svg"],
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

/**
 * Quantities typed on a phone: accepts a decimal comma ("0,25") as well as a
 * point, any number of decimals, and rejects zero, negatives and text.
 */
export function parseQuantity(raw: string): number | null {
  const text = raw.trim().replace(/\s+/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$|^\.\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) && value > 0 && value <= 100000
    ? Math.round(value * 1000) / 1000
    : null;
}

/** Illustration of a prepared dish, from the recipe title (local or catalog). */
export function dishArt(title: string) {
  const t = title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [pattern, file] of [
    [/frittat|omelette/, "dish-frittata.svg"],
    [/uova|egg/, "dish-eggs-toast.svg"],
    [/parmigiana|lasagn|al forno|gratin/, "dish-baked.svg"],
    [/polpett|meatball/, "dish-meatballs.svg"],
    [
      /zupp|minestr|ribollit|brodo|pasta e (ceci|fagioli|lenticchie|patate)|vellutat/,
      "dish-soup.svg",
    ],
    [/caprese|panzanella|insalata(?! di riso)/, "dish-salad.svg"],
    [/bowl|insalata di riso|cous ?cous|poke/, "dish-bowl.svg"],
    [/risott|riso/, "dish-risotto.svg"],
    [/carbonara|cacio|gricia|aglio|burro|alfredo/, "dish-pasta-white.svg"],
    [
      /pasta|spaghett|penne|rigaton|norma|linguin|fusill|bucatin|amatrician/,
      "dish-pasta-tomato.svg",
    ],
  ] as const)
    if (pattern.test(t)) return file;
  return "dish-frittata.svg";
}
