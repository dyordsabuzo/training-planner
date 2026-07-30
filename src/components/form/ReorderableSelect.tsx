import { useState } from "react";
import { SingleSelect } from "./SingleSelect";
import { ReorderableList } from "./ReorderableList";
import { Button } from "./Button";

type Props = {
  label?: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  addLabel?: string;
  className?: string;
};

// Ordered counterpart to MultiSelect: pick one value at a time from a
// SingleSelect (already-selected values excluded), append it via Add, then
// reorder or remove entries below. Use this instead of MultiSelect whenever
// the sequence of the selected items is meaningful (e.g. exercises within a
// superset, sessions within a plan week) rather than just an unordered set.
export const ReorderableSelect = ({
  label,
  options,
  selected,
  onChange,
  placeholder = "Select an option to add",
  emptyMessage = "No items selected",
  addLabel = "Add",
  className,
}: Props) => {
  const [pendingValue, setPendingValue] = useState("");

  const availableOptions = options.filter((option) => !selected.includes(option));

  const handleAdd = () => {
    if (!pendingValue) {
      return;
    }
    onChange([...selected, pendingValue]);
    setPendingValue("");
  };

  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <div className="flex items-end gap-2">
        <SingleSelect
          label={label}
          selected={pendingValue}
          options={availableOptions}
          onChange={setPendingValue}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button label={addLabel} decoration="save" onClick={handleAdd} disabled={!pendingValue} />
      </div>
      <ReorderableList
        items={selected}
        onReorder={onChange}
        onRemove={(item) => onChange(selected.filter((s) => s !== item))}
        emptyMessage={emptyMessage}
      />
    </div>
  );
};
