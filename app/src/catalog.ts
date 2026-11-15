import catalog from "./data/recipes.json";
import type { Food } from "./domain";
export const catalogMeals = catalog.meals;
export type CatalogMeal = (typeof catalogMeals)[number];

// Exact names and translations, not culinary substitutions. A generic name
// never establishes that a particular variety or preparation is in stock.
const groups: [string, ...string[]][] = [
  [
    "Olio extravergine di oliva",
    "olio extravergine d’oliva",
    "olio extravergine d'oliva",
  ],
  ["Cipolla dorata", "cipolle dorate"],
  ["Pomodori pelati", "pomodoro pelato", "pelati"],
  ["Pecorino romano", "pecorino romano dop"],
  ["Ceci secchi decorticati", "ceci decorticati secchi"],
  ["Fagioli cannellini cotti", "cannellini cotti", "cannellini lessati"],
  ["Tuorli", "tuorlo"],

  ["Uova", "uovo", "egg", "eggs"],
  ["Zucchine", "zucchina", "courgette", "courgettes", "zucchini"],
  ["Pomodori", "pomodoro", "tomato", "tomatoes"],
  ["Pomodorini ciliegini", "pomodoro ciliegino", "cherry tomatoes"],
  ["Pomodorini datterini", "baby plum tomatoes"],
  ["Pomodori a pezzi", "chopped tomatoes"],
  ["Pomodori in scatola", "canned tomatoes"],
  ["Passata", "passata di pomodoro"],
  ["Concentrato di pomodoro", "tomato puree"],
  ["Latte", "milk"],
  ["Pane", "bread"],
  ["Pane integrale", "wholegrain bread"],
  ["Carote", "carota", "carrot", "carrots"],
  ["Patate", "patata", "potato", "potatoes"],
  ["Ceci", "cece", "chickpea", "chickpeas"],
  ["Lenticchie", "lenticchia", "lentils"],
  ["Riso", "rice"],
  ["Cipolla", "cipolle", "onion", "onions"],
  ["Cipolla rossa", "cipolle rosse", "red onion", "red onions"],
  ["Aglio", "garlic", "garlic clove", "garlic cloves"],
  ["Olio di oliva", "olio d'oliva", "olive oil"],
  [
    "Olio extravergine di oliva",
    "olio extravergine",
    "olio evo",
    "extra virgin olive oil",
  ],
  ["Sale", "salt"],
  ["Pollo", "chicken"],
  ["Petto di pollo", "petti di pollo", "chicken breast", "chicken breasts"],
  ["Burro", "butter"],
  ["Parmigiano", "parmigiano reggiano", "parmesan", "parmesan cheese"],
  ["Mozzarella", "mozzarelle", "mozzarella balls"],
  ["Fettuccine", "fettucine"],
  ["Linguine", "linguine pasta"],
  ["Farfalle", "bowtie pasta"],
  ["Sfoglie per lasagne", "lasagne sheets"],
  ["Spaghetti"],
  ["Pasta"],
  ["Ricotta"],
  ["Farina", "flour", "plain flour"],
  ["Zucchero", "sugar"],
  ["Zucchero semolato fine", "caster sugar"],
  ["Zucchero a velo", "icing sugar"],
  ["Cannella", "cinnamon"],
  ["Limoni", "limone", "lemon", "lemons"],
  ["Scorza di limone", "lemon zest"],
  ["Scorza di arancia", "orange zest"],
  ["Rum scuro", "dark rum"],
  ["Broccoli", "broccolo"],
  ["Funghi", "fungo", "mushrooms", "mushroom"],
  ["Peperoncino in fiocchi", "red pepper flakes"],
  ["Peperoncino rosso", "red chilli"],
  ["Vino bianco", "white wine"],
  ["Vino bianco secco", "dry white wine"],
  ["Panna", "heavy cream"],
  ["Prezzemolo", "parsley"],
  ["Pepe nero", "black pepper"],
  ["Noce moscata", "nutmeg"],
  ["Gamberoni", "king prawns"],
  ["Lattuga", "lettuce"],
  ["Basilico", "basil", "fresh basil", "basil leaves"],
  ["Sedano", "celery"],
  ["Manzo macinato", "minced beef"],
  ["Miele", "honey"],
  ["Olive verdi", "green olives"],
  ["Olive nere", "black olives"],
  ["Tonno", "tuna"],
  ["Vitello", "veal"],
  ["Finocchio", "fennel"],
  ["Maggiorana", "marjoram"],
  ["Alloro", "bay leaf"],
  ["Brodo di pollo", "chicken stock"],
  ["Origano", "oregano"],
  ["Piselli", "peas"],
  ["Spinaci", "spinach"],
  ["Acqua", "water"],
  ["Rosmarino", "rosemary"],
  ["Timo", "thyme"],
  ["Cavolo riccio", "kale"],
  ["Fagioli cannellini", "cannellini beans"],
];
export function normalizeIngredient(name: string) {
  return name
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ");
}
const names = new Map(
  groups.flatMap(([label, ...variants]) =>
    [label, ...variants].map(
      (name) => [normalizeIngredient(name), label] as const,
    ),
  ),
);
export function ingredientLabel(name: string) {
  return names.get(normalizeIngredient(name)) || name.trim();
}
export function ingredientMatches(meal: CatalogMeal, foods: Food[]) {
  return meal.ingredients.map((ingredient) => {
    const label = ingredientLabel(ingredient.name);
    const matches = foods.filter(
      (food) =>
        food.quantity > 0 &&
        normalizeIngredient(ingredientLabel(food.name)) ===
          normalizeIngredient(label),
    );
    return {
      ...ingredient,
      label,
      foods: matches,
      recognized: matches.length > 0,
    };
  });
}
export function recognizedFoods(meal: CatalogMeal, foods: Food[]) {
  const recognized = ingredientMatches(meal, foods).filter((i) => i.recognized);
  return [...new Set(recognized.map((i) => i.label))];
}
// Discovery can include a food family; this does not imply stock equivalence.
const searchFamilies: Record<string, string[]> = {
  pasta: [
    "pasta",
    "fettuccine",
    "fettucine",
    "linguine",
    "spaghetti",
    "farfalle",
    "lasagne",
    "rigatoni",
    "ditaloni",
    "pipe rigate",
    "mista",
    "maltagliati",
    "spaghettoni",
  ],
  formaggio: ["parmigiano", "mozzarella", "ricotta", "cheese"],
  pomodoro: ["pomodor", "tomato", "passata"],
  pomodori: ["pomodor", "tomato", "passata"],
  olio: ["olio", "oil"],
};
export function catalogSearch(meal: CatalogMeal, query: string) {
  const q = normalizeIngredient(query);
  const hay = normalizeIngredient(
    [
      meal.title,
      ...meal.ingredients.flatMap((i) => [i.name, ingredientLabel(i.name)]),
    ].join(" "),
  );
  return (
    !q ||
    hay.includes(q) ||
    hay.includes(normalizeIngredient(ingredientLabel(q))) ||
    (searchFamilies[q] || []).some((term) => hay.includes(term))
  );
}
