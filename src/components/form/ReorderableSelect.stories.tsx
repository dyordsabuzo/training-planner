import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ReorderableSelect } from "./ReorderableSelect";

const meta: Meta<typeof ReorderableSelect> = {
  title: "components/form/ReorderableSelect",
  component: ReorderableSelect,
};

export default meta;

const OPTIONS = ["Squat", "Bench Press", "Deadlift", "Overhead Press", "Row"];

export const Default: StoryObj<typeof ReorderableSelect> = {
  name: "Basic ReorderableSelect",
  render: () => {
    const ReorderableSelectDemo = () => {
      const [selected, setSelected] = useState<string[]>(["Squat", "Bench Press"]);
      return (
        <ReorderableSelect
          label="Exercises"
          options={OPTIONS}
          selected={selected}
          onChange={setSelected}
          placeholder="Select an exercise to add"
        />
      );
    };
    return <ReorderableSelectDemo />;
  },
};

export const Empty: StoryObj<typeof ReorderableSelect> = {
  name: "No items selected",
  render: () => {
    const ReorderableSelectDemo = () => {
      const [selected, setSelected] = useState<string[]>([]);
      return (
        <ReorderableSelect
          label="Exercises"
          options={OPTIONS}
          selected={selected}
          onChange={setSelected}
          emptyMessage="No exercises added yet"
        />
      );
    };
    return <ReorderableSelectDemo />;
  },
};

export const AllOptionsSelected: StoryObj<typeof ReorderableSelect> = {
  name: "All options already selected",
  render: () => {
    const ReorderableSelectDemo = () => {
      const [selected, setSelected] = useState<string[]>(OPTIONS);
      return (
        <ReorderableSelect
          label="Exercises"
          options={OPTIONS}
          selected={selected}
          onChange={setSelected}
        />
      );
    };
    return <ReorderableSelectDemo />;
  },
};
