import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fridgyLocalKey from "./scripts/fridgy-local-key.mjs";
export default defineConfig({
  base: "./",
  plugins: [react(), fridgyLocalKey()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
});
