import type { Meta, StoryObj, StoryFn } from "@storybook/react";
import { PasswordReset } from "./PasswordReset";
import { MemoryRouter } from "react-router";
import { withMockAuthContext } from "../../management/__mock__/MockContext";
import { verifyPasswordResetCode } from "firebase/auth";

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
export const LoadingForm: StoryObj<typeof PasswordReset> = {
  name: "Loading password reset",
  render: () => {
    return <PasswordReset />;
  },
  decorators: [
    withRouter,
    withMockAuthContext({
      isLoading: true,
      verifyResetCode: (code: string) => {
        console.log(code);
      },
    }),
  ],
};

export const EmptyForm: StoryObj<typeof PasswordReset> = {
  name: "Invalid password reset",
  render: () => {
    return <PasswordReset />;
  },
  decorators: [withRouter],
};

export const ValidPasswordReset: StoryObj<typeof PasswordReset> = {
  name: "Valid password reset",
  render: () => {
    return <PasswordReset />;
  },
  decorators: [
    withRouter,
    withMockAuthContext({
      isLoading: false,
      data: { email: "123" },
      verifyResetCode: (code: string) => {
        console.log(code);
      },
    }),
  ],
};
