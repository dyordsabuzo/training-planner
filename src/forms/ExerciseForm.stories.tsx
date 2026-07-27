import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "@storybook/test";
import { ExerciseForm } from "./ExerciseForm";
import dayjs from "dayjs";

const meta: Meta<typeof ExerciseForm> = {
  title: "forms/ExerciseForm",
  component: ExerciseForm,
};

export default meta;
export const EmptyForm: StoryObj<typeof ExerciseForm> = {
  name: "Empty exercise form",
  render: () => {
    const formData = null;
    return (
      <ExerciseForm
        data={formData}
        type={""}
        closeForm={() => {
          console.log("form closed");
        }}
      />
    );
  },
  decorators: [],
};

export const ExistingExercise: StoryObj<typeof ExerciseForm> = {
  name: "Existing exercise",
  render: () => {
    const formData = {};
    return (
      <ExerciseForm
        data={{
          id: "123abc",
          name: "Sample exercise",
          videoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          tags: ["tag1", "tag2"],
          targetRep: "",
          targetSet: "",
          rest: "",
          supersets: ["superset1"],
          alternatives: [],
          isTimeBased: true,
          isWeightExercise: true,
        }}
        type={"edit"}
        closeForm={() => {
          console.log("form closed");
        }}
      />
    );
  },
  decorators: [],
};
