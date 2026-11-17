import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Development only: lets Fridgy read the personal key kept in
 * ../secrets/fridgy.local.env (ignored by Git), so it does not have to be
 * pasted again in every browser session.
 *
 * - The plugin runs only with `npm run dev` (`apply: "serve"`): `npm run build`
 *   and the published site never contain the key or this endpoint.
 * - The file is read at each request, so editing it needs no restart.
 * - Only requests from this computer get an answer. A phone on the same
 *   Wi-Fi (Network address) receives 403 and uses the in-app settings.
 */
export const fridgyLocalPath = fileURLToPath(
  new URL("../../secrets/fridgy.local.env", import.meta.url),
);
export const fridgyLocalRoute = "/__ciby/fridgy-local";

export function parseFridgyEnv(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (!match || line.trim().startsWith("#")) continue;
    values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  const provider = (values.FRIDGY_PROVIDER || "groq").trim().toLowerCase();
  const key = (values.FRIDGY_API_KEY || "").trim();
  const model = (values.FRIDGY_MODEL || "").trim();
  if (!key || !["groq", "gemini", "openrouter"].includes(provider)) return null;
  return { provider, key, model };
}

const loopback = (address = "") =>
  /^(127\.|::1$|::ffff:127\.)/.test(address);

export default function fridgyLocalKey() {
  return {
    name: "ciby-fridgy-local-key",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(fridgyLocalRoute, (req, res) => {
        res.setHeader("Cache-Control", "no-store");
        if (!loopback(req.socket.remoteAddress)) {
          res.statusCode = 403;
          res.end();
          return;
        }
        let config = null;
        try {
          config = parseFridgyEnv(readFileSync(fridgyLocalPath, "utf8"));
        } catch {
          config = null;
        }
        if (!config) {
          res.statusCode = 404;
          res.end();
          return;
        }
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(config));
      });
    },
  };
}
