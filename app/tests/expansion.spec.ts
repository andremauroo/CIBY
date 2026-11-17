import { test, expect, type Page } from "@playwright/test";

async function readSaved(page: Page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("ciby-v1") || "null"),
  );
}

async function openLasagne(page: Page) {
  await page.getByRole("button", { name: "Esplora il ricettario" }).click();
  await page
    .getByLabel("Cerca per titolo o ingrediente")
    .fill("Lasagne alla bolognese");
  await page
    .getByRole("dialog")
    .locator(".recipe-option")
    .filter({ hasText: "Lasagne alla bolognese" })
    .click();
}

test("le ricette preferite persistono e possono essere rimosse senza cambiare il pasto", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Cosa c’è di buono?" }),
  ).toBeVisible();
  const before = await readSaved(page);
  await openLasagne(page);
  await page
    .getByRole("button", { name: "Salva ricetta", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Salvata", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Chiudi finestra" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Esplora il ricettario" }).click();
  await page
    .getByRole("button", { name: "Preferite (1)", exact: true })
    .click();
  await expect(page.getByRole("dialog").locator(".recipe-option")).toHaveCount(
    1,
  );
  await expect(
    page.getByRole("dialog").locator(".recipe-option"),
  ).toContainText("Lasagne alla bolognese");
  await page.getByRole("dialog").locator(".recipe-option").click();
  await page.getByRole("button", { name: "Salvata", exact: true }).click();
  await page.getByRole("button", { name: "Torna alle ricette" }).click();
  await expect(page.getByRole("dialog").locator(".recipe-option")).toHaveCount(
    0,
  );
  const after = await readSaved(page);
  expect(after.favoriteIds).toEqual([]);
  expect(after.foods).toEqual(before.foods);
  expect(after.week).toEqual(before.week);
});

test("gli ingredienti selezionati passano alla spesa una sola volta e lasciano invariate le scorte", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Cosa c’è di buono?" }),
  ).toBeVisible();
  const before = await readSaved(page);
  await openLasagne(page);
  const checkboxes = page.locator(".ingredient-checklist input[type=checkbox]");
  for (const checkbox of await checkboxes.all()) await checkbox.uncheck();
  await checkboxes.first().check();
  const selectedName = await page
    .locator(".ingredient-checklist strong")
    .first()
    .innerText();
  await page
    .getByRole("button", { name: "Aggiungi alla spesa (1)", exact: true })
    .click();
  await expect
    .poll(async () => (await readSaved(page)).shopping.length)
    .toBe(1);
  await page.getByRole("button", { name: "Torna alle ricette" }).click();
  await page
    .getByRole("dialog")
    .locator(".recipe-option")
    .filter({ hasText: "Lasagne alla bolognese" })
    .click();
  for (const checkbox of await checkboxes.all()) await checkbox.uncheck();
  await checkboxes.first().check();
  await page
    .getByRole("button", { name: "Aggiungi alla spesa (1)", exact: true })
    .click();
  await expect(page.locator(".catalog-feedback")).toContainText(
    "Lista della spesa aggiornata",
  );
  const after = await readSaved(page);
  expect(after.shopping).toHaveLength(1);
  expect(after.shopping[0].name).toBe(selectedName);
  expect(after.shopping[0].sources).toHaveLength(1);
  expect(after.shopping[0].sources[0].title).toBe("Lasagne alla bolognese");
  expect(after.foods).toEqual(before.foods);
  expect(after.week).toEqual(before.week);
  expect(
    await page
      .getByRole("dialog")
      .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
  ).toBeTruthy();
  await page.screenshot({ path: testInfo.outputPath("ingredienti-320.png") });
  await page.getByRole("button", { name: "Chiudi finestra" }).click();
  await page.reload();
  await page.getByRole("button", { name: /La tua lista della spesa/ }).click();
  await expect(page.locator(".shopping-item")).toHaveCount(1);
  await expect(page.locator(".shopping-item")).toContainText(selectedName);
});

test("registrare un acquisto richiede la quantità reale e aggiorna lista e dispensa insieme", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: /La tua lista della spesa/ }).click();
  const before = await readSaved(page);
  await page.getByLabel("Alimento da comprare", { exact: true }).fill("Ceci");
  await page
    .getByLabel("Nota facoltativa", { exact: true })
    .fill("Due confezioni per la cena");
  await page
    .getByRole("button", { name: "Aggiungi alla lista", exact: true })
    .click();
  await page.getByLabel("Acquistato: Ceci", { exact: true }).check();
  expect((await readSaved(page)).foods).toEqual(before.foods);
  await page.reload();
  await page.getByRole("button", { name: /La tua lista della spesa/ }).click();
  await expect(
    page.getByLabel("Acquistato: Ceci", { exact: true }),
  ).toBeChecked();
  await expect(page.getByLabel("Nota per Ceci", { exact: true })).toHaveValue(
    "Due confezioni per la cena",
  );
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.screenshot({
    path: testInfo.outputPath("lista-spesa-390.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Porta in dispensa", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Registra l’acquisto");
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("Ceci");
  await expect(page.getByLabel("Quantità", { exact: true })).toHaveValue("");
  await page
    .getByRole("button", { name: "Salva alimento", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Chiudi finestra" }).click();
  expect((await readSaved(page)).foods).toEqual(before.foods);
  await expect(page.locator(".shopping-item")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Porta in dispensa", exact: true })
    .click();
  await page.getByLabel("Quantità", { exact: true }).fill("2");
  await page
    .getByRole("combobox", { name: "Unità", exact: true })
    .selectOption("confezioni");
  await page
    .getByRole("combobox", { name: "Dove si trova", exact: true })
    .selectOption("Dispensa");
  await page
    .getByRole("button", { name: "Salva alimento", exact: true })
    .click();
  await expect(page.locator(".shopping-item")).toHaveCount(0);
  await expect.poll(async () => (await readSaved(page)).shopping).toEqual([]);
  const after = await readSaved(page);
  expect(after.foods).toHaveLength(before.foods.length + 1);
  expect(after.foods.slice(0, before.foods.length)).toEqual(before.foods);
  expect(after.foods.at(-1)).toMatchObject({
    name: "Ceci",
    quantity: 2,
    unit: "confezioni",
    place: "Dispensa",
  });
  await page.reload();
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Ceci", exact: true }),
  ).toContainText("2 confezioni");
});

test("rimuovere una voce dalla spesa richiede conferma e non modifica la dispensa", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /La tua lista della spesa/ }).click();
  const before = await readSaved(page);
  await page.getByLabel("Alimento da comprare", { exact: true }).fill("Pane");
  await page
    .getByRole("button", { name: "Aggiungi alla lista", exact: true })
    .click();
  await page.getByLabel("Alimento da comprare", { exact: true }).fill(" pane ");
  await page
    .getByRole("button", { name: "Aggiungi alla lista", exact: true })
    .click();
  await expect(page.locator(".shopping-item")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Rimuovi Pane dalla lista", exact: true })
    .click();
  await page.getByRole("button", { name: "Annulla", exact: true }).click();
  await expect(page.locator(".shopping-item")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Rimuovi Pane dalla lista", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Conferma rimozione dalla lista",
      exact: true,
    })
    .click();
  await expect(page.locator(".shopping-item")).toHaveCount(0);
  expect((await readSaved(page)).foods).toEqual(before.foods);
});
