import { test, expect } from "@playwright/test";

test("aggiungere un alimento con la virgola e dai suggerimenti", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await page
    .getByRole("button", { name: "Aggiungi alimento", exact: true })
    .click();
  await page.getByRole("button", { name: "Pollo", exact: true }).click();
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("Pollo");
  await expect(
    page.getByRole("combobox", { name: "Unità", exact: true }),
  ).toHaveValue("g");
  await page.getByLabel("Quantità", { exact: true }).fill("0,");
  await page.getByRole("button", { name: "Salva alimento" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "quantità maggiore di zero",
  );
  await page.getByLabel("Quantità", { exact: true }).fill("0,25");
  await page
    .getByRole("combobox", { name: "Unità", exact: true })
    .selectOption("kg");
  await page.getByRole("button", { name: "Salva alimento" }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Pollo" }),
  ).toContainText("0.25 kg");
});

test("un nome vuoto mostra l’errore nel modulo, non un fumetto", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await page
    .getByRole("button", { name: "Aggiungi alimento", exact: true })
    .click();
  await page.getByRole("button", { name: "Salva alimento" }).click();
  await expect(page.getByRole("alert")).toContainText("Scrivi il nome");
  await expect(page.getByRole("dialog")).toBeVisible();
});
