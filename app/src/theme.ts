import { useEffect, useState } from "react";
export type Theme = "system" | "light" | "dark";
export function loadTheme(): Theme {
  try {
    const value = localStorage.getItem("ciby-theme");
    return value === "dark" || value === "light" ? value : "system";
  } catch {
    return "system";
  }
}
export function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#090d14" : "#17325f");
}
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(loadTheme);
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem("ciby-theme", theme);
    } catch {
      /* Session preference still works. */
    }
    const media = matchMedia("(prefers-color-scheme: dark)");
    const update = () => applyTheme(theme);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [theme]);
  return [theme, setTheme] as const;
}
