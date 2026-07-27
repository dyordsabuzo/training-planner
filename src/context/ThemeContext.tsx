import { createContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark";

type _Props = {
  children: ReactNode;
};

const STORAGE_KEY = "theme";

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const ThemeContext = createContext({
  theme: "light" as Theme,
  toggleTheme: () => {},
});

export const ThemeContextProvider: React.FC<_Props> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
