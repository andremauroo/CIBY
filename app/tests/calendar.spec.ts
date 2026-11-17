import { test, expect } from "@playwright/test";

test("una ricetta del ricettario italiano entra nel calendario con le quantità da confermare", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pasti", exact: true }).click();
  await page.getByRole("button", { name: /^Settimana/ }).click();
  await page.getByRole("button", { name: /^Domani,/ }).click();
  await page.getByRole("button", { name: "Aggiungi cena di domani" }).click();
  await page
    .getByRole("button", { name: "Scegli dal ricettario italiano" })
    .click();
  await page.getByLabel("Cerca per titolo o ingrediente").fill("carbonara");
  await page.getByRole("dialog").locator(".recipe-option").first().click();
  await expect(page.getByRole("dialog")).toContainText("Pasta: 160 g");
  await expect(page.getByRole("dialog")).toContainText("da confermare");
  await expect(page.getByLabel("Occasione")).toHaveValue(/\|Cena$/);
  await page.getByRole("button", { name: "Metti in programma" }).click();
  await expect(page.locator(".week-meal")).toContainText(
    "Spaghetti alla carbonara",
  );
  await expect(page.locator(".week-status.confirm")).toBeVisible();
  // The catalog meal reserves its verified pasta, once.
  await expect(page.locator(".week-needs")).toContainText(
    "160 g previsti · ne hai 500 g",
  );
  await page.getByRole("button", { name: "Annulla", exact: true }).click();
  await expect(page.locator(".week-meal")).toHaveCount(0);
});

test("0,5 kg in dispensa valgono 500 g per le ricette", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await page.getByRole("button", { name: "Modifica Riso" }).click();
  await page.getByLabel("Quantità", { exact: true }).fill("0,5");
  await page
    .getByRole("combobox", { name: "Unità", exact: true })
    .selectOption("kg");
  await page.getByRole("button", { name: "Salva alimento" }).click();
  await page.getByRole("button", { name: "Pasti", exact: true }).click();
  await page.getByRole("button", { name: /^Settimana/ }).click();
  await expect(page.locator(".week-free")).toContainText("Riso");
  await expect(page.locator(".week-free")).toContainText("500 g");
});

test("Annulla ripristina una rimozione dalla dispensa", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await page.getByRole("button", { name: "Modifica Pasta" }).click();
  await page.getByRole("button", { name: "Rimuovi alimento" }).click();
  await page.getByRole("button", { name: "L’ho buttato" }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Pasta" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Annulla", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Pasta" }),
  ).toContainText("500 g");
  await page.getByRole("button", { name: "Oggi", exact: true }).click();
  await expect(page.locator(".impact-waste")).toHaveCount(0);
});
