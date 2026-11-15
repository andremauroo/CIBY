import { test, expect } from "@playwright/test";

test("B01 apre il ricettario filtrato e B04 avvisa prima di ricomprare", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ricette con Zucchine" }).click();
  await expect(page.getByLabel("Cerca per titolo o ingrediente")).toHaveValue(
    "Zucchine",
  );
  await page.getByRole("button", { name: "Chiudi finestra" }).click();
  await page.getByRole("button", { name: /La tua lista della spesa/ }).click();
  await page
    .getByLabel("Alimento da comprare", { exact: true })
    .fill("Pomodori");
  await page
    .getByRole("button", { name: "Aggiungi alla lista", exact: true })
    .click();
  await expect(page.locator(".shopping-owned")).toContainText(
    "4 pezzi in frigo",
  );
});

test("il confronto rispetta il tempo e chiuderlo non cambia il piano", async ({
  page,
}) => {
  await page.goto("/");
  const before = await page.evaluate(() => localStorage.getItem("ciby-v1"));
  await page
    .getByRole("button", { name: "Confronta opzioni", exact: true })
    .click();
  await page.getByRole("button", { name: "15 min", exact: true }).click();
  for (const button of await page
    .getByRole("button", { name: "Tempo insufficiente", exact: true })
    .all())
    await expect(button).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Tempo insufficiente", exact: true }),
  ).toHaveCount(3);
  await page.getByRole("button", { name: "Chiudi finestra" }).click();
  expect(await page.evaluate(() => localStorage.getItem("ciby-v1"))).toBe(
    before,
  );
});

test("introduzione rivedibile e storico solo dopo conferma consumo", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Opzioni del prototipo" }).click();
  await page.getByRole("button", { name: "Rivedi l’introduzione" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Parti da quello che hai.",
  );
  await page.getByRole("button", { name: "Avanti", exact: true }).click();
  await page.getByRole("button", { name: "Avanti", exact: true }).click();
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await expect(page.locator(".impact-stats strong").first()).toHaveText("0");
  await page.getByRole("button", { name: "Pasti", exact: true }).click();
  await page.getByRole("button", { name: "Ho cucinato questo pasto" }).click();
  await page.getByRole("button", { name: "Conferma consumo" }).click();
  await page.getByRole("button", { name: "Oggi", exact: true }).click();
  await expect(page.locator(".impact-stats strong").first()).toHaveText("1");
  await expect(page.locator(".impact-last")).toContainText(
    "Frittata di zucchine",
  );
});
