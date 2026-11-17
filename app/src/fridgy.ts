import {
  compareOptions,
  dayLabel,
  daysUntil,
  isoDay,
  recipes,
  upcomingMeals,
  weekBalance,
  type MealSlot,
  type RecipeId,
  type State,
} from "./domain";
import { catalogMeals } from "./catalog";

/**
 * Fridgy with a real language model, without a CIBY backend.
 *
 * The browser calls a free, OpenAI-compatible endpoint directly, with a key
 * that each person creates for themselves and that is stored only in their
 * browser. No key is ever part of the repository or of the build, so nobody in
 * the team shares a key. Without a key Fridgy keeps working as the rule-based
 * demo.
 */
export type ProviderId = "gemini" | "groq" | "openrouter";
export const providers: Record<
  ProviderId,
  {
    label: string;
    base: string;
    keyUrl: string;
    keyHint: string;
    note: string;
    /** Ordered preferences among the models the key can actually use. */
    prefer: RegExp[];
    usable: (id: string) => boolean;
  }
> = {
  gemini: {
    label: "Google Gemini",
    base: "https://generativelanguage.googleapis.com/v1beta/openai",
    keyUrl: "https://aistudio.google.com/apikey",
    keyHint: "Inizia di solito con AIza…",
    note: "Account Google, senza carta di credito. Nel piano gratuito Google può usare le richieste per migliorare i suoi prodotti.",
    prefer: [/flash-lite/, /flash/, /gemini/],
    usable: (id) =>
      /gemini/.test(id) &&
      !/embedding|image|tts|audio|live|veo|imagen|robotics|computer-use/.test(
        id,
      ),
  },
  groq: {
    label: "Groq",
    base: "https://api.groq.com/openai/v1",
    keyUrl: "https://console.groq.com/keys",
    keyHint: "Inizia con gsk_…",
    note: "Registrazione gratuita, senza carta di credito. Modelli aperti molto veloci.",
    prefer: [
      /llama-3\.3-70b/,
      /gpt-oss-120b/,
      /70b|120b/,
      /llama|qwen|gpt-oss/,
    ],
    usable: (id) => !/whisper|guard|tts|playai|orpheus|compound/.test(id),
  },
  openrouter: {
    label: "OpenRouter (modelli :free)",
    base: "https://openrouter.ai/api/v1",
    keyUrl: "https://openrouter.ai/settings/keys",
    keyHint: "Inizia con sk-or-…",
    note: "Solo i modelli gratuiti, con un limite giornaliero di richieste più basso.",
    prefer: [/llama-3\.3-70b/, /gemini/, /llama|qwen|deepseek|mistral/],
    usable: (id) => id.endsWith(":free"),
  },
};

export type FridgySettings = {
  provider: ProviderId;
  key: string;
  model: string;
};
const storageKey = "ciby-fridgy";

export function loadFridgySettings(): FridgySettings | null {
  try {
    const s = JSON.parse(localStorage.getItem(storageKey) || "null");
    return s &&
      Object.hasOwn(providers, s.provider) &&
      typeof s.key === "string" &&
      s.key.trim() &&
      typeof s.model === "string" &&
      s.model
      ? { provider: s.provider, key: s.key, model: s.model }
      : null;
  } catch {
    return null;
  }
}
export function saveFridgySettings(settings: FridgySettings | null) {
  try {
    if (settings) localStorage.setItem(storageKey, JSON.stringify(settings));
    else localStorage.removeItem(storageKey);
    return true;
  } catch {
    return false;
  }
}

export class FridgyError extends Error {
  constructor(
    public kind:
      | "key"
      | "limit"
      | "network"
      | "empty"
      | "provider"
      | "temporary"
      | "model",
    message: string,
  ) {
    super(message);
  }
}
async function request(
  settings: Pick<FridgySettings, "provider" | "key">,
  path: string,
  body?: unknown,
) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(providers[settings.provider].base + path, {
        method: body ? "POST" : "GET",
        headers: {
          Authorization: `Bearer ${settings.key.trim()}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      if ([502, 503, 504].includes(response.status)) {
        if (attempt === 0) {
          // One bounded retry, on the same provider/model. No hidden model switch.
          const retryAfter = response.headers.get("Retry-After");
          const seconds = Number(retryAfter);
          const delay =
            retryAfter && Number.isFinite(seconds) ? seconds * 1000 : 1200;
          if (delay <= 5000) {
            clearTimeout(timer);
            await new Promise((resolve) =>
              setTimeout(resolve, Math.max(500, delay)),
            );
            continue;
          }
        }
        throw new FridgyError(
          "temporary",
          "Il modello è temporaneamente sovraccarico o non disponibile (" +
            response.status +
            "). Riprova oppure prova un altro modello nelle impostazioni AI. Questo errore non indica una chiave errata.",
        );
      }
      const data = await response.json().catch(() => null);
      if (
        response.status === 401 ||
        response.status === 403 ||
        (response.status === 400 &&
          /API_KEY_INVALID|API key not valid/i.test(
            JSON.stringify(data?.error || {}),
          ))
      )
        throw new FridgyError(
          "key",
          "La chiave non è stata accettata. Controllala nelle impostazioni di Fridgy.",
        );
      if (response.status === 429)
        throw new FridgyError(
          "limit",
          "Hai raggiunto il limite gratuito o la quota disponibile per questo modello. Verifica le quote del progetto oppure riprova più tardi.",
        );
      if (response.status === 404)
        throw new FridgyError(
          "model",
          "Questo modello non è disponibile per la chiave. Aggiorna l’elenco nelle impostazioni AI e provane un altro.",
        );
      if (!response.ok)
        throw new FridgyError(
          "provider",
          `Il servizio ha rifiutato la richiesta (${response.status}). Verifica servizio e modello nelle impostazioni AI.`,
        );
      if (!data)
        throw new FridgyError(
          "empty",
          "Il servizio non ha restituito una risposta leggibile.",
        );
      return data;
    } catch (error) {
      if (error instanceof FridgyError) throw error;
      throw new FridgyError(
        "network",
        controller.signal.aborted
          ? "Il servizio non ha risposto in tempo. Riprova tra poco."
          : "Non riesco a raggiungere il servizio. Controlla la connessione.",
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Models this key can use for chat, best candidate first. */
export async function listModels(
  settings: Pick<FridgySettings, "provider" | "key">,
): Promise<string[]> {
  const provider = providers[settings.provider];
  const data = await request(settings, "/models");
  const ids: string[] = (Array.isArray(data?.data) ? data.data : [])
    .map((m: { id?: unknown }) =>
      typeof m?.id === "string" ? m.id.replace(/^models\//, "") : "",
    )
    .filter((id: string) => id && provider.usable(id));
  const rank = (id: string) => {
    const index = provider.prefer.findIndex((p) => p.test(id));
    return index === -1 ? provider.prefer.length : index;
  };
  // Stable models before previews, then the provider's own preference.
  return [...new Set(ids)].sort(
    (a, b) =>
      Number(/preview|exp/.test(a)) - Number(/preview|exp/.test(b)) ||
      rank(a) - rank(b) ||
      b.localeCompare(a),
  );
}

/** Model listing validates authentication, not generation or quota. */
export async function testFridgyModel(settings: FridgySettings) {
  const data = await request(settings, "/chat/completions", {
    model: settings.model,
    messages: [{ role: "user", content: "Rispondi soltanto OK." }],
  });
  if (!data?.choices?.[0]?.message?.content?.trim())
    throw new FridgyError(
      "empty",
      "Il modello non ha risposto alla prova. Scegli un altro modello o riprova.",
    );
}

export type ChatTurn = { role: "user" | "assistant"; content: string };
export async function askFridgy(
  settings: FridgySettings,
  state: State,
  history: ChatTurn[],
) {
  const data = await request(settings, "/chat/completions", {
    model: settings.model,
    temperature: 0.4,
    messages: [
      { role: "system", content: systemPrompt(state) },
      ...history.slice(-12),
    ],
  });
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim())
    throw new FridgyError("empty", "Il modello non ha dato una risposta.");
  return parseReply(content);
}

export type FridgyAction =
  | { type: "ricetta"; id: RecipeId; servings: number }
  | { type: "spesa"; name: string }
  | {
      type: "settimana";
      id: RecipeId;
      date: string;
      slot: MealSlot;
      servings: number;
    };

/**
 * The model never changes the app: it can only attach proposals, written as
 * [[...]] tags, that become buttons the person may tap. Unknown or malformed
 * tags are dropped.
 */
export function parseReply(raw: string, today = new Date()) {
  const actions: FridgyAction[] = [];
  const seen = new Set<string>();
  const text = raw
    .replace(/\[\[([^\]]{1,120})\]\]/g, (_, body: string) => {
      const [type, ...rest] = body.split(":").map((part) => part.trim());
      const servings = (value?: string) => (Number(value) === 1 ? 1 : 2);
      let action: FridgyAction | null = null;
      if (type === "ricetta" && Object.hasOwn(recipes, rest[0]))
        action = {
          type,
          id: rest[0] as RecipeId,
          servings: servings(rest[1]),
        };
      else if (type === "spesa" && rest.join(":").trim())
        action = { type, name: rest.join(":").trim().slice(0, 80) };
      else if (
        type === "settimana" &&
        Object.hasOwn(recipes, rest[0]) &&
        /^[0-6]$/.test(rest[1] || "") &&
        /^(pranzo|cena)$/i.test(rest[2] || "")
      )
        action = {
          type,
          id: rest[0] as RecipeId,
          date: isoDay(Number(rest[1]), today),
          slot: /^pranzo$/i.test(rest[2]) ? "Pranzo" : "Cena",
          servings: servings(rest[3]),
        };
      const key = JSON.stringify(action);
      if (action && !seen.has(key) && actions.length < 6) {
        seen.add(key);
        actions.push(action);
      }
      return "";
    })
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { text: text || "Ecco cosa ti propongo.", actions };
}

/** Everything Fridgy knows about the person, rebuilt at every message. */
export function userContext(state: State, today = new Date()) {
  const foods = state.foods.filter((f) => f.quantity > 0);
  const lines: string[] = [];
  lines.push(
    `Oggi è ${today.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}.`,
  );
  lines.push(
    "DISPENSA:",
    ...(foods.length
      ? foods.map((f) => {
          const days = daysUntil(f.expires, today);
          return `- ${f.name}: ${f.quantity} ${f.unit}, in ${f.place.toLowerCase()}${
            f.priority ? ", segnato «da usare per primi»" : ""
          }${
            days === null
              ? ""
              : days < 0
                ? `, data indicata passata da ${-days} giorni`
                : days === 0
                  ? ", da consumare entro oggi"
                  : `, da consumare entro ${days} giorni`
          }`;
        })
      : ["- vuota"]),
  );
  const plan = state.plan;
  const imported = plan
    ? catalogMeals.find((m) => `catalog:${m.id}` === plan.recipe)
    : null;
  lines.push(
    "PROSSIMO PASTO: " +
      (plan
        ? `${imported?.title || recipes[plan.recipe as RecipeId]?.title || "da verificare"}, ${plan.when.toLowerCase()}, ${
            imported ? "dosi della fonte" : `${plan.servings} porzioni`
          }${plan.consumed ? " (già cucinato)" : ""}`
        : "non scelto"),
  );
  const week = upcomingMeals(state.week, today);
  lines.push(
    "PASTI IN PROGRAMMA NEI PROSSIMI 7 GIORNI:",
    ...(week.length
      ? week.map(
          (m) =>
            `- ${dayLabel(m.date, today)} (giorno ${daysUntil(m.date, today)}), ${m.slot.toLowerCase()}: ${recipes[m.recipe].title}, ${m.servings} porzioni`,
        )
      : ["- nessuno"]),
  );
  const balance = weekBalance(state, today);
  const missing = balance.filter((b) => b.missing > 0);
  const free = balance.filter((b) => b.free > 0);
  if (missing.length)
    lines.push(
      "MANCA PER I PASTI PREVISTI: " +
        missing.map((b) => `${b.label} ${b.missing} ${b.unit}`).join(", "),
    );
  if (free.length)
    lines.push(
      "SCORTE SENZA UN PASTO ASSEGNATO: " +
        free.map((b) => `${b.label} ${b.free} ${b.unit}`).join(", "),
    );
  const toBuy = state.shopping.filter((i) => !i.checked);
  lines.push(
    "LISTA DELLA SPESA: " +
      (toBuy.length ? toBuy.map((i) => i.name).join(", ") : "vuota"),
  );
  const favorites = catalogMeals.filter((m) =>
    state.favoriteIds.includes(m.id),
  );
  if (favorites.length)
    lines.push(
      "RICETTE PREFERITE: " + favorites.map((m) => m.title).join(", "),
    );
  const recent = state.cooked.slice(-3).map((c) => c.title);
  if (recent.length) lines.push("CUCINATI DI RECENTE: " + recent.join(", "));
  const thrown = state.waste
    .filter((w) => w.outcome === "buttato")
    .slice(-3)
    .map((w) => w.name);
  if (thrown.length)
    lines.push("BUTTATI DI RECENTE (dichiarati): " + thrown.join(", "));
  const two = compareOptions(state.foods, 2);
  const one = compareOptions(state.foods, 1);
  lines.push(
    "RICETTARIO CIBY (le uniche con quantità calcolate; id fra parentesi):",
    ...two.map((o, index) => {
      const lack = o.items
        .filter((i) => !i.ok)
        .map((i) => `${i.name} ${i.need - i.have} ${i.unit}`);
      return `- ${o.title} (${o.id}): ${o.time} min, ${o.effort.toLowerCase()}, ${
        o.veg ? "senza carne e pesce" : "con carne o pesce"
      }. Per 2: ${o.items.map((i) => `${i.name} ${i.need} ${i.unit}`).join(", ")}. ${
        o.ok
          ? "Fattibile ora per 2."
          : one[index].ok
            ? `Fattibile ora solo per 1; per 2 manca ${lack.join(", ")}.`
            : `Per 2 manca ${lack.join(", ")}.`
      }`;
    }),
  );
  return lines.join("\n");
}

export function systemPrompt(state: State, today = new Date()) {
  return `Sei Fridgy, l'assistente di CIBY, un'app che aiuta giovani adulti a scegliere cosa preparare con quello che hanno già in casa, anche quando cambiano i programmi, per ridurre lo spreco domestico.

COME RISPONDI
- In italiano, con tono amichevole e concreto. Al massimo 90 parole, senza elenchi lunghi, senza Markdown e senza tabelle.
- Parti sempre dai dati qui sotto: non inventare alimenti, quantità o pasti che non compaiono. Se un dato manca, chiedilo.
- Dai priorità agli alimenti segnati «da usare per primi» o vicini alla data indicata, e alle scorte senza un pasto assegnato.
- Spiega in breve perché una proposta è adatta (ingredienti presenti, tempo, impegno). Se la persona ha poco tempo o poca voglia, proponi la cosa più semplice.
- Se cambia un programma (mangia fuori, manca un ingrediente), confronta due strade: adattare con un'altra preparazione oppure rinviare, dicendo cosa resta da usare e cosa servirebbe comprare.
- Puoi suggerire anche idee libere fuori dal ricettario, ma dichiara che lì le quantità sono indicative e vanno verificate.
- Olio, sale e condimenti non sono tracciati: ricordalo solo se serve.
- Non valuti la sicurezza di un alimento (scaduto, muffa, odore), allergie, diete o condizioni di salute: dillo con chiarezza e invita a verificare l'etichetta o a rivolgersi a un professionista. Una data passata nei dati è solo un'indicazione della persona.
- Se la richiesta non riguarda cibo, pasti, spesa o dispensa, riporta gentilmente la conversazione su questi temi.

PROPOSTE CHE LA PERSONA PUÒ CONFERMARE
Tu non modifichi mai dispensa, pasti o spesa. Puoi però aggiungere in fondo alla risposta, ciascuna su una riga, fino a tre proposte che l'app trasforma in pulsanti:
[[ricetta:ID:PORZIONI]] per aprire una preparazione del ricettario CIBY (PORZIONI 1 o 2)
[[settimana:ID:GIORNO:Pranzo|Cena:PORZIONI]] per metterla in programma (GIORNO da 0 = oggi a 6)
[[spesa:Nome alimento]] per aggiungere un alimento alla lista della spesa
Usa solo gli ID del ricettario. Non scrivere mai questi codici dentro le frasi e non nominarli: scrivi il testo come se i pulsanti comparissero da soli. Non dire di aver salvato o modificato qualcosa.

DATI DELLA PERSONA (aggiornati a questo messaggio)
${userContext(state, today)}`;
}
