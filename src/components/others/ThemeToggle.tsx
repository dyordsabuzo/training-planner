import { useContext } from "react";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ThemeContext from "../../context/ThemeContext";

type Props = {
  className?: string;
};

export const ThemeToggle = ({ className }: Props) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className={`
        min-h-11 min-w-11 flex items-center justify-center rounded-full
        text-secondary dark:text-text-dark
        hover:bg-secondary-100 dark:hover:bg-gray-700
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
        ${className ?? ""}`}
    >
      <FontAwesomeIcon icon={isDark ? faSun : faMoon} size="lg" />
    </button>
  );
};
