import { useTheme, type Theme } from "./theme";
import ShoppingList from "./ShoppingList";
import { addShoppingIngredients, type ShoppingItem } from "./shopping";
import { catalogMeals } from "./catalog";
import RecipeCatalog from "./RecipeCatalog";
import CompareMeals from "./CompareMeals";
import Onboarding from "./Onboarding";
import WeekPlan from "./WeekPlan";
import FridgySetup from "./FridgySetup";
import {
  askFridgy,
  FridgyError,
  loadFridgySettings,
  providers,
  saveFridgySettings,
  type ChatTurn,
  type FridgyAction,
  type FridgySettings,
} from "./fridgy";
import { asset, Button, Modal, FoodImage, ExpiryChip } from "./components";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  initialState,
  parseState,
  canonical,
  matching,
  recipes,
  suggestions,
  available,
  consume,
  needs,
  artFor,
  useSoon,
  compareOptions,
  cookWeekMeal,
  dayLabel,
  freeFoods,
  isoDay,
  upcomingMeals,
  weekId,
  daysUntil,
  expiryLabel,
  type State,
  type Food,
  type RecipeId,
  type Plan,
  type MealSlot,
} from "./domain";
const icons = {
  Oggi: "c2520.svg",
  Dispensa: "aa8ab.svg",
  Pasti: "3e441.svg",
  Fridgy: "76b0b.svg",
};
type Tab = keyof typeof icons;
type Message = {
  role: "bot" | "user";
  text: string;
  /** Written by the language model (otherwise by the rule-based demo). */
  ai?: boolean;
  /** Proposals the person may confirm. Nothing is applied automatically. */
  actions?: FridgyAction[];
};
export default function App() {
  const [theme, setTheme] = useTheme();
  const [aiFailure, setAiFailure] = useState<{
    text: string;
    base: Message[];
  } | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogInitialId, setCatalogInitialId] = useState<string | null>(null);
  const [catalogQuery, setCatalogQuery] = useState("");
  function openCatalog(id: string | null = null, query = "") {
    setCatalogInitialId(id);
    setCatalogQuery(query);
    setCatalogOpen(true);
  }
  const [compareOpen, setCompareOpen] = useState(false);
  const [fridgy, setFridgy] = useState<FridgySettings | null>(
    loadFridgySettings,
  );
  const [fridgySetup, setFridgySetup] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [doneActions, setDoneActions] = useState<string[]>([]);
  const [mealsView, setMealsView] = useState<"next" | "week">("next");
  const [weekPick, setWeekPick] = useState<{
    date: string;
    slot: MealSlot;
  } | null>(null);
  // First-run introduction for demos. Automated browsers skip it so that
  // end-to-end flows start from the home screen.
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return !navigator.webdriver && !localStorage.getItem("ciby-intro-seen");
    } catch {
      return false;
    }
  });
  function closeIntro() {
    setShowIntro(false);
    try {
      localStorage.setItem("ciby-intro-seen", "1");
    } catch {
      /* the intro simply shows again next time */
    }
  }
  const [state, setState] = useState<State>(() => {
    try {
      return parseState(localStorage.getItem("ciby-v1"));
    } catch {
      return structuredClone(initialState);
    }
  });
  const [pantryView, setPantryView] = useState<"stock" | "shopping">("stock");
  const [purchase, setPurchase] = useState<ShoppingItem | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [tab, setTab] = useState<Tab>("Oggi");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Tutto");
  const [edit, setEdit] = useState<Food | null | undefined>();
  const [detail, setDetail] = useState<RecipeId | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(false);
  const [notice, setNotice] = useState("");
  const [servings, setServings] = useState(1);
  const [when, setWhen] = useState("Domani a pranzo");
  const [previousPlan, setPreviousPlan] = useState<Plan | null>(null);
  const [moveDone, setMoveDone] = useState(false);
  const [consumeConfirm, setConsumeConfirm] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Ciao! Partiamo da quello che hai. Per quante persone cucini e quanto tempo vuoi dedicare?",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [chatServings, setChatServings] = useState(2);
  const [chatTime, setChatTime] = useState(20);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [showIdeas, setShowIdeas] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    try {
      localStorage.setItem("ciby-v1", JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus();
    window.scrollTo({ top: 0 });
  }, [tab]);
  useEffect(() => {
    if (messages.length > 1)
      log.current?.lastElementChild?.scrollIntoView({
        block: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  }, [messages]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  const inStock = state.foods.filter((f) => f.quantity > 0);
  const soon = useSoon(state.foods);
  const focus = soon[0] || inStock[0];
  const focusExpiry = focus ? expiryLabel(focus.expires) : null;
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 6 * 86400000);
  const cookedWeek = state.cooked.filter(
    (c) =>
      (daysUntil(c.date, weekAgo) ?? -1) >= 0 &&
      (daysUntil(c.date, today) ?? 1) <= 0,
  );
  const rescued = new Set(cookedWeek.flatMap((c) => c.priorityUsed));
  const wasteWeek = state.waste.filter(
    (w) =>
      (daysUntil(w.date, weekAgo) ?? -1) >= 0 &&
      (daysUntil(w.date, today) ?? 1) <= 0,
  );
  const thrown = wasteWeek.filter((w) => w.outcome === "buttato");
  const nextMeals = upcomingMeals(state.week);
  function openWeek() {
    setMealsView("week");
    go("Pasti");
  }
  function removeFood(food: Food, outcome: "finito" | "buttato") {
    setState((s) => ({
      ...s,
      foods: s.foods.filter((f) => f.id !== food.id),
      waste: [...s.waste, { date: isoDay(), name: food.name, outcome }].slice(
        -100,
      ),
    }));
    setEdit(undefined);
    setNotice(
      outcome === "buttato"
        ? `${food.name} rimosso e segnato come buttato.`
        : `${food.name} rimosso: finito.`,
    );
  }
  const dateLabel = today.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const plan = state.plan;
  const importedMeal = plan
    ? catalogMeals.find((m) => `catalog:${m.id}` === plan.recipe)
    : null;
  const planRecipe = importedMeal
    ? {
        title: importedMeal.title,
        time: importedMeal.minutes,
        effort: importedMeal.sourceName,
      }
    : plan
      ? recipes[plan.recipe as RecipeId]
      : null;
  const ideas = suggestions(state.foods, chatServings, chatTime, excluded);
  const go = (next: Tab) => {
    setTab(next);
    setNotice("");
  };
  function openShopping() {
    setCatalogOpen(false);
    setPantryView("shopping");
    go("Dispensa");
  }
  function startIdeas() {
    if (fridgy) {
      setShowIdeas(false);
      setDoneActions([]);
      go("Fridgy");
      void send("Cosa posso preparare con quello che ho?", []);
      return;
    }
    setChatServings(2);
    setChatTime(20);
    setExcluded([]);
    setMessages([
      {
        role: "bot",
        text: `Vedo le scorte che hai indicato: ${inStock.map((f) => `${f.name.toLowerCase()} (${f.quantity} ${f.unit})`).join(", ") || "nessun alimento"}. Vuoi partire da un pasto per due in 20 minuti? Puoi cambiare persone, tempo o ingredienti.`,
      },
    ]);
    setShowIdeas(true);
    go("Fridgy");
  }
  /** The original rule-based demo: used without a key and as a fallback. */
  function ruleReply(value: string) {
    const lower = value.toLowerCase();
    let people = chatServings,
      time = chatTime,
      ex = [...excluded];
    if (/solo per me|una persona|in uno|per uno/.test(lower)) people = 1;
    else if (/in due|per due|2 persone/.test(lower)) people = 2;
    const minutes = lower.match(/(\d+)\s*(?:minuti|min)/);
    if (minutes) time = Math.min(180, Math.max(1, Number(minutes[1])));
    for (const key of ["uova", "zucchine", "riso", "pomodori"]) {
      if (
        new RegExp(
          "(?:non ho|senza|mancano)\\s+(?:le |il |i |delle |del )?" +
            key +
            "|" +
            key +
            "\\s+(?:finite|finiti)",
        ).test(lower) &&
        !ex.includes(key)
      )
        ex.push(key);
    }
    setChatServings(people);
    setChatTime(time);
    setExcluded(ex);
    let response: string;
    let offer = false;
    if (/annulla|basta|stop/.test(lower))
      response =
        "Va bene. Non ho modificato pasti o scorte. Puoi ripartire quando vuoi.";
    else if (/mangio fuori|non ceno|sposta|rinvia/.test(lower))
      response =
        "Puoi rivedere il pasto dalla sezione Pasti. Prima della conferma vedrai cosa cambia: le scorte restano disponibili.";
    else if (/sicuro|scadut|muffa|dieta|calorie|allerg/.test(lower))
      response =
        "Non posso verificare la sicurezza di un alimento o definire una dieta. Posso aiutarti a scegliere una preparazione con altri ingredienti; per esigenze cliniche rivolgiti a un professionista.";
    else if (
      /uova|zucchin|riso|pomodor|cena|pranzo|pasto|ricett|minut|per due|in due|persona|solo per me|idea|sì|si|20 min/.test(
        lower,
      )
    ) {
      offer = true;
      response = suggestions(state.foods, people, time, ex).length
        ? `Per ${people === 1 ? "una persona" : "due persone"}, con ${time} minuti, queste sono le preparazioni del prototipo compatibili con le quantità indicate. Olio e sale sono da verificare. ${ex.length ? "Escludo " + ex.join(", ") + " da questa conversazione; non ho cambiato la dispensa." : ""}`
        : "Non trovo una preparazione compatibile nel piccolo ricettario del prototipo. Puoi aumentare il tempo, cambiare porzioni o aggiornare le scorte.";
    } else
      response =
        "Posso aiutarti con ingredienti, pasti e cambi di programma. Vuoi un’idea con quello che hai? Prova «per due, 20 minuti» oppure «senza uova».";
    return { response, offer };
  }
  async function send(value: string, base: Message[] = messages) {
    const text = value.trim();
    if (!text || thinking) return;
    setDraft("");
    setAiFailure(null);
    if (!fridgy) {
      const { response, offer } = ruleReply(text);
      setMessages([
        ...base,
        { role: "user", text },
        { role: "bot", text: response },
      ]);
      setShowIdeas(offer);
      return;
    }
    const history: Message[] = [...base, { role: "user", text }];
    setMessages(history);
    setShowIdeas(false);
    setThinking(true);
    try {
      const turns: ChatTurn[] = history.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));
      // Providers expect the conversation to open with the person.
      while (turns[0]?.role === "assistant") turns.shift();
      const reply = await askFridgy(fridgy, state, turns);
      setMessages([
        ...history,
        { role: "bot", ai: true, text: reply.text, actions: reply.actions },
      ]);
    } catch (error) {
      setAiFailure({ text, base });
      // Recover with the demo, and say so: the person is never left waiting.
      const { response, offer } = ruleReply(text);
      setMessages([
        ...history,
        {
          role: "bot",
          text: `${
            error instanceof FridgyError
              ? error.message
              : "Il modello AI non è disponibile in questo momento."
          } Intanto rispondo in modalità demo.\n\n${response}`,
        },
      ]);
      setShowIdeas(offer);
    } finally {
      setThinking(false);
    }
  }
  const actionKey = (index: number, n: number) => `${index}-${n}`;
  function actionLabel(action: FridgyAction) {
    if (action.type === "ricetta")
      return `Apri ${recipes[action.id].title} · ${action.servings === 1 ? "1 persona" : "2 persone"}`;
    if (action.type === "spesa") return `Aggiungi ${action.name} alla spesa`;
    return `Programma ${recipes[action.id].title} · ${dayLabel(action.date).toLowerCase()}, ${action.slot.toLowerCase()}`;
  }
  function runAction(action: FridgyAction, key: string) {
    if (action.type === "ricetta") {
      setChatServings(action.servings);
      setDetail(action.id);
      return;
    }
    if (action.type === "spesa") {
      setState((s) => ({
        ...s,
        shopping: addShoppingIngredients(
          s.shopping,
          [{ name: action.name, measure: "" }],
          { id: "fridgy", title: "Suggerito da Fridgy" },
        ),
      }));
      setNotice(`${action.name} aggiunto alla lista della spesa.`);
    } else {
      setState((s) => ({
        ...s,
        week: [
          ...s.week.filter(
            (m) => !(m.date === action.date && m.slot === action.slot),
          ),
          {
            id: weekId(),
            date: action.date,
            slot: action.slot,
            recipe: action.id,
            servings: action.servings,
          },
        ],
      }));
      setNotice(`${recipes[action.id].title} in programma. Scorte invariate.`);
    }
    setDoneActions((done) => [...done, key]);
  }
  function saveFood(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name")).trim();
    const quantity = Number(data.get("quantity"));
    if (!name || !Number.isFinite(quantity) || quantity <= 0) return;
    const id =
      edit?.id ||
      (globalThis.crypto?.randomUUID?.() ??
        `food-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const food: Food = {
      id,
      name,
      quantity,
      unit: data.get("unit") as Food["unit"],
      place: data.get("place") as Food["place"],
      priority: data.get("priority") === "on",
      art: artFor(name),
    };
    const expires = String(data.get("expires") || "");
    if (/^\d{4}-\d{2}-\d{2}$/.test(expires)) food.expires = expires;
    setState((s) => ({
      ...s,
      foods: edit
        ? s.foods.map((f) => (f.id === id ? food : f))
        : [...s.foods, food],
      shopping: purchase
        ? s.shopping.filter((item) => item.id !== purchase.id)
        : s.shopping,
    }));
    setEdit(undefined);
    setPurchase(null);
    setNotice(
      purchase
        ? "Acquisto aggiunto alla dispensa e rimosso dalla lista."
        : "Alimento salvato nella dispensa.",
    );
  }
  function mealCard() {
    return plan && planRecipe ? (
      <div className="meal-card">
        <FoodImage
          file={tab === "Pasti" ? "59bc0.svg" : "8d892.svg"}
          size={tab === "Pasti" ? 64 : 72}
        />
        <div>
          <small>
            {plan.when} ·{" "}
            {importedMeal
              ? `Dosi fonte: ${importedMeal.servingsLabel} persone`
              : plan.servings === 1
                ? "1 persona"
                : "2 persone"}
            {plan.consumed ? " · Cucinato" : ""}
          </small>
          <h3>{planRecipe.title}</h3>
          <small>
            {planRecipe.time === null
              ? "Tempo non disponibile"
              : `${planRecipe.time} min`}{" "}
            · {planRecipe.effort}
          </small>
          <p className="green small">
            {plan.consumed
              ? "Scorte aggiornate dopo la tua conferma"
              : importedMeal
                ? "Ingredienti e quantità da verificare"
                : available(state.foods, plan.recipe, plan.servings)
                  ? "Ingredienti ancora disponibili"
                  : "Ingredienti mancanti: scegli o adatta il pasto"}
          </p>
        </div>
      </div>
    ) : (
      <div className="card">
        <h3>Il prossimo pasto è da scegliere.</h3>
        <p>Parti dagli ingredienti nella tua dispensa.</p>
      </div>
    );
  }
  return (
    <div className="desktop-layout">
      <aside className="desktop-note">
        <a
          className="wordmark"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("Oggi");
          }}
        >
          ciby<span>.</span>
        </a>
        <h1>
          Il prossimo pasto
          <br />
          parte da qui.
        </h1>
        <p>
          Scegli cosa preparare con quello che hai, anche quando cambiano i
          programmi.
        </p>
        <div className="demo-tag">Prototipo HCI · In evoluzione</div>
        <section className="scenarios" aria-labelledby="scenarios-title">
          <h2 id="scenarios-title">Percorsi da provare</h2>
          {[
            {
              who: "Marta",
              need: "B01 · Un alimento trascurato",
              action: "Guarda cosa usare presto",
              run: () => go("Oggi"),
            },
            {
              who: "Gianfranco",
              need: "B02 · Una cena praticabile",
              action: "Confronta tempo e impegno",
              run: () => setCompareOpen(true),
            },
            {
              who: "Luca",
              need: "B03 · Cambia il programma",
              action: "Rinvia o adatta il pasto",
              run: () => go("Pasti"),
            },
            {
              who: "Luca",
              need: "B03/B04 · Più occasioni",
              action: "Pianifica i pasti della settimana",
              run: openWeek,
            },
            {
              who: "Luca",
              need: "B04 · Prima della spesa",
              action: "Controlla cosa hai già",
              run: openShopping,
            },
          ].map((sc) => (
            <button key={sc.need} className="scenario" onClick={sc.run}>
              <span className="scenario-avatar">{sc.who[0]}</span>
              <span>
                <strong>{sc.action}</strong>
                <small>
                  {sc.who} · {sc.need}
                </small>
              </span>
              <span aria-hidden="true">→</span>
            </button>
          ))}
        </section>
        <p className="small">
          Le scorte restano su questo browser.
          <br />
          Nessun account, nessun dato inviato.
        </p>
      </aside>
      <div className="app-shell">
        <a className="skip" href="#main">
          Vai al contenuto
        </a>
        <header className="app-header">
          {tab === "Fridgy" ? (
            <div className="assistant-title">
              <span className="assistant-avatar">
                <img src={asset("76b0b.svg")} alt="" />
              </span>
              <div>
                <strong>Fridgy</strong>
                <small>
                  Assistente di CIBY ·{" "}
                  {fridgy
                    ? aiFailure
                      ? "AI non disponibile"
                      : "AI attiva"
                    : "Demo guidata"}
                </small>
              </div>
            </div>
          ) : (
            <span className="wordmark">ciby</span>
          )}
          <button
            className="profile"
            aria-label="Opzioni del prototipo"
            onClick={() => setShowSettings(true)}
          >
            {tab === "Fridgy" ? <img src={asset("7029a.svg")} alt="" /> : "M"}
          </button>
        </header>
        {storageError && (
          <p className="storage-warning" role="alert">
            Il browser non consente il salvataggio. Le modifiche resteranno solo
            in questa sessione.
          </p>
        )}
        <main id="main" className={tab === "Fridgy" ? "chat-main" : ""}>
          {tab === "Oggi" && (
            <>
              <div className="intro">
                <small className="today-date">{dateLabel}</small>
                <h1 ref={heading} tabIndex={-1} className="home-title">
                  Cosa c’è di buono?
                </h1>
                <p>Una buona idea comincia da ciò che hai.</p>
              </div>
              {focus ? (
                <section className="ingredient-hero">
                  <div className="hero-row">
                    <div>
                      <small className="hero-kicker">
                        Hai {focus.quantity} {focus.unit} di{" "}
                        {focus.name.toLowerCase()}
                        {focusExpiry && focusExpiry.tone !== "ok"
                          ? ` · ${focusExpiry.text.toLowerCase()}`
                          : ""}
                      </small>
                      <h2>
                        Diamo un posto
                        <br />
                        alle tue scorte.
                      </h2>
                    </div>
                    <FoodImage
                      file={
                        canonical(focus.name) === "zucchine"
                          ? "e9eda.svg"
                          : artFor(focus.name)
                      }
                      size={124}
                    />
                  </div>
                  <Button onClick={startIdeas}>Trova un’idea</Button>
                </section>
              ) : null}
              {soon.length > 0 && (
                <section className="soon" aria-labelledby="soon-title">
                  <div className="section-heading">
                    <h2 id="soon-title">Da usare presto</h2>
                    <small>Tocca per cercare ricette</small>
                  </div>
                  <ul className="soon-strip">
                    {soon.map((f) => (
                      <li key={f.id}>
                        <button
                          className="soon-card"
                          onClick={() => openCatalog(null, f.name)}
                          aria-label={`Ricette con ${f.name}`}
                        >
                          <FoodImage file={artFor(f.name)} size={40} />
                          <strong>{f.name}</strong>
                          <small>
                            {f.quantity} {f.unit}
                          </small>
                          {f.expires ? (
                            <ExpiryChip expires={f.expires} />
                          ) : (
                            <span className="expiry-chip mine">
                              Scelto da te
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {!focus && (
                <section className="card">
                  <h2>Partiamo dalla dispensa.</h2>
                  <p>Aggiungi un alimento per trovare una prima idea.</p>
                  <Button
                    onClick={() => {
                      go("Dispensa");
                      setEdit(null);
                    }}
                  >
                    Aggiungi alimento
                  </Button>
                </section>
              )}
              <div className="section-heading">
                <h2>Il tuo prossimo pasto</h2>
                {plan && !importedMeal && (
                  <small>
                    {plan.servings}{" "}
                    {plan.servings === 1 ? "persona" : "persone"}
                  </small>
                )}
              </div>
              {mealCard()}
              {plan && !plan.consumed && (
                <>
                  <Button
                    secondary
                    onClick={() =>
                      importedMeal
                        ? openCatalog(importedMeal.id)
                        : setDetail(plan.recipe as RecipeId)
                    }
                  >
                    Vedi preparazione
                  </Button>
                  <div className="button-pair">
                    <Button secondary onClick={() => go("Pasti")}>
                      Cambia programma
                    </Button>
                    <Button secondary onClick={() => setCompareOpen(true)}>
                      Confronta opzioni
                    </Button>
                  </div>
                </>
              )}
              <Button secondary onClick={() => openCatalog()}>
                Esplora il ricettario
              </Button>
              <button className="shopping-shortcut" onClick={openWeek}>
                <FoodImage file="59bc0.svg" />
                <span>
                  <strong>I pasti della settimana</strong>
                  <small>
                    {nextMeals.length
                      ? `${nextMeals.length === 1 ? "1 pasto" : `${nextMeals.length} pasti`} in programma · prossimo: ${dayLabel(nextMeals[0].date).toLowerCase()}, ${nextMeals[0].slot.toLowerCase()}`
                      : "Dai un’occasione concreta alle scorte"}
                  </small>
                </span>
                <span aria-hidden="true">›</span>
              </button>
              <button className="shopping-shortcut" onClick={openShopping}>
                <FoodImage file="generic-food.svg" />
                <span>
                  <strong>La tua lista della spesa</strong>
                  <small>
                    {state.shopping.filter((item) => !item.checked).length} da
                    prendere ·{" "}
                    {state.shopping.filter((item) => item.checked).length}{" "}
                    acquistati
                  </small>
                </span>
                <span aria-hidden="true">›</span>
              </button>
              <section className="impact-card" aria-labelledby="impact-title">
                <div>
                  <h2 id="impact-title">Ultimi 7 giorni</h2>
                  <small>
                    Registrati solo quando confermi un pasto cucinato
                  </small>
                </div>
                <div className="impact-stats">
                  <div>
                    <strong>{cookedWeek.length}</strong>
                    <small>
                      {cookedWeek.length === 1
                        ? "pasto cucinato"
                        : "pasti cucinati"}
                    </small>
                  </div>
                  <div>
                    <strong>{rescued.size}</strong>
                    <small>
                      {rescued.size === 1
                        ? "alimento da usare presto, usato"
                        : "alimenti da usare presto, usati"}
                    </small>
                  </div>
                </div>
                {wasteWeek.length > 0 && (
                  <p className="impact-waste">
                    Alimenti rimossi: {wasteWeek.length - thrown.length} finiti
                    · {thrown.length} buttati
                    {thrown.length
                      ? ` (${thrown.map((w) => w.name.toLowerCase()).join(", ")})`
                      : ""}
                  </p>
                )}
                {cookedWeek.length > 0 && (
                  <p className="impact-last">
                    Ultimo: {cookedWeek[cookedWeek.length - 1].title}
                    {rescued.size ? ` · ${[...rescued].join(", ")}` : ""}
                  </p>
                )}
              </section>
              <p className="footnote">
                Dati di esempio modificabili · Fridgy usa un ricettario
                dimostrativo.
              </p>
            </>
          )}
          {tab === "Dispensa" && (
            <>
              <div className="intro">
                <h1 ref={heading} tabIndex={-1}>
                  Quello che hai.
                </h1>
                <p>Scorte aggiornate da te, quando serve.</p>
              </div>
              <div className="pantry-switch" aria-label="Scorte e acquisti">
                <button
                  aria-pressed={pantryView === "stock"}
                  onClick={() => setPantryView("stock")}
                >
                  Scorte
                </button>
                <button
                  aria-pressed={pantryView === "shopping"}
                  onClick={() => setPantryView("shopping")}
                >
                  Spesa{" "}
                  <span>
                    {state.shopping.filter((item) => !item.checked).length}
                  </span>
                </button>
              </div>
              {pantryView === "shopping" ? (
                <ShoppingList
                  foods={state.foods}
                  items={state.shopping}
                  onChange={(shopping) => setState((s) => ({ ...s, shopping }))}
                  onExplore={() => openCatalog()}
                  onStock={(item) => {
                    setPurchase(item);
                    setRemoveConfirm(false);
                    setEdit(null);
                  }}
                />
              ) : (
                <>
                  <label className="search">
                    <img src={asset("526d4.svg")} alt="" />
                    <input
                      aria-label="Cerca un alimento"
                      placeholder="Cerca un alimento"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <div className="filters" aria-label="Filtra per posizione">
                    {["Tutto", "Frigo", "Dispensa"].map((f) => (
                      <button
                        key={f}
                        aria-pressed={filter === f}
                        className={filter === f ? "selected" : ""}
                        onClick={() => setFilter(f)}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <div className="priority-label">
                    <strong>Da usare per primi</strong>
                    <small>Scelti da te</small>
                  </div>
                  <section className="add-food-panel">
                    <h2>La dispensa la scegli tu.</h2>
                    <p>
                      Scrivi qualsiasi alimento: non serve trovarlo in un
                      elenco.
                    </p>{" "}
                    <Button
                      onClick={() => {
                        setRemoveConfirm(false);
                        setEdit(null);
                      }}
                    >
                      Aggiungi alimento
                    </Button>
                  </section>
                  <div className="food-list">
                    {[...inStock]
                      .sort(
                        (a, b) =>
                          Number(b.priority) - Number(a.priority) ||
                          (daysUntil(a.expires) ?? 99) -
                            (daysUntil(b.expires) ?? 99),
                      )
                      .filter(
                        (f) =>
                          (filter === "Tutto" || f.place === filter) &&
                          f.name.toLowerCase().includes(query.toLowerCase()),
                      )
                      .map((f) => (
                        <button
                          className="food-row"
                          key={f.id}
                          onClick={() => {
                            setRemoveConfirm(false);
                            setEdit(f);
                          }}
                          aria-label={`Modifica ${f.name}`}
                        >
                          <FoodImage file={artFor(f.name)} />
                          <span className="food-meta">
                            <span className="food-top">
                              <strong>{f.name}</strong>
                              <small>
                                {f.quantity} {f.unit}
                              </small>
                            </span>
                            <span className="food-tags">
                              <small className={f.priority ? "green" : ""}>
                                {f.priority
                                  ? "Da usare per primi"
                                  : `In ${f.place.toLowerCase()}`}
                              </small>
                              <ExpiryChip expires={f.expires} />
                            </span>
                          </span>
                        </button>
                      ))}
                    {!inStock.some(
                      (f) =>
                        (filter === "Tutto" || f.place === filter) &&
                        f.name.toLowerCase().includes(query.toLowerCase()),
                    ) && (
                      <div className="empty">
                        <h3>Nessun alimento qui.</h3>
                        <p>Cambia filtro o aggiungi ciò che hai.</p>
                      </div>
                    )}
                  </div>
                  <p className="footnote">
                    Tocca un alimento per cambiare quantità, posizione o
                    priorità.
                  </p>
                </>
              )}
            </>
          )}
          {tab === "Fridgy" && (
            <>
              <h1 className="sr-only" ref={heading} tabIndex={-1}>
                Parla con Fridgy
              </h1>
              <div className={`fridgy-mode ${fridgy ? "on" : ""}`}>
                <p>
                  {fridgy
                    ? aiFailure
                      ? "Ultima risposta in modalità demo: il servizio AI non era disponibile. Puoi riprovare o verificare un altro modello."
                      : `AI attiva · ${providers[fridgy.provider].label}, ${fridgy.model}. Fridgy vede dispensa, pasti e spesa; le modifiche le confermi tu.`
                    : "Demo conversazionale, senza AI generativa. Le proposte si basano sulle scorte indicate."}
                </p>
                <button
                  className="text-button"
                  onClick={() => setFridgySetup(true)}
                >
                  {fridgy ? "Impostazioni AI" : "Attiva l’AI gratuita"}
                </button>
              </div>
              {aiFailure && (
                <Button
                  secondary
                  disabled={thinking}
                  onClick={() => send(aiFailure.text, aiFailure.base)}
                >
                  Riprova con AI
                </Button>
              )}
              <div
                className="messages"
                role="log"
                aria-label="Conversazione con Fridgy"
                aria-live="polite"
                ref={log}
              >
                {messages.map((m, i) => (
                  <div key={i} className={`message ${m.role}`}>
                    <span className="message-author">
                      {m.role === "user"
                        ? "Tu"
                        : m.ai
                          ? "Fridgy · AI"
                          : "Fridgy · Demo AI"}
                    </span>
                    <p>{m.text}</p>
                    {m.actions && m.actions.length > 0 && (
                      <div className="message-actions">
                        {m.actions.map((action, n) => {
                          const done = doneActions.includes(actionKey(i, n));
                          return (
                            <button
                              key={n}
                              disabled={done}
                              onClick={() => runAction(action, actionKey(i, n))}
                            >
                              {done ? "Fatto · " : ""}
                              {actionLabel(action)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
                {thinking && (
                  <div className="message bot typing">
                    <span className="message-author">Fridgy · AI</span>
                    <p>
                      <span className="sr-only">Fridgy sta scrivendo</span>
                      <i />
                      <i />
                      <i />
                    </p>
                  </div>
                )}
              </div>
              <div className="quick-replies" aria-label="Risposte rapide">
                {(fridgy
                  ? [
                      "Cosa cucino stasera?",
                      "Stasera mangio fuori",
                      "Cosa rischio di sprecare?",
                      "Organizza i prossimi giorni",
                    ]
                  : ["Per due, 20 minuti", "Solo per me", "Senza uova"]
                ).map((t) => (
                  <button key={t} onClick={() => send(t)}>
                    {t}
                  </button>
                ))}
              </div>
              {showIdeas && (
                <section className="ideas" aria-label="Proposte di Fridgy">
                  {ideas.map((id, i) => (
                    <button
                      className={`recipe-option ${i === 0 ? "highlight" : ""}`}
                      key={id}
                      onClick={() => setDetail(id)}
                    >
                      <strong>{recipes[id].title}</strong>
                      <small>
                        {recipes[id].time} min
                        {"riso" in needs(id, 1) ? "*" : ""} ·{" "}
                        {recipes[id].effort} · {chatServings}{" "}
                        {chatServings === 1 ? "persona" : "persone"}
                      </small>
                    </button>
                  ))}
                  {ideas.some((id) => "riso" in needs(id, 1)) && (
                    <small>
                      * Verifica il tempo sulla confezione del riso.
                    </small>
                  )}
                </section>
              )}
              <form
                className="composer"
                onSubmit={(e) => {
                  e.preventDefault();
                  send(draft);
                }}
              >
                <input
                  aria-label="Messaggio per Fridgy"
                  placeholder="Scrivi o cambia un ingrediente…"
                  value={draft}
                  maxLength={500}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button
                  aria-label="Invia messaggio"
                  disabled={!draft.trim() || thinking}
                >
                  <img src={asset("abf5f.svg")} alt="" />
                </button>
              </form>
            </>
          )}
          {tab === "Pasti" && (
            <>
              <div className="intro">
                <h1 ref={heading} tabIndex={-1}>
                  Cambiano i piani.
                </h1>
                <p>Sposta un pasto, senza rifare tutto.</p>
              </div>
              <div
                className="pantry-switch"
                aria-label="Prossimo pasto e settimana"
              >
                <button
                  aria-pressed={mealsView === "next"}
                  onClick={() => setMealsView("next")}
                >
                  Prossimo pasto
                </button>
                <button
                  aria-pressed={mealsView === "week"}
                  onClick={() => setMealsView("week")}
                >
                  Settimana <span>{nextMeals.length}</span>
                </button>
              </div>
              {mealsView === "week" ? (
                <WeekPlan
                  state={state}
                  onAdd={(date, slot) => setWeekPick({ date, slot })}
                  onMove={(id, date, slot) => {
                    setState((s) => ({
                      ...s,
                      week: s.week.map((m) =>
                        m.id === id ? { ...m, date, slot } : m,
                      ),
                    }));
                    setNotice(
                      `Pasto spostato a ${dayLabel(date).toLowerCase()}, ${slot.toLowerCase()}. Scorte invariate.`,
                    );
                  }}
                  onRemove={(id) => {
                    setState((s) => ({
                      ...s,
                      week: s.week.filter((m) => m.id !== id),
                    }));
                    setNotice("Pasto tolto dal piano. Scorte invariate.");
                  }}
                  onCook={(id) => {
                    setState((s) => cookWeekMeal(s, id));
                    setNotice("Pasto cucinato e scorte aggiornate.");
                  }}
                  onBuy={(items) => {
                    setState((s) => ({
                      ...s,
                      shopping: addShoppingIngredients(s.shopping, items, {
                        id: "week-plan",
                        title: "Pasti della settimana",
                      }),
                    }));
                    setNotice("Mancanti aggiunti alla lista della spesa.");
                  }}
                />
              ) : (
                <>
                  <section className="card">
                    <h2>Che cosa prepariamo?</h2>
                    <p>
                      Esplora le ricette a partire da quello che hai. Puoi
                      cambiare il pasto salvato in qualsiasi momento.
                    </p>
                    <Button onClick={() => openCatalog()}>
                      Esplora ricette e cambia pasto
                    </Button>
                    <Button secondary onClick={() => setCompareOpen(true)}>
                      Confronta adattare e rinviare
                    </Button>
                  </section>
                  {mealCard()}
                  {importedMeal && plan ? (
                    <>
                      <Button
                        secondary
                        onClick={() => openCatalog(importedMeal.id)}
                      >
                        Leggi ingredienti e preparazione
                      </Button>
                      <p className="catalog-notice">
                        Le dosi della fonte non vengono adattate al tuo piano.
                        Puoi salvarla e rinviarla; il consumo automatico è
                        disattivato per non sottrarre quantità inventate.
                      </p>
                      <label>
                        Quando prepararla
                        <select
                          value={when}
                          onChange={(e) => setWhen(e.target.value)}
                        >
                          <option>Domani a pranzo</option>
                          <option>Domani a cena</option>
                        </select>
                      </label>
                      <Button
                        onClick={() => {
                          setPreviousPlan(plan);
                          setState((s) => ({ ...s, plan: { ...plan, when } }));
                          setMoveDone(true);
                        }}
                      >
                        Sposta questo pasto
                      </Button>
                      {previousPlan && (
                        <Button
                          secondary
                          onClick={() => {
                            setState((s) => ({ ...s, plan: previousPlan }));
                            setPreviousPlan(null);
                          }}
                        >
                          Annulla ultimo spostamento
                        </Button>
                      )}
                    </>
                  ) : plan && !plan.consumed ? (
                    <>
                      <div className="event">
                        <img src={asset("8c6f1.svg")} alt="" />
                        Stasera mangio fuori
                      </div>
                      <div className="destination" id="postpone">
                        <label>
                          Nuova occasione
                          <select
                            value={when}
                            onChange={(e) => setWhen(e.target.value)}
                          >
                            <option>Domani a pranzo</option>
                            <option>Domani a cena</option>
                          </select>
                        </label>
                        <label>
                          Porzioni
                          <select
                            value={servings}
                            onChange={(e) =>
                              setServings(Number(e.target.value))
                            }
                          >
                            <option value={1}>Solo per me · 1 porzione</option>
                            <option value={2}>Per due · 2 porzioni</option>
                          </select>
                        </label>
                      </div>
                      <section className="card impact">
                        <h2>Prima di spostare</h2>
                        <p>
                          Il pasto passa a{" "}
                          {servings === 1 ? "una porzione" : "due porzioni"}. Le
                          quantità non usate restano da assegnare:
                        </p>
                        <ul>
                          {Object.entries(needs(plan.recipe, servings)).map(
                            ([id, n]) => {
                              const food = state.foods.find((f) =>
                                matching(f, id),
                              );
                              return (
                                <li key={id}>
                                  {food?.name || id}: {n}{" "}
                                  {food?.unit || "pezzi"} previsti,{" "}
                                  {Math.max(0, (food?.quantity || 0) - n)}{" "}
                                  restano.
                                </li>
                              );
                            },
                          )}
                        </ul>
                        <p>Nessun ingrediente viene segnato come consumato.</p>
                        <small
                          className={
                            available(state.foods, plan.recipe, servings)
                              ? "green"
                              : "warning"
                          }
                        >
                          {available(state.foods, plan.recipe, servings)
                            ? "Nessun nuovo acquisto necessario (olio e sale da verificare)."
                            : "Quantità insufficienti: aggiorna le scorte o scegli un’altra preparazione."}
                        </small>
                      </section>
                      <Button
                        disabled={
                          !available(state.foods, plan.recipe, servings)
                        }
                        onClick={() => {
                          setPreviousPlan(plan);
                          setState((s) => ({
                            ...s,
                            plan: { ...plan, when, servings },
                          }));
                          setMoveDone(true);
                        }}
                      >
                        Conferma lo spostamento
                      </Button>
                      {previousPlan && (
                        <Button
                          secondary
                          onClick={() => {
                            setState((s) => ({ ...s, plan: previousPlan }));
                            setPreviousPlan(null);
                            setNotice("Spostamento annullato.");
                          }}
                        >
                          Annulla ultimo spostamento
                        </Button>
                      )}
                      <Button
                        secondary
                        onClick={() => setConsumeConfirm(true)}
                        disabled={
                          !available(state.foods, plan.recipe, plan.servings)
                        }
                      >
                        Ho cucinato questo pasto
                      </Button>
                      <p className="footnote">
                        Le scorte cambiano solo quando confermi ciò che hai
                        usato.
                      </p>
                    </>
                  ) : (
                    <Button onClick={startIdeas}>Scegli un nuovo pasto</Button>
                  )}
                </>
              )}
            </>
          )}
        </main>
        <nav className="bottom-nav" aria-label="Navigazione principale">
          {(Object.keys(icons) as Tab[]).map((item) => (
            <button
              key={item}
              aria-current={tab === item ? "page" : undefined}
              onClick={() => go(item)}
            >
              <span>
                <img src={asset(icons[item])} alt="" />
                {item}
              </span>
            </button>
          ))}
        </nav>
      </div>
      <div role="status" className={`toast ${notice ? "visible" : ""}`}>
        {notice}
      </div>
      {catalogOpen && (
        <RecipeCatalog
          initialId={catalogInitialId}
          initialQuery={catalogQuery}
          foods={state.foods}
          favoriteIds={state.favoriteIds}
          onToggleFavorite={(id) =>
            setState((s) => ({
              ...s,
              favoriteIds: s.favoriteIds.includes(id)
                ? s.favoriteIds.filter((value) => value !== id)
                : [...s.favoriteIds, id],
            }))
          }
          onAddIngredients={(ingredients, meal) => {
            setState((s) => ({
              ...s,
              shopping: addShoppingIngredients(s.shopping, ingredients, meal),
            }));
          }}
          onOpenShopping={openShopping}
          onClose={() => setCatalogOpen(false)}
          onSelect={(meal) => {
            setState((s) => ({
              ...s,
              plan: {
                recipe: `catalog:${meal.id}`,
                when: "Stasera",
                servings: 1,
                consumed: false,
              },
            }));
            setPreviousPlan(null);
            setCatalogOpen(false);
            go("Pasti");
            setNotice("Nuovo pasto salvato. Scorte invariate.");
          }}
        />
      )}
      {compareOpen && (
        <CompareMeals
          foods={state.foods}
          plan={plan}
          initialServings={plan && !importedMeal ? plan.servings : 2}
          onClose={() => setCompareOpen(false)}
          onPostpone={() => {
            setCompareOpen(false);
            go("Pasti");
            setTimeout(
              () =>
                document
                  .getElementById("postpone")
                  ?.scrollIntoView({ block: "center" }),
              50,
            );
          }}
          onChoose={(id, servings) => {
            setPreviousPlan(plan);
            setState((s) => ({
              ...s,
              plan: {
                recipe: id,
                when: plan && !plan.consumed ? plan.when : "Stasera",
                servings,
                consumed: false,
              },
            }));
            setCompareOpen(false);
            go("Oggi");
            setNotice(`${recipes[id].title} salvata. Scorte invariate.`);
          }}
        />
      )}
      {weekPick && (
        <CompareMeals
          title={`${dayLabel(weekPick.date)}, ${weekPick.slot.toLowerCase()}`}
          intro="Le quantità tengono conto dei pasti già previsti. Puoi pianificare anche una preparazione a cui manca qualcosa: lo trovi fra gli acquisti."
          chooseLabel="Metti in programma"
          allowMissing
          foods={freeFoods(state)}
          plan={null}
          initialServings={2}
          onClose={() => setWeekPick(null)}
          onChoose={(id, servings) => {
            setState((s) => ({
              ...s,
              week: [
                ...s.week.filter(
                  (m) =>
                    !(m.date === weekPick.date && m.slot === weekPick.slot),
                ),
                { id: weekId(), ...weekPick, recipe: id, servings },
              ],
            }));
            setWeekPick(null);
            setNotice(`${recipes[id].title} in programma. Scorte invariate.`);
          }}
        />
      )}
      {fridgySetup && (
        <FridgySetup
          current={fridgy}
          onClose={() => setFridgySetup(false)}
          onSave={(settings) => {
            const saved = saveFridgySettings(settings);
            setFridgy(settings);
            setAiFailure(null);
            setFridgySetup(false);
            setShowIdeas(false);
            setDoneActions([]);
            setMessages([
              {
                role: "bot",
                ai: Boolean(settings),
                text: settings
                  ? "Ciao! Ora vedo dispensa, pasti e lista della spesa. Dimmi cosa ti serve: un’idea per stasera, un cambio di programma, cosa usare per primo."
                  : "Sono tornato alla modalità demo. Per quante persone cucini e quanto tempo vuoi dedicare?",
              },
            ]);
            setNotice(
              !settings
                ? "Chiave rimossa da questo browser."
                : saved
                  ? "Fridgy con AI attivo su questo browser."
                  : "AI attiva solo per questa sessione: il browser non consente il salvataggio.",
            );
          }}
        />
      )}
      {showIntro && <Onboarding onDone={closeIntro} />}
      {edit !== undefined && (
        <Modal
          title={
            purchase
              ? "Registra l’acquisto"
              : edit
                ? "Modifica alimento"
                : "Aggiungi alimento"
          }
          onClose={() => {
            setEdit(undefined);
            setPurchase(null);
          }}
        >
          {purchase && (
            <p>
              Indica la quantità comprata e dove conservarla. Verrà aggiunta
              come nuova scorta; le scorte già presenti restano disponibili.
            </p>
          )}
          <form className="food-form" onSubmit={saveFood}>
            <label>
              Nome
              <input
                name="name"
                list="food-suggestions"
                placeholder="Per esempio ceci, latte, pane…"
                defaultValue={edit?.name || purchase?.name}
                required
                maxLength={80}
                autoFocus
              />
            </label>
            <datalist id="food-suggestions">
              {[
                "Zucchine",
                "Uova",
                "Riso",
                "Pomodori",
                "Latte",
                "Pane",
                "Ceci",
                "Lenticchie",
                "Pasta",
                "Carote",
                "Yogurt",
                "Mele",
              ].map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <p className="footnote">
              I suggerimenti sono facoltativi. Puoi inserire anche un nome
              nuovo.
            </p>
            <div className="form-row">
              <label>
                Quantità
                <input
                  name="quantity"
                  type="number"
                  min="0.1"
                  max="100000"
                  step="0.1"
                  defaultValue={purchase ? "" : edit?.quantity || 1}
                  required
                />
              </label>
              <label>
                Unità
                <select name="unit" defaultValue={edit?.unit || "pezzi"}>
                  <option>pezzi</option>
                  <option>g</option>
                  <option>kg</option>
                  <option>ml</option>
                  <option>l</option>
                  <option>confezioni</option>
                </select>
              </label>
            </div>
            <label>
              Dove si trova
              <select name="place" defaultValue={edit?.place || "Frigo"}>
                <option>Frigo</option>
                <option>Dispensa</option>
              </select>
            </label>
            <label>
              Da consumare entro (facoltativo)
              <input
                name="expires"
                type="date"
                defaultValue={edit?.expires || ""}
              />
            </label>
            <label className="checkbox">
              <input
                name="priority"
                type="checkbox"
                defaultChecked={edit?.priority}
              />
              Da usare per primi
            </label>
            <Button type="submit">Salva alimento</Button>
            {edit && (
              <>
                {removeConfirm ? (
                  <>
                    <p>
                      Rimuovere {edit.name} dalla dispensa? Indica com’è andata:
                      serve solo al tuo riepilogo.
                    </p>
                    <div className="button-pair">
                      <Button
                        secondary
                        onClick={() => removeFood(edit, "finito")}
                      >
                        L’ho finito
                      </Button>
                      <Button
                        secondary
                        onClick={() => removeFood(edit, "buttato")}
                      >
                        L’ho buttato
                      </Button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setRemoveConfirm(true)}
                  >
                    Rimuovi alimento
                  </button>
                )}
              </>
            )}
          </form>
        </Modal>
      )}
      {detail && (
        <Modal title={recipes[detail].title} onClose={() => setDetail(null)}>
          <p>
            {recipes[detail].time} minuti stimati ·{" "}
            {tab === "Fridgy" ? chatServings : plan?.servings || 2} porzioni
          </p>
          <h3 className="detail-heading">Ingredienti</h3>
          <ul className="compare-ingredients">
            {compareOptions(
              state.foods,
              tab === "Fridgy" ? chatServings : plan?.servings || 2,
            )
              .find((o) => o.id === detail)!
              .items.map((i) => (
                <li key={i.key} className={i.ok ? "ok" : "missing"}>
                  <span aria-hidden="true">{i.ok ? "✓" : "!"}</span>
                  {i.name}: {i.need} {i.unit}
                  <small>
                    {i.ok
                      ? ` · ne hai ${i.have}`
                      : ` · ne mancano ${i.need - i.have}`}
                  </small>
                </li>
              ))}
          </ul>
          <h3 className="detail-heading">Preparazione</h3>
          <ol>
            {recipes[detail].steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="footnote">
            Ricetta dimostrativa. Verifica ingredienti, quantità e vincoli
            personali prima di cucinare.
          </p>
          <Button
            disabled={
              !available(
                state.foods,
                detail,
                tab === "Fridgy" ? chatServings : plan?.servings || 2,
              )
            }
            onClick={() => {
              setState((s) => ({
                ...s,
                plan: {
                  recipe: detail,
                  when: "Stasera",
                  servings:
                    tab === "Fridgy" ? chatServings : plan?.servings || 2,
                  consumed: false,
                },
              }));
              setDetail(null);
              setPreviousPlan(null);
              go("Oggi");
              setNotice("Pasto salvato per stasera. Scorte invariate.");
            }}
          >
            Salva per stasera
          </Button>
        </Modal>
      )}
      {moveDone && (
        <Modal title="Pasto spostato" onClose={() => setMoveDone(false)}>
          <p>
            {state.plan?.when}, per{" "}
            {importedMeal
              ? "porzioni da verificare"
              : state.plan?.servings === 1
                ? "una persona"
                : "due persone"}
            . Gli ingredienti restano disponibili.
          </p>
          <Button onClick={() => setMoveDone(false)}>Ho capito</Button>
        </Modal>
      )}
      {consumeConfirm && (
        <Modal
          title="Confermi gli ingredienti usati?"
          onClose={() => setConsumeConfirm(false)}
        >
          <p>
            Verranno sottratte dalle scorte le quantità previste per{" "}
            {plan?.servings} porzioni. Se hai usato quantità diverse, annulla e
            correggi prima le scorte.
          </p>
          <Button
            onClick={() => {
              setState(consume);
              setPreviousPlan(null);
              setConsumeConfirm(false);
              setNotice("Pasto cucinato e scorte aggiornate.");
            }}
          >
            Conferma consumo
          </Button>
        </Modal>
      )}
      {showSettings && (
        <Modal
          title="Il tuo prototipo"
          onClose={() => {
            setShowSettings(false);
            setResetConfirm(false);
          }}
        >
          <p>
            CIBY salva alimenti, pasto, preferiti e lista della spesa solo in
            questo browser. Senza una chiave Fridgy è una demo a regole; puoi
            collegare un modello AI gratuito dalla scheda Fridgy.
          </p>
          <fieldset className="theme-picker">
            <legend>Aspetto</legend>
            <p>Colori più scuri per usare CIBY di notte.</p>
            <div>
              {(
                [
                  ["system", "Automatico"],
                  ["light", "Chiaro"],
                  ["dark", "Notte"],
                ] as [Theme, string][]
              ).map(([value, label]) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="theme"
                    value={value}
                    checked={theme === value}
                    onChange={() => setTheme(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <small>
              Automatico segue il tema del dispositivo. La scelta resta salvata
              in questo browser.
            </small>
          </fieldset>
          <p>
            Per una nuova sessione di prova puoi ripristinare le scorte di
            esempio. Il ripristino elimina anche preferiti e lista della spesa.
          </p>
          <Button
            secondary
            onClick={() => {
              setShowSettings(false);
              setShowIntro(true);
            }}
          >
            Rivedi l’introduzione
          </Button>
          {resetConfirm ? (
            <Button
              onClick={() => {
                setState(structuredClone(initialState));
                setMessages([
                  {
                    role: "bot",
                    text: "Ripartiamo. Per quante persone cucini e quanto tempo hai?",
                  },
                ]);
                setShowIdeas(false);
                setExcluded([]);
                setDoneActions([]);
                setPreviousPlan(null);
                setShowSettings(false);
                setResetConfirm(false);
                go("Oggi");
                setNotice("Dati di esempio ripristinati.");
              }}
            >
              Conferma ripristino dei dati
            </Button>
          ) : (
            <Button secondary onClick={() => setResetConfirm(true)}>
              Ripristina esempio
            </Button>
          )}
        </Modal>
      )}
    </div>
  );
}
