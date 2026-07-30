import type { Meta, StoryObj } from "@storybook/react";
import { AddUserForm } from "./AddUserForm";
import { withMockSourceDataContext } from "../management/__mock__/MockContext";

const meta: Meta<typeof AddUserForm> = {
  title: "forms/AddUserForm",
  component: AddUserForm,
};

export default meta;

const mockPlans = {
  "Strength Plan": { name: "Strength Plan", id: "plan-doc-id-1" },
  "Mobility Plan": { name: "Mobility Plan", id: "plan-doc-id-2" },
};

export const Default: StoryObj<typeof AddUserForm> = {
  name: "Add a missing user",
  render: () => (
    <AddUserForm
      existingIds={["uid-admin-1", "uid-user-1"]}
      closeForm={() => console.log("close form")}
      onSave={(data) => console.log("save", data)}
    />
  ),
  decorators: [withMockSourceDataContext({ sourceData: { plans: mockPlans } })],
};
