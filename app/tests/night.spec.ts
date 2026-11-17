import { test, expect } from "@playwright/test";
test("modalità notte persistente e automatica seguono la scelta della persona", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.getByRole("button", { name: "Opzioni del prototipo" }).click();
  await page.getByRole("radio", { name: "Notte", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Chiudi finestra" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  for (const tab of ["Dispensa", "Pasti", "Fridgy", "Oggi"]) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    const bg = await page
      .locator(".app-shell")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe("rgb(9, 13, 20)");
  }
  await page.screenshot({ path: "test-results/notte-390.png", fullPage: true });
  await page.getByRole("button", { name: "Opzioni del prototipo" }).click();
  await page.getByRole("radio", { name: "Automatico", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("radio", { name: "Chiaro", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
test("Gemini non viene attivato se la generazione fallisce e si recupera con un altro modello", async ({
  page,
}) => {
  const base = "https://generativelanguage.googleapis.com/v1beta/openai";
  await page.route(`${base}/models`, (route) =>
    route.fulfill({
      json: {
        data: [{ id: "gemini-3.8-flash" }, { id: "gemini-3.5-flash-lite" }],
      },
    }),
  );
  await page.route(`${base}/chat/completions`, (route) =>
    route.request().postDataJSON().model === "gemini-3.8-flash"
      ? route.fulfill({
          status: 503,
          json: { error: { status: "UNAVAILABLE" } },
        })
      : route.fulfill({ json: { choices: [{ message: { content: "OK" } }] } }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Fridgy", exact: true }).click();
  await page.getByRole("button", { name: "Attiva l’AI gratuita" }).click();
  await page.getByLabel("La tua chiave API").fill("test-placeholder");
  await page.getByRole("button", { name: "Verifica la chiave" }).click();
  await page
    .getByRole("button", { name: "Prova modello", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Attiva Fridgy con AI" }),
  ).toBeEnabled();
  await page
    .getByRole("combobox", { name: "Modello", exact: true })
    .selectOption("gemini-3.8-flash");
  await page
    .getByRole("button", { name: "Prova modello", exact: true })
    .click();
  await expect(page.locator(".fridgy-setup-status")).toContainText(
    "sovraccarico",
  );
  await expect(
    page.getByRole("button", { name: "Attiva Fridgy con AI" }),
  ).toBeDisabled();
  await page
    .getByRole("combobox", { name: "Modello", exact: true })
    .selectOption("gemini-3.5-flash-lite");
  await page
    .getByRole("button", { name: "Prova modello", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Attiva Fridgy con AI" }),
  ).toBeEnabled();
});

test("le impostazioni salvate caricano alternative e consentono il cambio durante un 503", async ({
  page,
}) => {
  const base = "https://generativelanguage.googleapis.com/v1beta/openai";
  await page.addInitScript(() =>
    localStorage.setItem(
      "ciby-fridgy",
      JSON.stringify({
        provider: "gemini",
        key: "test-placeholder",
        model: "gemini-3.8-flash",
      }),
    ),
  );
  await page.route(`${base}/models`, (r) =>
    r.fulfill({
      json: {
        data: [{ id: "gemini-3.8-flash" }, { id: "gemini-3.5-flash-lite" }],
      },
    }),
  );
  await page.route(`${base}/chat/completions`, (r) =>
    r.request().postDataJSON().model === "gemini-3.8-flash"
      ? r.fulfill({ status: 503, json: { error: { status: "UNAVAILABLE" } } })
      : r.fulfill({ json: { choices: [{ message: { content: "OK" } }] } }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Fridgy", exact: true }).click();
  await page
    .getByRole("button", { name: "Impostazioni AI", exact: true })
    .click();
  const model = page.getByRole("combobox", { name: "Modello", exact: true });
  await expect(model.locator("option")).toHaveCount(2);
  await expect(model).toHaveValue("gemini-3.8-flash");
  await page
    .getByRole("button", { name: "Prova modello", exact: true })
    .click();
  await expect(model).toBeEnabled();
  await model.selectOption("gemini-3.5-flash-lite");
  await page
    .getByRole("button", { name: "Prova modello", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Attiva Fridgy con AI" }),
  ).toBeEnabled();
  await expect(model).toHaveValue("gemini-3.5-flash-lite");
});

test("un elenco non disponibile non impedisce di inserire un altro modello", async ({
  page,
}) => {
  const base = "https://generativelanguage.googleapis.com/v1beta/openai";
  await page.addInitScript(() =>
    localStorage.setItem(
      "ciby-fridgy",
      JSON.stringify({
        provider: "gemini",
        key: "test-placeholder",
        model: "gemini-3.8-flash",
      }),
    ),
  );
  await page.route(`${base}/models`, (r) =>
    r.fulfill({ status: 503, json: {} }),
  );
  await page.route(`${base}/chat/completions`, (r) =>
    r.fulfill({ json: { choices: [{ message: { content: "OK" } }] } }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Fridgy", exact: true }).click();
  await page
    .getByRole("button", { name: "Impostazioni AI", exact: true })
    .click();
  await expect(page.locator(".fridgy-setup-status")).toContainText(
    "manualmente",
  );
  await page
    .getByText("Inserisci un ID modello manualmente", { exact: true })
    .click();
  await page
    .getByLabel("ID modello", { exact: true })
    .fill("gemini-3.5-flash-lite");
  await page
    .getByRole("button", { name: "Prova modello", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Attiva Fridgy con AI" }),
  ).toBeEnabled();
});
