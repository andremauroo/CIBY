import { test, expect, type Page } from "@playwright/test";
async function openSaved(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "ciby-fridgy",
      JSON.stringify({
        provider: "groq",
        key: "gsk_placeholder_for_copy_test",
        model: "llama-test",
      }),
    );
  });
  await page.route("https://api.groq.com/openai/v1/models", (route) =>
    route.fulfill({ json: { data: [{ id: "llama-test" }] } }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Fridgy", exact: true }).click();
  await page
    .getByRole("button", { name: "Impostazioni AI", exact: true })
    .click();
}
test("copia la chiave già salvata senza esporla nei messaggi e resta mascherata", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await openSaved(page);
  const key = page.getByLabel("La tua chiave API");
  await expect(key).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Copia chiave", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Chiave copiata negli appunti.",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "gsk_placeholder_for_copy_test",
  );
  await expect(key).toHaveAttribute("type", "password");
  await expect(page.getByRole("dialog")).not.toContainText(
    "gsk_placeholder_for_copy_test",
  );
  await page
    .getByRole("button", { name: "Mostra chiave", exact: true })
    .click();
  await expect(key).toHaveAttribute("type", "text");
  await page
    .getByRole("button", { name: "Nascondi chiave", exact: true })
    .click();
  await expect(key).toHaveAttribute("type", "password");
});
test("se gli appunti sono bloccati seleziona la chiave per la copia manuale", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    document.execCommand = () => false;
  });
  await openSaved(page);
  const before = await page.evaluate(() => localStorage.getItem("ciby-fridgy"));
  await page.getByRole("button", { name: "Copia chiave", exact: true }).click();
  const key = page.getByLabel("La tua chiave API");
  await expect(key).toHaveAttribute("type", "text");
  await expect(key).toBeFocused();
  expect(
    await key.evaluate(
      (el: HTMLInputElement) => el.selectionEnd! - el.selectionStart!,
    ),
  ).toBe("gsk_placeholder_for_copy_test".length);
  await expect(page.getByRole("dialog")).toContainText(
    "Copia automatica non disponibile",
  );
  expect(await page.evaluate(() => localStorage.getItem("ciby-fridgy"))).toBe(
    before,
  );
});
