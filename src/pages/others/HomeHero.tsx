import { ReactNode } from "react";

// Top of Home: a date eyebrow and greeting over today's action and the stats.
export const HomeHero = ({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) => (
  <div
    className="flex flex-col gap-4 rounded-2xl p-5 text-white bg-gradient-to-br from-primary to-primary-400
      shadow-lg shadow-primary/30 motion-safe:animate-fade-up"
  >
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-bold uppercase tracking-wider text-white/70">{eyebrow}</span>
      <h1 className="text-xl font-bold break-words">{title}</h1>
    </div>
    {children}
  </div>
);

// Numbers are large; words (a mood) stay small so the longest fits a phone tile.
export const HeroStats = ({ stats }: { stats: { label: string; value: string | number }[] }) => (
  <dl className="grid grid-cols-4 gap-1.5">
    {stats.map(({ label, value }) => (
      <div
        key={label}
        className="flex flex-col-reverse justify-end items-center gap-1 min-w-0 rounded-xl bg-white/10 px-0.5 py-3 text-center"
      >
        <dt className="text-[0.65rem] font-bold uppercase leading-tight text-white/70">{label}</dt>
        <dd className={`flex items-center h-6 font-bold leading-none ${typeof value === "number" ? "text-2xl" : "text-[0.7rem]"}`}>
          {value}
        </dd>
      </div>
    ))}
  </dl>
);
