import type { Meta, StoryObj } from "@storybook/react";
import App from "./App";

const meta: Meta<typeof App> = {
  title: "pages/main/App",
  component: App,
};

export default meta;
export const EmptyForm: StoryObj<typeof App> = {
  name: "Default App page",
  render: () => {
    return <App />;
  },
};
