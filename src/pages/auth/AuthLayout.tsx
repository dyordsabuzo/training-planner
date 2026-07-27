import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Logo } from "../../components/logo/Logo";
import { ThemeToggle } from "../../components/others/ThemeToggle";

const heroBullets = [
  "Build multi-week training plans",
  "Track sets, reps and rest between exercises",
  "Pick up your next session in seconds",
];

type Props = {
  children: React.ReactNode;
  heroHeadline: string;
  heroSubtext: string;
};

export const AuthLayout = ({ children, heroHeadline, heroSubtext }: Props) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background-light dark:bg-background-dark">
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-x-hidden overflow-y-auto flex-col justify-between gap-8
        bg-gradient-to-br from-primary-700 to-primary-500 text-white p-12">
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
          <h1 className="text-4xl font-bold leading-tight">{heroHeadline}</h1>
          <p className="text-primary-100 text-lg">{heroSubtext}</p>
          <ul className="flex flex-col gap-3 mt-2">
            {heroBullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-3 text-primary-50">
                <FontAwesomeIcon icon={faCheck} className="text-primary-200 shrink-0" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ThemeToggle className="fixed top-4 right-4 z-30 bg-white/80 dark:bg-surface-dark/80 backdrop-blur shadow-sm" />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
};
