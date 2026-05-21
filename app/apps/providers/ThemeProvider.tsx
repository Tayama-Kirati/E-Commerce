"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeCtx {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const Ctx = createContext<ThemeCtx>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  const apply = (t: Theme) => {
    setThemeState(t);
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("peanut-theme", t);
  };

  useEffect(() => {
    const saved = localStorage.getItem("peanut-theme") as Theme | null;
    const sysPref: Theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    apply(saved ?? sysPref);
  }, []);

  return (
    <Ctx.Provider
      value={{
        theme,
        toggleTheme: () => apply(theme === "dark" ? "light" : "dark"),
        setTheme: apply,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  return useContext(Ctx);
}
