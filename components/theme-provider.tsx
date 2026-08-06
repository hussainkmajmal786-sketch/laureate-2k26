"use client";

import * as React from "react";

type Theme = "light" | "dark";

const ThemeCtx = React.createContext<{
  theme: Theme;
  toggle: () => void;
  set: (t: Theme) => void;
}>({ theme: "light", toggle: () => {}, set: () => {} });

export const useTheme = () => React.useContext(ThemeCtx);

/**
 * Theme is applied by an inline script in the document head before paint
 * (see layout.tsx) so there is no flash. This provider only keeps React in
 * sync with the class already on <html>.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>("light");

  React.useEffect(() => {
    const initial = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(initial);
  }, []);

  const set = React.useCallback((t: Theme) => {
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    try {
      localStorage.setItem("laureate-theme", t);
    } catch {
      /* storage unavailable — theme just won't persist */
    }
  }, []);

  const toggle = React.useCallback(() => {
    set(document.documentElement.classList.contains("dark") ? "light" : "dark");
  }, [set]);

  return <ThemeCtx.Provider value={{ theme, toggle, set }}>{children}</ThemeCtx.Provider>;
}

/** Runs before hydration to avoid a light-mode flash on dark-preferring devices. */
export const THEME_SCRIPT = `
(function(){
  try {
    var s = localStorage.getItem('laureate-theme');
    var d = s ? s === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (d) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;
