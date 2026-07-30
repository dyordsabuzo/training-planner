import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SingleSelect } from "./SingleSelect";

const meta: Meta<typeof SingleSelect> = {
  title: "components/form/SingleSelect",
  component: SingleSelect,
};

export default meta;

const OPTIONS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];

export const Default: StoryObj<typeof SingleSelect> = {
  name: "Basic SingleSelect",
  render: () => {
    const SingleSelectDemo = () => {
      const [selected, setSelected] = useState<string>("Back");
      return (
        <SingleSelect
          label="Muscle group"
          options={OPTIONS}
          selected={selected}
          onChange={setSelected}
          placeholder="Select a muscle group"
        />
      );
    };
    return <SingleSelectDemo />;
  },
};

export const Empty: StoryObj<typeof SingleSelect> = {
  name: "No selection",
  render: () => {
    const SingleSelectDemo = () => {
      const [selected, setSelected] = useState<string>("");
      return (
        <SingleSelect
          label="Muscle group"
          options={OPTIONS}
          selected={selected}
          onChange={setSelected}
          placeholder="Select a muscle group"
        />
      );
    };
    return <SingleSelectDemo />;
  },
};
