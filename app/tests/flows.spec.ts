import { test, expect } from "@playwright/test";
test("scorte: ricerca, modifica, persistenza e priorità", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(crypto, "randomUUID", {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await page.getByLabel("Cerca un alimento").fill("uova");
  await expect(
    page.getByRole("button", { name: "Modifica Zucchine" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Modifica Uova" }).click();
  await page.getByLabel("Quantità").fill("6");
  await page.getByRole("button", { name: "Salva alimento" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Uova" }),
  ).toContainText("6 pezzi");
  await page
    .getByRole("button", { name: "Aggiungi alimento", exact: true })
    .click();
  await page.getByLabel("Nome", { exact: true }).fill("Carote");
  await page.getByLabel("Quantità").fill("3");
  await page.getByRole("button", { name: "Salva alimento" }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Carote" }),
  ).toBeVisible();
});
test("Fridgy recupera un errore e rispetta una correzione senza cambiare le scorte", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Trova un’idea" }).click();
  await page.getByRole("button", { name: "Senza uova", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Frittata di zucchine/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Riso e zucchine/ }),
  ).toBeVisible();
  await page.getByLabel("Messaggio per Fridgy").fill("Che film guardo?");
  await page.getByRole("button", { name: "Invia messaggio" }).click();
  await expect(page.getByRole("log")).toContainText(
    "Posso aiutarti con ingredienti",
  );
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Uova" }),
  ).toContainText("3 pezzi");
});
test("cambio di programma, annullamento e conferma di consumo", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Cambia programma" }).click();
  await page.getByRole("button", { name: "Conferma lo spostamento" }).click();
  await expect(page.getByRole("dialog")).toContainText("Pasto spostato");
  await page.getByRole("button", { name: "Ho capito" }).click();
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Zucchine" }),
  ).toContainText("2 pezzi");
  await page.getByRole("button", { name: "Pasti", exact: true }).click();
  await page
    .getByRole("button", { name: "Annulla ultimo spostamento" })
    .click();
  await expect(page.locator(".meal-card")).toContainText("Stasera");
  await page.getByRole("button", { name: "Ho cucinato questo pasto" }).click();
  await page.getByRole("button", { name: "Conferma consumo" }).click();
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Zucchine" }),
  ).toHaveCount(0);
});
test("layout mobile, SVG locali, dialogo accessibile e screenshot", async ({
  page,
}) => {
  for (const width of [320, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 920 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "test-results/oggi.png", fullPage: true });
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await page.screenshot({ path: "test-results/dispensa.png", fullPage: true });
  const images = await page
    .locator("img")
    .evaluateAll((imgs) =>
      imgs.every(
        (i) =>
          (i as HTMLImageElement).complete &&
          (i as HTMLImageElement).naturalWidth > 0,
      ),
    );
  expect(images).toBeTruthy();
  await page
    .getByRole("button", { name: "Aggiungi alimento", exact: true })
    .click();
  await expect(page.getByLabel("Nome", { exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("tutte le schermate a larghezze diverse e nessun errore JavaScript", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [320, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    for (const tab of ["Dispensa", "Fridgy", "Pasti", "Oggi"]) {
      await page.getByRole("button", { name: tab, exact: true }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      if (width === 390)
        await page.screenshot({
          path: `test-results/${tab.toLowerCase()}-final.png`,
          fullPage: true,
        });
    }
  }
  expect(errors).toEqual([]);
});
test("build installabile: risorse locali e navigazione offline", async ({
  page,
  context,
}) => {
  await page.goto("http://127.0.0.1:4173/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", resolve, {
          once: true,
        }),
      );
  });
  const manifest = await page.request.get(
    "http://127.0.0.1:4173/manifest.webmanifest",
  );
  expect(manifest.ok()).toBeTruthy();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Cosa c’è di buono?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Zucchine" }),
  ).toBeVisible();
  await context.setOffline(false);
});

test("alimenti liberi e nuove unità persistono; autori dei messaggi sono visibili", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await page
    .getByRole("button", { name: "Aggiungi alimento", exact: true })
    .click();
  await page.getByLabel("Nome", { exact: true }).fill("Latte di avena");
  await page.getByLabel("Quantità").fill("500");
  await page.getByLabel("Unità").selectOption("ml");
  await page.getByRole("button", { name: "Salva alimento" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Latte di avena" }),
  ).toContainText("500 ml");
  await page.getByRole("button", { name: "Fridgy", exact: true }).click();
  await page.getByRole("button", { name: "Solo per me", exact: true }).click();
  await expect(
    page.locator(".message.user .message-author").first(),
  ).toHaveText("Tu");
  await expect(page.locator(".message.bot .message-author").first()).toHaveText(
    "Fridgy · Demo AI",
  );
});
test("catalogo importato ricercabile e nessun tempo inventato", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Esplora il ricettario" }).click();
  await expect(page.getByRole("dialog")).toContainText("TheMealDB");
  await page.getByLabel("Cerca per titolo o ingrediente").fill("Lasagne");
  await page.getByRole("button", { name: /Lasagne/ }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Tempo e porzioni non disponibili",
  );
  await expect(page.getByRole("dialog")).toContainText("Ingredienti");
});

test("Pasti consente di sostituire il piano con una ricetta importata e conservarla", async ({
  page,
}) => {
  await page.addInitScript(
    () =>
      !localStorage.getItem("ciby-v1") &&
      localStorage.setItem(
        "ciby-v1",
        JSON.stringify({
          version: 1,
          foods: [
            {
              id: "p",
              name: "Pasta",
              quantity: 500,
              unit: "g",
              place: "Dispensa",
              priority: false,
              art: "aa8ab.svg",
            },
            {
              id: "l",
              name: "Lenticchie",
              quantity: 200,
              unit: "g",
              place: "Dispensa",
              priority: false,
              art: "aa8ab.svg",
            },
          ],
          plan: {
            recipe: "frittata",
            when: "Stasera",
            servings: 2,
            consumed: false,
          },
        }),
      ),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Pasti", exact: true }).click();
  await page
    .getByRole("button", { name: "Esplora ricette e cambia pasto" })
    .click();
  await page.getByLabel("Cerca per titolo o ingrediente").fill("pasta");
  await expect(
    page.getByRole("dialog").locator(".recipe-option").first(),
  ).toBeVisible();
  await page.getByRole("dialog").locator(".recipe-option").first().click();
  const selected = await page
    .getByRole("dialog")
    .getByRole("heading")
    .first()
    .innerText();
  await page
    .getByRole("button", { name: "Scegli per il prossimo pasto" })
    .click();
  await expect(page.locator(".meal-card")).toContainText(selected);
  await expect(page.locator(".meal-card")).toContainText(
    "Tempo non disponibile",
  );
  await expect(
    page.getByRole("button", { name: "Ho cucinato questo pasto" }),
  ).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "Pasti", exact: true }).click();
  await expect(page.locator(".meal-card")).toContainText(selected);
  await expect(
    page.getByRole("button", { name: "Sposta questo pasto" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Dispensa", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Modifica Pasta" }).locator("img"),
  ).toHaveAttribute("src", /pasta.svg/);
  await expect(
    page.getByRole("button", { name: "Modifica Lenticchie" }).locator("img"),
  ).toHaveAttribute("src", /lentils.svg/);
  await page.screenshot({
    path: "test-results/nuovi-alimenti.png",
    fullPage: true,
  });
});
