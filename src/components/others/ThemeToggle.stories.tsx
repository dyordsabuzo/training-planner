import type { Meta, StoryObj } from "@storybook/react";
import { ThemeToggle } from "./ThemeToggle";

const meta: Meta<typeof ThemeToggle> = {
  title: "components/others/ThemeToggle",
  component: ThemeToggle,
};

export default meta;

export const Default: StoryObj<typeof ThemeToggle> = {
  name: "Theme toggle",
  render: () => {
    return <ThemeToggle />;
  },
  decorators: [],
};
