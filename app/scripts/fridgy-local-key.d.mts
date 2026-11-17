import type { Plugin } from "vite";
export const fridgyLocalPath: string;
export const fridgyLocalRoute: string;
export function parseFridgyEnv(
  text: string,
): { provider: string; key: string; model: string } | null;
export default function fridgyLocalKey(): Plugin;
