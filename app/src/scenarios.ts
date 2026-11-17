import { artFor, initialState, isoDay, type Food, type State } from "./domain";

/**
 * Starting points for HCI sessions, built on the C2 personas. Each one
 * replaces the data in this browser, so a test always starts the same way.
 */
const food = (
  id: string,
  name: string,
  quantity: number,
  unit: Food["unit"],
  place: Food["place"],
  extra: Partial<Food> = {},
): Food => ({
  id,
  name,
  quantity,
  unit,
  place,
  priority: false,
  art: artFor(name),
  ...extra,
});
const base = (): State => ({
  ...structuredClone(initialState),
  week: [],
  foods: [],
});

export const scenarios = [
  {
    id: "marta",
    who: "Marta",
    need: "B01 · Un alimento fuori routine",
    task: "Cena per due e pranzo di domani: dai un posto alla mozzarella prima che scada.",
    build: (): State => ({
      ...base(),
      foods: [
        food("s-mozzarella", "Mozzarella", 2, "pezzi", "Frigo", {
          expires: isoDay(0),
        }),
        food("s-pomodori", "Pomodori", 5, "pezzi", "Frigo", {
          expires: isoDay(3),
        }),
        food("s-pasta", "Pasta", 400, "g", "Dispensa"),
        food("s-uova", "Uova", 4, "pezzi", "Frigo", { expires: isoDay(10) }),
        food("s-pane", "Pane", 2, "pezzi", "Dispensa", { expires: isoDay(1) }),
      ],
    }),
  },
  {
    id: "gianfranco",
    who: "Gianfranco",
    need: "B02 · Una cena praticabile",
    task: "Rientri tardi dalle lezioni: scegli una cena che richieda al massimo 15 minuti.",
    build: (): State => ({
      ...base(),
      foods: [
        food("s-couscous", "Cous cous", 300, "g", "Dispensa"),
        food("s-zucchine", "Zucchine", 1, "pezzi", "Frigo", {
          expires: isoDay(2),
        }),
        food("s-uova", "Uova", 4, "pezzi", "Frigo", { expires: isoDay(8) }),
        food("s-pane", "Pane", 3, "pezzi", "Dispensa", { expires: isoDay(2) }),
        food("s-lenticchie", "Lenticchie", 400, "g", "Dispensa"),
        food("s-carote", "Carote", 3, "pezzi", "Frigo", { expires: isoDay(6) }),
      ],
    }),
  },
  {
    id: "luca",
    who: "Luca",
    need: "B03/B04 · Manca un ingrediente",
    task: "Per la bowl di stasera manca il pollo: adatta la cena o rinviala, poi controlla cosa comprare.",
    build: (): State => ({
      ...base(),
      foods: [
        food("s-riso", "Riso", 500, "g", "Dispensa"),
        food("s-carote", "Carote", 2, "pezzi", "Frigo", {
          priority: true,
          expires: isoDay(2),
        }),
        food("s-zucchine", "Zucchine", 2, "pezzi", "Frigo", {
          expires: isoDay(1),
        }),
        food("s-uova", "Uova", 2, "pezzi", "Frigo", { expires: isoDay(7) }),
      ],
      week: [
        {
          id: "s-tonight",
          date: isoDay(0),
          slot: "Cena",
          recipe: "bowlPollo",
          servings: 1,
        },
        {
          id: "s-week-1",
          date: isoDay(2),
          slot: "Cena",
          recipe: "zuppaLenticchie",
          servings: 1,
        },
      ],
      shopping: [
        {
          id: "s-shop-1",
          name: "Lenticchie",
          note: "",
          checked: false,
          sources: [],
        },
      ],
    }),
  },
] as const;
