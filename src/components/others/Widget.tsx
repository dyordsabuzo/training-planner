import { useEffect, useRef, useState } from "react";
import { Input } from "../form/Input";

type Props = {
  label: string;
  value: string;
  unit: string;
  onValueChange?: (v: any) => void;
};

export const Widget = ({
  label,
  value,
  unit,
  onValueChange = () => {},
}: Props) => {
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const ref = useRef<HTMLInputElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setIsEdit(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const clickHandler = () => {
    setIsEdit(true);
  };

  return (
    <div className="grid place-content-center text-text-light dark:text-text-dark">
      <div className="text-xs uppercase font-extralight place-self-center">
        {label}
      </div>
      <div className="flex gap-1 text-2xl leading-none items-center">
        {!isEdit && (
          <button
            type="button"
            onClick={clickHandler}
            aria-label={`Edit ${label}`}
            className="min-h-11 px-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {value}
          </button>
        )}
        {isEdit && (
          <Input
            ref={ref}
            className={`!w-14`}
            value={value}
            changeValue={(val: string) => {
              onValueChange(val);
            }}
          />
        )}
        <span>{unit}</span>
      </div>
    </div>
  );
};
