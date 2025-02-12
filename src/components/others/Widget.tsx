import { useEffect, useRef, useState } from "react";
import { Button } from "../form/Button";
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
    <div className={`grid place-content-center`}>
      <div className={`text-xs uppercase font-extralight place-self-center`}>
        {label}
      </div>
      <div
        className={`flex gap-1 text-2xl leading-none items-center`}
        onClick={clickHandler}
      >
        {!isEdit && <span>{value}</span>}
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
