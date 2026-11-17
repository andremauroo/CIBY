import { describe, expect, it } from "vitest";
import { parseFridgyEnv } from "./fridgy-local-key.mjs";

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
