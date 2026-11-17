import type { Plugin } from "vite";
export const fridgyLocalPath: string;
export const fridgyLocalRoute: string;
export function parseFridgyEnv(
  text: string,
): { provider: string; key: string; model: string } | null;
export function isLocalRequest(req: {
  headers: Record<string, string | string[] | undefined>;
  socket: { remoteAddress?: string };
}): boolean;
export default function fridgyLocalKey(): Plugin;
