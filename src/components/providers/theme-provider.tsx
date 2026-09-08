"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem("theme") as Theme) || "system";
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(getSystemTheme);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function handleSystemChange(e: MediaQueryListEvent | MediaQueryList) {
      setSystemTheme(e.matches ? "dark" : "light");
    }

    handleSystemChange(mediaQuery);
    mediaQuery.addEventListener("change", handleSystemChange);

    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, []);

  useEffect(() => {
    const resolved = theme === "system" ? systemTheme : theme;
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [theme, systemTheme]);

  const resolvedTheme = useMemo(
    () => (theme === "system" ? systemTheme : theme) as "light" | "dark",
    [theme, systemTheme]
  );

  function handleSetTheme(newTheme: Theme) {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}