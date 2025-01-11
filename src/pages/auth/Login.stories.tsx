import type { Meta, StoryObj, StoryFn } from "@storybook/react";
import { Login } from "./Login";
import { MemoryRouter } from "react-router";

const meta: Meta<typeof Login> = {
  title: "pages/auth/Login",
  component: Login,
};

const withRouter = (Story: StoryFn) => (
  <MemoryRouter>
    <Story />
  </MemoryRouter>
);

export default meta;
export const EmptyForm: StoryObj<typeof Login> = {
  name: "Login",
  render: () => {
    return <Login />;
  },
  decorators: [withRouter],
};
