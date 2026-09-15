import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { storage } from "../lib/storage";

export type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeToDOM(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  } else {
    document.documentElement.classList.add("light");
    document.documentElement.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Read saved theme from localStorage strictly ONCE during initial mount
  const [theme, setThemeState] = useState<Theme>(() => storage.getTheme());

  // Apply theme to DOM and save to localStorage exactly once whenever theme changes
  useEffect(() => {
    applyThemeToDOM(theme);
    storage.saveTheme(theme);
  }, [theme]);

  // Stable callbacks with empty dependencies
  const setTheme = useCallback((newTheme: Theme) => {
    if (newTheme === "dark" || newTheme === "light") {
      setThemeState((prev) => (prev === newTheme ? prev : newTheme));
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  // Memoize context value so consumer components only re-render when theme changes
  const contextValue = useMemo<ThemeContextType>(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
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
