import { test, expect } from "@playwright/test";

test("porta tutta la lista in dispensa chiedendo le quantità reali", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /La tua lista della spesa/ }).click();
  for (const name of ["Pollo", "Riso"]) {
    await page.getByLabel("Alimento da comprare", { exact: true }).fill(name);
    await page
      .getByRole("button", { name: "Aggiungi alla lista", exact: true })
      .click();
  }
  await page
    .getByRole("button", { name: "Porta tutta la lista in dispensa" })
    .click();
  const save = page.getByRole("button", { name: /Salva 2 alimenti/ });
  await expect(save).toBeDisabled();
  await expect(page.getByLabel("Unità di Pollo")).toHaveValue("g");
  await expect(page.getByLabel("Posizione di Riso")).toHaveValue("Dispensa");
  await page.getByLabel("Quantità di Pollo").fill("300");
  await page.getByLabel("Quantità di Riso").fill("1000");
  await save.click();
  await expect(page.locator(".shopping-item")).toHaveCount(0);
  await page.getByRole("button", { name: "Scorte", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Pollo" }),
  ).toContainText("300 g");
  // The original rice stays; the purchase is a separate entry.
  await expect(page.getByRole("button", { name: "Modifica Riso" })).toHaveCount(
    2,
  );
});

test("solo gli acquistati, se ce ne sono; chiudere non cambia nulla", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /La tua lista della spesa/ }).click();
  for (const name of ["Ceci", "Latte"]) {
    await page.getByLabel("Alimento da comprare", { exact: true }).fill(name);
    await page
      .getByRole("button", { name: "Aggiungi alla lista", exact: true })
      .click();
  }
  await page.getByLabel("Acquistato: Ceci").check();
  const before = await page.evaluate(() => localStorage.getItem("ciby-v1"));
  await page
    .getByRole("button", { name: "Porta in dispensa gli acquistati (1)" })
    .click();
  await expect(page.getByLabel("Quantità di Ceci")).toBeVisible();
  await expect(page.getByLabel("Quantità di Latte")).toHaveCount(0);
  await page.getByRole("button", { name: "Chiudi finestra" }).click();
  expect(await page.evaluate(() => localStorage.getItem("ciby-v1"))).toBe(
    before,
  );
});

test("−1 aggiorna subito le scorte e a zero conta come finito", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await page.getByRole("button", { name: "Usa 1 pezzo di Zucchine" }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Zucchine" }),
  ).toContainText("1 pezzi");
  await page.getByRole("button", { name: "Usa 1 pezzo di Zucchine" }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Zucchine" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Oggi", exact: true }).click();
  await expect(page.locator(".impact-waste")).toContainText("1 finiti");
});

test("uno scenario di prova sostituisce i dati e mostra il compito", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Opzioni del prototipo" }).click();
  await page.getByRole("button", { name: /^L Luca/ }).click();
  await page.getByRole("button", { name: "Carica", exact: true }).click();
  await expect(page.locator(".task-card")).toContainText("manca il pollo");
  await expect(page.locator(".meal-card")).toContainText(
    "Bowl di riso e pollo",
  );
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Zucchine" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Modifica Mozzarella" }),
  ).toHaveCount(0);
});
