import { test, expect, type Page } from "@playwright/test";

// The provider is simulated: these flows never call a real service.
const base = "https://api.groq.com/openai/v1";
async function connect(page: Page) {
  await page.route(`${base}/models`, (route) =>
    route.fulfill({
      json: {
        data: [{ id: "whisper-large-v3" }, { id: "llama-3.3-70b-versatile" }],
      },
    }),
  );
  await page.route(`${base}/chat/completions`, async (route) => {
    const body = route.request().postDataJSON();
    if (body.messages?.[0]?.content === "Rispondi soltanto OK.")
      return route.fulfill({
        json: { choices: [{ message: { content: "OK" } }] },
      });
    await route.fallback();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Fridgy", exact: true }).click();
  await page.getByRole("button", { name: "Attiva l’AI gratuita" }).click();
  await page.getByLabel("Servizio").selectOption("groq");
  await page.getByLabel("La tua chiave API").fill("gsk_prova");
  await page.getByRole("button", { name: "Verifica la chiave" }).click();
  await expect(
    page.getByRole("combobox", { name: "Modello", exact: true }),
  ).toHaveValue("llama-3.3-70b-versatile");
  await page
    .getByRole("button", { name: "Prova modello", exact: true })
    .click();
  await page.getByRole("button", { name: "Attiva Fridgy con AI" }).click();
  await expect(page.locator(".fridgy-mode")).toContainText("AI attiva");
}

test("Fridgy con AI riceve il contesto e propone azioni da confermare", async ({
  page,
}) => {
  let body: { messages: { role: string; content: string }[] } | null = null;
  let auth = "";
  await page.route(`${base}/chat/completions`, async (route) => {
    body = route.request().postDataJSON();
    auth = (await route.request().headerValue("authorization")) || "";
    await route.fulfill({
      json: {
        choices: [
          {
            message: {
              content:
                "La mozzarella è da usare entro domani: una caprese per te, e la pasta per domani a pranzo.\n[[ricetta:caprese:1]]\n[[settimana:pastaPomodoro:1:Pranzo:2]]\n[[spesa:Basilico]]",
            },
          },
        ],
      },
    });
  });
  await connect(page);
  await page.getByRole("button", { name: "Cosa rischio di sprecare?" }).click();
  await expect(page.getByRole("log")).toContainText(
    "La mozzarella è da usare entro domani",
  );
  await expect(page.getByRole("log")).toContainText("Fridgy · AI");
  await expect(page.getByRole("log")).not.toContainText("[[");
  expect(auth).toBe("Bearer gsk_prova");
  expect(body!.messages[0].content).toContain("Mozzarella: 1 pezzi");
  expect(body!.messages.at(-1)).toEqual({
    role: "user",
    content: "Cosa rischio di sprecare?",
  });
  const before = await page.evaluate(() => localStorage.getItem("ciby-v1"));
  expect(JSON.parse(before!).week).toEqual([]);
  await page
    .getByRole("button", { name: /Programma Pasta al pomodoro fresco/ })
    .click();
  await page
    .getByRole("button", { name: "Aggiungi Basilico alla spesa" })
    .click();
  await expect(
    page.getByRole("button", { name: /Fatto · Aggiungi Basilico/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /Apri Caprese/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Mozzarella: 1 pezzi");
  await page.getByRole("button", { name: "Chiudi finestra" }).click();
  await page.getByRole("button", { name: "Pasti", exact: true }).click();
  await page.getByRole("button", { name: /^Settimana/ }).click();
  await page.getByRole("button", { name: /^Domani,/ }).click();
  await expect(page.locator(".week-meal")).toContainText(
    "Pasta al pomodoro fresco",
  );
  // The key stays in this browser and is kept after a reload.
  await page.reload();
  await page.getByRole("button", { name: "Fridgy", exact: true }).click();
  await expect(page.locator(".fridgy-mode")).toContainText("AI attiva");
  expect(
    await page.evaluate(() => localStorage.getItem("ciby-v1")),
  ).not.toContain("gsk_prova");
});

test("se il servizio non risponde Fridgy lo dice e continua in demo", async ({
  page,
}) => {
  await page.route(`${base}/chat/completions`, (route) =>
    route.fulfill({ status: 429, json: {} }),
  );
  await connect(page);
  await page.getByLabel("Messaggio per Fridgy").fill("per due, 20 minuti");
  await page.getByRole("button", { name: "Invia messaggio" }).click();
  await expect(page.getByRole("log")).toContainText("limite gratuito");
  await expect(page.getByRole("log")).toContainText("modalità demo");
  await expect(
    page.getByRole("button", { name: /Frittata di zucchine/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Impostazioni AI" }).click();
  await page
    .getByRole("button", { name: "Rimuovi la chiave e torna alla demo" })
    .click();
  await expect(page.locator(".fridgy-mode")).toContainText(
    "senza AI generativa",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("ciby-fridgy")),
  ).toBeNull();
});

test("503 persistente mostra la demo e riprovare recupera senza duplicare la domanda", async ({
  page,
}) => {
  let calls = 0;
  await page.route(`${base}/chat/completions`, (route) => {
    calls++;
    return calls <= 2
      ? route.fulfill({
          status: 503,
          json: { error: { status: "UNAVAILABLE" } },
        })
      : route.fulfill({
          json: { choices: [{ message: { content: "Ora rispondo con AI." } }] },
        });
  });
  await connect(page);
  await page.getByLabel("Messaggio per Fridgy").fill("Cosa preparo?");
  await page.getByRole("button", { name: "Invia messaggio" }).click();
  await expect(page.getByRole("log")).toContainText("sovraccarico");
  await expect(page.locator(".fridgy-mode")).toContainText("modalità demo");
  await page
    .getByRole("button", { name: "Riprova con AI", exact: true })
    .click();
  await expect(page.getByRole("log")).toContainText("Ora rispondo con AI.");
  await expect(page.locator(".message.user")).toHaveCount(1);
});
