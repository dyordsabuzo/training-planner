import type { Meta, StoryObj } from "@storybook/react";
import AdminPage from "./AdminPage";
import {
  withMockUserManagementContext,
  withMockSourceDataContext,
  withMockAuthContext,
} from "../management/__mock__/MockContext";

const meta: Meta<typeof AdminPage> = {
  title: "pages/components/AdminPage",
  component: AdminPage,
};

export default meta;

export const Default: StoryObj<typeof AdminPage> = {
  name: "Admin page with users",
  decorators: [
    withMockUserManagementContext({
      users: [
        {
          id: "uid-admin-1",
          email: "admin@example.com",
          displayName: "Ada Admin",
          role: "admin",
          plans: [],
        },
        {
          id: "uid-user-1",
          email: "sam@example.com",
          displayName: "Sam Trainee",
          role: "user",
          plans: ["plan-doc-id-1"],
        },
      ],
      fetchUsers: () => {},
      saveUser: () => {},
    }),
    withMockSourceDataContext({
      sourceData: { plans: { "Strength Plan": { name: "Strength Plan", id: "plan-doc-id-1" } } },
      initialise: () => {},
    }),
    withMockAuthContext({ getUid: () => "uid-admin-1" }),
  ],
};
