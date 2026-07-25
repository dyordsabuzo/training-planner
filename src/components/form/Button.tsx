type ButtonProps = {
  label?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  className?: string;
  decoration?: string;
  children?: React.ReactNode;
};

const baseClasses =
  "min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-dark";

export const Button = ({
  label,
  onClick,
  className,
  type = "button",
  decoration = "basic",
  children,
}: ButtonProps) => {
  const setDecoration = (d: string) => {
    switch (d) {
      case "text-only":
        return "text-sm px-2 hover:bg-success-50 dark:hover:bg-success-700/20 text-success-700 dark:text-success-500 font-bold rounded-md";
      case "save":
        return "text-xs px-4 bg-primary hover:bg-primary-700 text-white font-bold rounded-md";
      case "cancel":
        return "text-xs px-4 text-text-light dark:text-text-dark bg-white dark:bg-surface-dark font-bold rounded-md border border-gray-300 dark:border-gray-600";
      case "delete":
        return "text-xs px-4 bg-danger hover:bg-danger-700 text-white font-bold rounded-md";
      case "selection":
        return "text-sm px-3";
      case "custom":
        return "";
      default:
        return "px-2 bg-primary hover:bg-primary-700 text-white font-bold rounded";
    }
  };

  return (
    <button
      className={`${baseClasses} ${setDecoration(decoration)} ${className ?? ""}`}
      type={type}
      onClick={onClick}
    >
      {children ?? label}
    </button>
  );
};
