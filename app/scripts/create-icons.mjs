import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
const browser = await chromium.launch();
const page = await browser.newPage();
const svg = readFileSync("public/icon.svg", "utf8");
for (const size of [192, 512]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>body{margin:0}svg{width:${size}px;height:${size}px}</style>${svg}`,
  );
  await page.screenshot({
    path: `public/icon-${size}.png`,
    omitBackground: true,
  });
}
await browser.close();
