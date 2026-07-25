type Variant = "primary" | "success" | "warning" | "danger" | "neutral";

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
};

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-100",
  success: "bg-success-100 text-success-700 dark:bg-success-700/30 dark:text-success-500",
  warning: "bg-warning-100 text-warning-700 dark:bg-warning-700/30 dark:text-warning-500",
  danger: "bg-danger-100 text-danger-700 dark:bg-danger-700/30 dark:text-danger-500",
  neutral: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
};

export const Badge = ({ children, variant = "neutral", className }: Props) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
        ${variantClasses[variant]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
};
