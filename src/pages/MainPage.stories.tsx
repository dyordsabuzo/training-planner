import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import { MainPage } from "./MainPage";
import { withMockAuthContext } from "../management/__mock__/MockContext";

const meta: Meta<typeof MainPage> = {
  title: "pages/main/MainPage",
  component: MainPage,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

export const EmptyForm: StoryObj<typeof MainPage> = {
  name: "Default main page",
  render: () => {
    return <MainPage />;
  },
  decorators: [
    withMockAuthContext({
      user: { email: "member@trainingplanner.com" },
      userPermission: { role: "user", plans: [] },
    }),
  ],
};

export const AsAdmin: StoryObj<typeof MainPage> = {
  name: "Main page (admin)",
  render: () => {
    return <MainPage />;
  },
  decorators: [
    withMockAuthContext({
      user: { email: "admin@trainingplanner.com" },
      userPermission: { role: "admin", plans: [] },
    }),
  ],
};
