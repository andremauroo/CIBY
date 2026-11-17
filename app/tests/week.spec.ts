import { test, expect } from "@playwright/test";

test("pianificare un pasto non cambia le scorte; cucinarlo sì, una volta", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pasti", exact: true }).click();
  await page.getByRole("button", { name: /^Settimana/ }).click();
  await page.getByRole("button", { name: /^Domani,/ }).click();
  await page.getByRole("button", { name: "Aggiungi pranzo di domani" }).click();
  await page
    .getByRole("button", { name: "Metti in programma", exact: true })
    .first()
    .click();
  await expect(page.locator(".week-meal")).toContainText(
    "Pasta al pomodoro fresco",
  );
  await expect(page.locator(".week-needs")).toContainText(
    "160 g previsti · ne hai 500",
  );
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Pasta" }),
  ).toContainText("500 g");
  await page.getByRole("button", { name: "Pasti", exact: true }).click();
  await page.getByRole("button", { name: /^Domani,/ }).click();
  await page.getByRole("button", { name: "Ho cucinato", exact: true }).click();
  await page.getByRole("button", { name: "Conferma: ho cucinato" }).click();
  await expect(page.locator(".week-meal")).toHaveCount(0);
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Pasta" }),
  ).toContainText("340 g");
});

test("un pasto con ingredienti mancanti porta gli acquisti nella spesa", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /I pasti della settimana/ }).click();
  await page.getByRole("button", { name: "Aggiungi cena di oggi" }).click();
  await page.getByText(/preparazioni a cui manca qualcosa/).click();
  await page
    .locator(".compare-card", { hasText: "Bowl di riso e pollo" })
    .getByRole("button")
    .click();
  await expect(page.locator(".week-status.lacking")).toContainText("pollo");
  await page
    .getByRole("button", { name: /Aggiungi i mancanti alla spesa/ })
    .click();
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await page.getByRole("button", { name: /^Spesa/ }).click();
  await expect(page.locator(".shopping-item")).toHaveCount(2);
  await expect(page.locator(".shopping-items")).toContainText("Pollo");
});

test("rimuovere un alimento chiede l’esito e lo riporta nel riepilogo", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await page.getByRole("button", { name: "Modifica Mozzarella" }).click();
  await page.getByRole("button", { name: "Rimuovi alimento" }).click();
  await page.getByRole("button", { name: "L’ho buttato" }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Mozzarella" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Oggi", exact: true }).click();
  await expect(page.locator(".impact-waste")).toContainText("1 buttati");
});
