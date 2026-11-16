import { chipClassName } from "../others/HeroTile";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

export type AuthPanelTab = "login" | "signup";

const TABS: { id: AuthPanelTab; label: string }[] = [
  { id: "login", label: "Log in" },
  { id: "signup", label: "Sign up" },
];

// Login and sign-up forms behind a segmented toggle.
export const AuthPanel = ({ tab, onTabChange }: { tab: AuthPanelTab; onTabChange: (tab: AuthPanelTab) => void }) => (
  <div className="flex flex-col gap-4 w-full">
    <div role="group" aria-label="Log in or sign up" className="flex gap-2 p-1 rounded-full bg-gray-100 dark:bg-gray-800">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={tab === id}
          onClick={() => onTabChange(id)}
          className={`${chipClassName(tab === id)} flex-1`}
        >
          {label}
        </button>
      ))}
    </div>
    {tab === "login" ? (
      <LoginForm onSwitch={() => onTabChange("signup")} />
    ) : (
      <SignupForm onSwitch={() => onTabChange("login")} />
    )}
  </div>
);
