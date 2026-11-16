import { useState } from "react";
import { useSearchParams } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheck } from "@fortawesome/free-solid-svg-icons";
import { Logo } from "../../components/logo/Logo";
import { ThemeToggle } from "../../components/others/ThemeToggle";
import { AuthPanel, AuthPanelTab } from "../auth/AuthPanel";
import { CatalogItem, PublicCatalog } from "./PublicCatalog";
import { PublicPreviewSheet } from "./PublicPreviewSheet";

const heroBullets = [
  "Build multi-week training plans",
  "Track sets, reps and rest between exercises",
  "Pick up your next session in seconds",
];

const FOCUS_WHITE = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

// Signed-out home: the hero (with public plans and sessions) beside the
// login/sign-up panel. Below lg the hero fills the screen and the panel
// slides in over it. `initialPanel`/`open` (the /login and /signup routes)
// or ?panel= pick the starting tab and open the panel straight away.
export const Landing = ({ initialPanel, open = false }: { initialPanel?: AuthPanelTab; open?: boolean }) => {
  const [params] = useSearchParams();
  const param = params.get("panel");
  const fromParam: AuthPanelTab | null = param === "login" || param === "signup" ? param : null;

  const [tab, setTab] = useState<AuthPanelTab>(initialPanel ?? fromParam ?? "login");
  const [isPanelOpen, setIsPanelOpen] = useState(open || !!fromParam);
  const [preview, setPreview] = useState<CatalogItem | null>(null);

  const openPanel = (next: AuthPanelTab) => {
    setTab(next);
    setIsPanelOpen(true);
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col lg:flex-row bg-background-light dark:bg-background-dark">
      <section
        className="relative min-h-screen lg:min-h-0 lg:w-1/2 xl:w-3/5 overflow-x-hidden lg:overflow-y-auto flex flex-col gap-10
          bg-gradient-to-br from-primary-700 to-primary-500 text-white p-6 pb-32 sm:p-10 sm:pb-32 lg:p-12"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Logo
            decorative
            className="absolute -right-24 -bottom-24 w-[32rem] h-[32rem] text-white opacity-10 rotate-12"
          />
        </div>

        <div className="relative flex items-center gap-3">
          <Logo className="w-9 h-9" />
          <span className="text-lg font-semibold">Training Planner</span>
        </div>

        <div className="relative flex flex-col gap-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Plan smarter. Train harder.</h1>
          <p className="text-primary-100 text-lg">
            Everything you need to build, run, and stick to your training program.
          </p>
          <ul className="flex flex-col gap-3 mt-2">
            {heroBullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-3 text-primary-50">
                <FontAwesomeIcon icon={faCheck} className="text-primary-200 shrink-0" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <PublicCatalog onOpen={setPreview} />

        <div
          className="lg:hidden fixed inset-x-0 bottom-0 z-20 flex gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]
            bg-gradient-to-t from-primary-700 via-primary-700/90 to-transparent"
        >
          <button
            type="button"
            onClick={() => openPanel("signup")}
            className={`flex-1 min-h-12 rounded-full bg-white text-primary-700 font-bold shadow-lg ${FOCUS_WHITE}`}
          >
            Get started
          </button>
          <button
            type="button"
            onClick={() => openPanel("login")}
            className={`flex-1 min-h-12 rounded-full border border-white/60 text-white font-bold ${FOCUS_WHITE}`}
          >
            Log in
          </button>
        </div>
      </section>

      <ThemeToggle className="fixed top-4 right-4 z-30 bg-white/95 dark:bg-surface-dark/95 shadow-sm" />

      {/* A sheet over the hero below lg (hidden when closed, so it's out of
          the tab order); always shown beside it from lg up. */}
      <div
        data-testid="auth-sheet"
        className={`fixed inset-0 z-40 overflow-y-auto bg-background-light dark:bg-background-dark
          transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none
          ${isPanelOpen ? "translate-x-0 visible" : "translate-x-full invisible"}
          lg:static lg:z-auto lg:flex-1 lg:translate-x-0 lg:visible lg:transition-none`}
      >
        <div className="min-h-full flex flex-col items-center justify-center gap-4 p-6 sm:p-10">
          <div className="w-full max-w-sm lg:hidden">
            <button
              type="button"
              onClick={() => setIsPanelOpen(false)}
              className="min-h-11 flex items-center gap-2 text-sm font-semibold text-primary rounded
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Back
            </button>
          </div>
          <div className="w-full max-w-sm">
            <AuthPanel tab={tab} onTabChange={setTab} />
          </div>
        </div>
      </div>

      {preview && (
        <PublicPreviewSheet
          item={preview}
          onClose={() => setPreview(null)}
          onSignup={() => {
            setPreview(null);
            openPanel("signup");
          }}
        />
      )}
    </div>
  );
};
