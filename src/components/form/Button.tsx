type ButtonProps = {
  label?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  className?: string;
  decoration?: string;
  children?: React.ReactNode;
};

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
        return "text-sm hover:bg-green-700 hover:text-white text-green-700 font-bold p-2 rounded-md";
      case "save":
        return "text-xs bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md";
      case "cancel":
        return "text-black bg-white text-xs font-bold py-2 px-4 rounded-md border border-black";
      case "delete":
        return "text-xs bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md";
      case "selection":
        return "text-sm px-2";
      case "custom":
        return "";
      default:
        return "bg-blue-500 hover:bg-blue-700 text-white font-bold rounded px-2";
    }
  };

  return (
    <button
      className={`${setDecoration(decoration)} ${className}`}
      type={type}
      onClick={onClick}
    >
      {children ?? label}
    </button>
  );
};
