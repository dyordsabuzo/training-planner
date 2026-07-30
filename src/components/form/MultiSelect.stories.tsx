import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MultiSelect } from "./MultiSelect";

const meta: Meta<typeof MultiSelect> = {
  title: "components/form/MultiSelect",
  component: MultiSelect,
};

export default meta;

const OPTIONS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];

export const Default: StoryObj<typeof MultiSelect> = {
  name: "Basic MultiSelect",
  render: () => {
    const MultiSelectDemo = () => {
      const [selected, setSelected] = useState<string[]>(["Back"]);
      return (
        <MultiSelect
          label="Muscle groups"
          options={OPTIONS}
          selected={selected}
          onChange={setSelected}
          placeholder="Select muscle groups"
        />
      );
    };
    return <MultiSelectDemo />;
  },
};

export const Empty: StoryObj<typeof MultiSelect> = {
  name: "No selection",
  render: () => {
    const MultiSelectDemo = () => {
      const [selected, setSelected] = useState<string[]>([]);
      return (
        <MultiSelect
          label="Muscle groups"
          options={OPTIONS}
          selected={selected}
          onChange={setSelected}
          placeholder="Select muscle groups"
        />
      );
    };
    return <MultiSelectDemo />;
  },
};

export const ManySelected: StoryObj<typeof MultiSelect> = {
  name: "Many selected",
  render: () => {
    const MultiSelectDemo = () => {
      const [selected, setSelected] = useState<string[]>(OPTIONS.slice(0, 5));
      return (
        <MultiSelect
          label="Muscle groups"
          options={OPTIONS}
          selected={selected}
          onChange={setSelected}
          placeholder="Select muscle groups"
        />
      );
    };
    return <MultiSelectDemo />;
  },
};
