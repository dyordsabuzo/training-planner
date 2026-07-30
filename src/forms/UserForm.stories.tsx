import type { Meta, StoryObj } from "@storybook/react";
import { UserForm } from "./UserForm";
import {
  withMockSourceDataContext,
  withMockAuthContext,
} from "../management/__mock__/MockContext";

const meta: Meta<typeof UserForm> = {
  title: "forms/UserForm",
  component: UserForm,
};

export default meta;

// The plan's own `id` is the real Firestore doc ID, distinct from its name
// key — a granted-plan array stores that id, so this demonstrates the
// id→name resolution rather than a coincidental name match.
const mockPlans = {
  "Strength Plan": { name: "Strength Plan", id: "plan-doc-id-1" },
  "Mobility Plan": { name: "Mobility Plan", id: "plan-doc-id-2" },
};

export const RegularUser: StoryObj<typeof UserForm> = {
  name: "Editing another user",
  render: () => (
    <UserForm
      data={{
        id: "uid-user-1",
        email: "sam@example.com",
        displayName: "Sam Trainee",
        role: "user",
        plans: ["plan-doc-id-1"],
      }}
      closeForm={() => console.log("close form")}
      onSave={(data) => console.log("save", data)}
    />
  ),
  decorators: [
    withMockSourceDataContext({ sourceData: { plans: mockPlans } }),
    withMockAuthContext({ getUid: () => "uid-admin-1" }),
  ],
};

export const BackfillMissingData: StoryObj<typeof UserForm> = {
  name: "Backfilling a doc with only role/plans",
  render: () => (
    <UserForm
      data={{
        id: "uid-user-2",
        role: "user",
        plans: [],
      }}
      closeForm={() => console.log("close form")}
      onSave={(data) => console.log("save", data)}
    />
  ),
  decorators: [
    withMockSourceDataContext({ sourceData: { plans: mockPlans } }),
    withMockAuthContext({ getUid: () => "uid-admin-1" }),
  ],
};

export const EditingSelf: StoryObj<typeof UserForm> = {
  name: "Editing your own account (role locked)",
  render: () => (
    <UserForm
      data={{
        id: "uid-admin-1",
        email: "admin@example.com",
        displayName: "Ada Admin",
        role: "admin",
        plans: [],
      }}
      closeForm={() => console.log("close form")}
      onSave={(data) => console.log("save", data)}
    />
  ),
  decorators: [
    withMockSourceDataContext({ sourceData: { plans: mockPlans } }),
    withMockAuthContext({ getUid: () => "uid-admin-1" }),
  ],
};
