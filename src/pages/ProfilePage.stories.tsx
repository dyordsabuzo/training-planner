import type { Meta, StoryObj } from "@storybook/react";
import ProfilePage from "./ProfilePage";
import { withMockAuthContext } from "../management/__mock__/MockContext";

const meta: Meta<typeof ProfilePage> = {
  title: "pages/components/ProfilePage",
  component: ProfilePage,
};

export default meta;

export const NoNameSet: StoryObj<typeof ProfilePage> = {
  name: "No name set yet",
  decorators: [
    withMockAuthContext({
      user: { email: "sam@example.com" },
      userPermission: { role: "user", plans: [] },
      updateProfile: (data: any) => console.log("updateProfile", data),
    }),
  ],
};

export const WithName: StoryObj<typeof ProfilePage> = {
  name: "Name already set",
  decorators: [
    withMockAuthContext({
      user: { email: "sam@example.com" },
      userPermission: {
        role: "user",
        plans: [],
        firstName: "Sam",
        lastName: "Trainee",
      },
      updateProfile: (data: any) => console.log("updateProfile", data),
    }),
  ],
};
