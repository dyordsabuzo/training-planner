import type { Meta, StoryObj, StoryFn } from "@storybook/react";
import { Signup } from "./Signup";
import { MemoryRouter } from "react-router";

const meta: Meta<typeof Signup> = {
  title: "pages/auth/Signup",
  component: Signup,
};

const withRouter = (Story: StoryFn) => (
  <MemoryRouter>
    <Story />
  </MemoryRouter>
);

export default meta;
export const EmptyForm: StoryObj<typeof Signup> = {
  name: "Signup",
  render: () => {
    return <Signup />;
  },
  decorators: [withRouter],
};
