"use client";

import * as React from "react";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>("system");
  const [isDark, setIsDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("omni_theme") as Theme | null;
    if (saved) {
      setThemeState(saved);
    }
  }, []);

  React.useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDarkApplied = theme === "dark" || (theme === "system" && systemIsDark);

    if (isDarkApplied) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    setIsDark(isDarkApplied);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("omni_theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    return {
      theme: "light" as Theme,
      setTheme: () => {},
      isDark: false,
    };
  }
  return context;
}
