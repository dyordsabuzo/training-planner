type Props = {
  label: string;
  value: string;
  unit: string;
};

export const Widget = ({ label, value, unit }: Props) => {
  return (
    <div className={`grid place-content-center`}>
      <div className={`text-xs uppercase font-extralight place-self-center`}>
        {label}
      </div>
      <div className={`flex gap-1 text-2xl leading-none`}>
        <span>{value}</span>
        <span>{unit}</span>
      </div>
    </div>
  );
};
