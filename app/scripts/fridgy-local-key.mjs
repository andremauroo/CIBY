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

const loopback = (address = "") => /^(127\.|::1$|::ffff:127\.)/.test(address);
/**
 * A tunnel or proxy (ngrok, cloudflared…) also connects from 127.0.0.1, so the
 * socket address alone is not enough: the request must name a local host and
 * carry no forwarding headers.
 */
export function isLocalRequest(req) {
  const host = String(req.headers.host || "")
    .replace(/:\d+$/, "")
    .toLowerCase();
  const forwarded = [
    "x-forwarded-for",
    "x-forwarded-host",
    "x-real-ip",
    "forwarded",
    "cf-connecting-ip",
  ].some((name) => req.headers[name] !== undefined);
  return (
    loopback(req.socket.remoteAddress) &&
    ["localhost", "127.0.0.1", "[::1]"].includes(host) &&
    !forwarded
  );
}

export default function fridgyLocalKey() {
  return {
    name: "ciby-fridgy-local-key",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(fridgyLocalRoute, (req, res) => {
        res.setHeader("Cache-Control", "no-store");
        if (!isLocalRequest(req)) {
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
