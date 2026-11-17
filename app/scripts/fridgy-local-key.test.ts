import { describe, expect, it } from "vitest";
import { isLocalRequest, parseFridgyEnv } from "./fridgy-local-key.mjs";

describe("File locale della chiave Fridgy", () => {
  it("legge servizio, chiave e modello facoltativo", () => {
    expect(
      parseFridgyEnv(
        "# commento\nFRIDGY_PROVIDER=Groq\nFRIDGY_API_KEY = 'gsk_abc' \nFRIDGY_MODEL=\n",
      ),
    ).toEqual({ provider: "groq", key: "gsk_abc", model: "" });
    expect(parseFridgyEnv("FRIDGY_API_KEY=gsk_x")).toMatchObject({
      provider: "groq",
    });
    expect(
      parseFridgyEnv(
        'export FRIDGY_PROVIDER=gemini\nFRIDGY_API_KEY="AIza1"\nFRIDGY_MODEL=gemini-2.5-flash',
      ),
    ).toEqual({ provider: "gemini", key: "AIza1", model: "gemini-2.5-flash" });
  });
  it("ignora file senza chiave o con un servizio sconosciuto", () => {
    expect(parseFridgyEnv("FRIDGY_PROVIDER=groq\nFRIDGY_API_KEY=")).toBeNull();
    expect(parseFridgyEnv("#FRIDGY_API_KEY=gsk_x")).toBeNull();
    expect(
      parseFridgyEnv("FRIDGY_PROVIDER=altro\nFRIDGY_API_KEY=k"),
    ).toBeNull();
  });
});

describe("Accesso al file della chiave", () => {
  const req = (
    remoteAddress: string,
    headers: Record<string, string> = { host: "localhost:5173" },
  ) => ({ headers, socket: { remoteAddress } });
  it("risponde solo a richieste locali dirette", () => {
    expect(isLocalRequest(req("127.0.0.1"))).toBe(true);
    expect(isLocalRequest(req("::1", { host: "127.0.0.1:5173" }))).toBe(true);
    expect(isLocalRequest(req("192.168.1.20"))).toBe(false);
    // A tunnel connects from loopback but names another host or forwards.
    expect(
      isLocalRequest(req("127.0.0.1", { host: "abc.trycloudflare.com" })),
    ).toBe(false);
    expect(
      isLocalRequest(
        req("127.0.0.1", {
          host: "localhost:5173",
          "x-forwarded-for": "1.2.3.4",
        }),
      ),
    ).toBe(false);
  });
});
