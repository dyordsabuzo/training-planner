import type { Meta, StoryObj, StoryFn } from "@storybook/react";
import { PasswordReset } from "./PasswordReset";
import { MemoryRouter } from "react-router";

const meta: Meta<typeof PasswordReset> = {
  title: "pages/auth/PasswordReset",
  component: PasswordReset,
};

const withRouter = (Story: StoryFn) => (
  <MemoryRouter>
    <Story />
  </MemoryRouter>
);

export default meta;
export const EmptyForm: StoryObj<typeof PasswordReset> = {
  name: "PasswordReset",
  render: () => {
    return <PasswordReset />;
  },
  decorators: [withRouter],
};
