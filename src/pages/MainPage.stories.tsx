import type { Meta, StoryObj } from "@storybook/react";
import { MainPage } from "./MainPage";
// import {
//   reactRouterParameters,
//   withRouter,
// } from "storybook-addon-remix-react-router";

const meta: Meta<typeof MainPage> = {
  title: "pages/main/MainPage",
  component: MainPage,
  // decorators: [withRouter],
};

export default meta;
export const EmptyForm: StoryObj<typeof MainPage> = {
  name: "Default main page",
  render: () => {
    const formData = null;
    return <MainPage />;
  },
};
