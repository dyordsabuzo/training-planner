type Props = {
  children: React.ReactNode;
  className?: string;
};

export const Card = ({ children, className }: Props) => {
  return (
    <div
      className={`rounded-lg shadow-md bg-white dark:bg-surface-dark
        text-text-light dark:text-text-dark p-4 ${className ?? ""}`}
    >
      {children}
    </div>
  );
};
