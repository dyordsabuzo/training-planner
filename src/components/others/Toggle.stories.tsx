import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Toggle } from "./Toggle";

const meta: Meta<typeof Toggle> = {
  title: "components/others/Toggle",
  component: Toggle,
};

export default meta;

export const Default: StoryObj<typeof Toggle> = {
  name: "Toggle",
  render: () => {
    const ToggleDemo = () => {
      const [value, setValue] = useState(false);
      return <Toggle label="Enable reminders" value={value} toggle={setValue} />;
    };
    return <ToggleDemo />;
  },
  decorators: [],
};
