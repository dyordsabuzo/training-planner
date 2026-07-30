import type { Meta, StoryObj } from "@storybook/react";
import { SupersetForm } from "./SupersetForm";
import { withMockSourceDataContext } from "../management/__mock__/MockContext";

const meta: Meta<typeof SupersetForm> = {
  title: "forms/SupersetForm",
  component: SupersetForm,
};

export default meta;
export const EmptyForm: StoryObj<typeof SupersetForm> = {
  name: "Empty superset form",
  render: () => {
    const formData = null;
    return (
      <SupersetForm
        data={formData}
        entryType={""}
        closeForm={() => {
          console.log("close form");
        }}
      />
    );
  },
  decorators: [],
};

export const ExistingSuperset: StoryObj<typeof SupersetForm> = {
  name: "Existing superset",
  render: () => {
    return (
      <SupersetForm
        data={{
          id: "123abc",
          name: "Leg day",
          sessions: ["Session A"],
          exercises: ["Squat", "Lunge"],
          tags: ["legs"],
          rest: "90",
          targetRep: "12",
          targetSet: "3",
          targetTime: "",
          type: "Rep-based",
        }}
        entryType={"edit"}
        closeForm={() => {
          console.log("close form");
        }}
      />
    );
  },
  decorators: [
    withMockSourceDataContext({
      sourceData: {
        exercises: {
          Squat: { name: "Squat" },
          Lunge: { name: "Lunge" },
          "Leg Press": { name: "Leg Press" },
        },
        sessions: {
          "Session A": { name: "Session A" },
          "Session B": { name: "Session B" },
        },
      },
      editSuperset: () => {},
      deleteSuperset: () => {},
    }),
  ],
};
