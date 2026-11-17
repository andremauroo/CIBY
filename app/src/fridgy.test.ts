import { afterEach, describe, expect, it, vi } from "vitest";
import { initialState, isoDay } from "./domain";
import {
  askFridgy,
  testFridgyModel,
  FridgyError,
  listModels,
  parseReply,
  systemPrompt,
  userContext,
} from "./fridgy";

const today = new Date(2026, 10, 17);
afterEach(() => vi.unstubAllGlobals());
const respond = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe("Contesto della persona per Fridgy", () => {
  it("descrive dispensa, priorità, pasti, spesa e fattibilità delle ricette", () => {
    const context = userContext(
      {
        ...initialState,
        shopping: [
          { id: "a", name: "Ceci", note: "", checked: false, sources: [] },
          { id: "b", name: "Pane", note: "", checked: true, sources: [] },
        ],
        week: [
          {
            id: "w",
            date: isoDay(1, today),
            slot: "Cena",
            recipe: "bowlPollo",
            servings: 2,
          },
        ],
      },
      today,
    );
    expect(context).toContain("Zucchine: 2 pezzi, in frigo");
    expect(context).toContain("da usare per primi");
    expect(context).toContain("PROSSIMO PASTO: Frittata di zucchine, stasera");
    expect(context).toContain("Domani (giorno 1), cena: Bowl di riso e pollo");
    expect(context).toMatch(/MANCA PER I PASTI PREVISTI: .*Pollo 300 g/);
    expect(context).toContain("LISTA DELLA SPESA: Ceci");
    expect(context).not.toContain("Pane,");
    expect(context).toContain("(caprese)");
    expect(context).toMatch(/Caprese.*Fattibile ora solo per 1/);
    expect(systemPrompt(initialState, today)).toContain(
      "[[ricetta:ID:PORZIONI]]",
    );
  });
  it("non contiene chiavi né identificativi della persona", () => {
    expect(systemPrompt(initialState, today)).not.toMatch(/gsk_|AIza|sk-or-/);
  });
});

describe("Risposte del modello", () => {
  it("trasforma solo le proposte valide in azioni e ripulisce il testo", () => {
    const reply = parseReply(
      "Ti propongo la **caprese**: usa la mozzarella.\n[[ricetta:caprese:1]]\n[[ricetta:inventata:2]]\n[[settimana:pastaPomodoro:1:pranzo:2]]\n[[settimana:riso:9:Cena:2]]\n[[spesa: Basilico ]]\n[[ricetta:caprese:1]]\n[[cancella:tutto]]",
      today,
    );
    expect(reply.text).toBe("Ti propongo la caprese: usa la mozzarella.");
    expect(reply.actions).toEqual([
      { type: "ricetta", id: "caprese", servings: 1 },
      {
        type: "settimana",
        id: "pastaPomodoro",
        date: "2026-11-18",
        slot: "Pranzo",
        servings: 2,
      },
      { type: "spesa", name: "Basilico" },
    ]);
    expect(parseReply("[[ricetta:caprese:1]]").text).not.toBe("");
  });
});

describe("Servizi gratuiti compatibili", () => {
  it("ordina i modelli utilizzabili e scarta quelli non adatti alla chat", async () => {
    vi.stubGlobal(
      "fetch",
      respond(200, {
        data: [
          { id: "models/gemini-embedding-001" },
          { id: "models/gemini-2.5-flash-lite" },
          { id: "models/gemini-3-flash-preview" },
          { id: "models/gemini-2.5-flash" },
          { id: "models/gemini-2.5-flash-image" },
        ],
      }),
    );
    expect(await listModels({ provider: "gemini", key: "k" })).toEqual([
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-3-flash-preview",
    ]);
    vi.stubGlobal(
      "fetch",
      respond(200, { data: [{ id: "a/b:free" }, { id: "a/paid" }] }),
    );
    expect(await listModels({ provider: "openrouter", key: "k" })).toEqual([
      "a/b:free",
    ]);
  });
  it("invia contesto e conversazione con la chiave della persona", async () => {
    const fetchMock = respond(200, {
      choices: [{ message: { content: "Ciao [[spesa:Uova]]" } }],
    });
    vi.stubGlobal("fetch", fetchMock);
    const reply = await askFridgy(
      { provider: "groq", key: " gsk_test ", model: "m" },
      initialState,
      [{ role: "user", content: "Cosa cucino?" }],
    );
    expect(reply).toEqual({
      text: "Ciao",
      actions: [{ type: "spesa", name: "Uova" }],
    });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer gsk_test",
    );
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe("m");
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toContain("Mozzarella: 1 pezzi");
    expect(body.messages[1]).toEqual({ role: "user", content: "Cosa cucino?" });
  });
  it("distingue chiave rifiutata, limite gratuito e risposta vuota", async () => {
    const ask = () =>
      askFridgy({ provider: "groq", key: "k", model: "m" }, initialState, [
        { role: "user", content: "Ciao" },
      ]);
    vi.stubGlobal("fetch", respond(401, {}));
    await expect(ask()).rejects.toMatchObject({ kind: "key" });
    vi.stubGlobal("fetch", respond(429, {}));
    await expect(ask()).rejects.toMatchObject({ kind: "limit" });
    vi.stubGlobal("fetch", respond(200, { choices: [] }));
    await expect(ask()).rejects.toBeInstanceOf(FridgyError);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("offline");
      }),
    );
    await expect(ask()).rejects.toMatchObject({ kind: "network" });
  });
});

it("recupera un 503 con un solo nuovo tentativo sullo stesso modello", async () => {
  const mock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { status: "UNAVAILABLE" } }), {
        status: 503,
      }),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Risposta riuscita" } }],
        }),
        { status: 200 },
      ),
    );
  vi.stubGlobal("fetch", mock);
  const result = await askFridgy(
    { provider: "gemini", key: "test-only", model: "gemini-3.8-flash" },
    initialState,
    [{ role: "user", content: "Ciao" }],
  );
  expect(result.text).toBe("Risposta riuscita");
  expect(mock).toHaveBeenCalledTimes(2);
  expect(JSON.parse(mock.mock.calls[0][1].body).model).toBe(
    JSON.parse(mock.mock.calls[1][1].body).model,
  );
});
it("non confonde sovraccarico persistente e chiave rifiutata", async () => {
  const mock = respond(503, { error: { status: "UNAVAILABLE" } });
  vi.stubGlobal("fetch", mock);
  await expect(
    testFridgyModel({ provider: "gemini", key: "test-only", model: "m" }),
  ).rejects.toMatchObject({ kind: "temporary" });
  expect(mock).toHaveBeenCalledTimes(2);
  vi.stubGlobal(
    "fetch",
    respond(400, { error: { message: "API key not valid" } }),
  );
  await expect(
    testFridgyModel({ provider: "gemini", key: "test-only", model: "m" }),
  ).rejects.toMatchObject({ kind: "key" });
});
