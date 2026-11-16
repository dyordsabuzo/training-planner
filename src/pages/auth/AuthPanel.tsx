import { FOCUS } from "../others/AgendaRow";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

export type AuthPanelTab = "login" | "signup";

const TABS: { id: AuthPanelTab; label: string }[] = [
  { id: "login", label: "Log in" },
  { id: "signup", label: "Sign up" },
];

// Login and sign-up forms behind a segmented toggle, in one card.
export const AuthPanel = ({ tab, onTabChange }: { tab: AuthPanelTab; onTabChange: (tab: AuthPanelTab) => void }) => (
  <div
    className="flex flex-col gap-6 w-full rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700
      p-6 sm:p-8 bg-white dark:bg-surface-dark"
  >
    <div role="group" aria-label="Log in or sign up" className="flex gap-1 p-1 rounded-full bg-gray-100 dark:bg-gray-800">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={tab === id}
          onClick={() => onTabChange(id)}
          className={`flex-1 min-h-11 rounded-full text-sm font-bold transition-colors ${FOCUS} ${
            tab === id
              ? "bg-white dark:bg-surface-dark text-primary shadow-sm"
              : "text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
    {tab === "login" ? <LoginForm /> : <SignupForm />}
  </div>
);
