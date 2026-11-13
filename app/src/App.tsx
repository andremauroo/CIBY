import { catalogMeals } from "./catalog";
import RecipeCatalog from "./RecipeCatalog";
import { asset, Button, Modal, FoodImage } from "./components";
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
  type State,
  type Food,
  type RecipeId,
  type Plan,
} from "./domain";
const icons = {
  Oggi: "c2520.svg",
  Dispensa: "aa8ab.svg",
  Pasti: "3e441.svg",
  Fridgy: "76b0b.svg",
};
type Tab = keyof typeof icons;
type Message = { role: "bot" | "user"; text: string };
export default function App() {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogInitialId, setCatalogInitialId] = useState<string | null>(null);
  function openCatalog(id: string | null = null) {
    setCatalogInitialId(id);
    setCatalogOpen(true);
  }
  const [state, setState] = useState<State>(() => {
    try {
      return parseState(localStorage.getItem("ciby-v1"));
    } catch {
      return structuredClone(initialState);
    }
  });
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
  const focus = inStock.find((f) => f.priority) || inStock[0];
  const plan = state.plan;
  const importedMeal = plan
    ? catalogMeals.find((m) => `mealdb:${m.id}` === plan.recipe)
    : null;
  const planRecipe = importedMeal
    ? { title: importedMeal.title, time: null, effort: "TheMealDB" }
    : plan
      ? recipes[plan.recipe as RecipeId]
      : null;
  const ideas = suggestions(state.foods, chatServings, chatTime, excluded);
  const go = (next: Tab) => {
    setTab(next);
    setNotice("");
  };
  function startIdeas() {
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
  function send(value: string) {
    if (!value.trim()) return;
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
    setMessages((m) => [
      ...m,
      { role: "user", text: value.trim() },
      { role: "bot", text: response },
    ]);
    setShowIdeas(offer);
    setDraft("");
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
    setState((s) => ({
      ...s,
      foods: edit
        ? s.foods.map((f) => (f.id === id ? food : f))
        : [...s.foods, food],
    }));
    setEdit(undefined);
    setNotice("Alimento salvato nella dispensa.");
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
              ? "Porzioni da verificare"
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
        <div className="demo-tag">Prototipo HCI · Prima iterazione</div>
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
                <small>Assistente di CIBY · Demo guidata</small>
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
                <h1 ref={heading} tabIndex={-1} className="home-title">
                  Cosa c’è di buono?
                </h1>
                <p>Una buona idea comincia da ciò che hai.</p>
              </div>
              {focus ? (
                <section className="ingredient-hero">
                  <div className="hero-row">
                    <div>
                      <small>
                        Hai {focus.quantity} {focus.unit} di{" "}
                        {focus.name.toLowerCase()}
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
              ) : (
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
                {plan && (
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
                  <Button secondary onClick={() => go("Pasti")}>
                    Cambia programma
                  </Button>
                </>
              )}
              <Button secondary onClick={() => openCatalog()}>
                Esplora il ricettario
              </Button>
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
                  Scrivi qualsiasi alimento: non serve trovarlo in un elenco.
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
                  .sort((a, b) => Number(b.priority) - Number(a.priority))
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
                        <small className={f.priority ? "green" : ""}>
                          {f.priority
                            ? "Da usare per primi"
                            : `In ${f.place.toLowerCase()}`}
                        </small>
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
                Tocca un alimento per cambiare quantità, posizione o priorità.
              </p>
            </>
          )}
          {tab === "Fridgy" && (
            <>
              <h1 className="sr-only" ref={heading} tabIndex={-1}>
                Parla con Fridgy
              </h1>
              <p className="footnote">
                Demo conversazionale, senza AI generativa. Le proposte si basano
                sulle scorte indicate.
              </p>
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
                      {m.role === "user" ? "Tu" : "Fridgy · Demo AI"}
                    </span>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>
              <div className="quick-replies" aria-label="Risposte rapide">
                {["Per due, 20 minuti", "Solo per me", "Senza uova"].map(
                  (t) => (
                    <button key={t} onClick={() => send(t)}>
                      {t}
                    </button>
                  ),
                )}
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
                        {recipes[id].time} min{id !== "frittata" ? "*" : ""} ·{" "}
                        {recipes[id].effort} · {chatServings}{" "}
                        {chatServings === 1 ? "persona" : "persone"}
                      </small>
                    </button>
                  ))}
                  {ideas.some((id) => id !== "frittata") && (
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
                <button aria-label="Invia messaggio" disabled={!draft.trim()}>
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
              <section className="card">
                <h2>Che cosa prepariamo?</h2>
                <p>
                  Esplora le ricette a partire da quello che hai. Puoi cambiare
                  il pasto salvato in qualsiasi momento.
                </p>
                <Button onClick={() => openCatalog()}>
                  Esplora ricette e cambia pasto
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
                    Questa ricetta non ha tempi e porzioni verificati. Puoi
                    salvarla e rinviarla; il consumo automatico è disattivato
                    per non sottrarre quantità inventate.
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
                  <div className="destination">
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
                        onChange={(e) => setServings(Number(e.target.value))}
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
                          const food = state.foods.find((f) => matching(f, id));
                          return (
                            <li key={id}>
                              {food?.name || id}: {n} {food?.unit || "pezzi"}{" "}
                              previsti, {Math.max(0, (food?.quantity || 0) - n)}{" "}
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
                    disabled={!available(state.foods, plan.recipe, servings)}
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
                    Le scorte cambiano solo quando confermi ciò che hai usato.
                  </p>
                </>
              ) : (
                <Button onClick={startIdeas}>Scegli un nuovo pasto</Button>
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
          foods={state.foods}
          onClose={() => setCatalogOpen(false)}
          onSelect={(meal) => {
            setState((s) => ({
              ...s,
              plan: {
                recipe: `mealdb:${meal.id}`,
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
      {edit !== undefined && (
        <Modal
          title={edit ? "Modifica alimento" : "Aggiungi alimento"}
          onClose={() => setEdit(undefined)}
        >
          <form className="food-form" onSubmit={saveFood}>
            <label>
              Nome
              <input
                name="name"
                list="food-suggestions"
                placeholder="Per esempio ceci, latte, pane…"
                defaultValue={edit?.name}
                required
                maxLength={50}
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
                  defaultValue={edit?.quantity || 1}
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
                    <p>Rimuovere {edit.name} dalla dispensa?</p>
                    <Button
                      secondary
                      onClick={() => {
                        setState((s) => ({
                          ...s,
                          foods: s.foods.filter((f) => f.id !== edit.id),
                        }));
                        setEdit(undefined);
                        setNotice("Alimento rimosso.");
                      }}
                    >
                      Conferma rimozione
                    </Button>
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
            CIBY salva alimenti e pasto solo in questo browser. Fridgy è una
            demo a regole con tre preparazioni: non è un modello AI.
          </p>
          <p>
            Per una nuova sessione di prova puoi ripristinare le scorte di
            esempio.
          </p>
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
