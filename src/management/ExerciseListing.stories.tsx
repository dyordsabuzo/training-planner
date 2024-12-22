import type { Meta, StoryObj } from "@storybook/react";
import { ExerciseListing } from "./ExerciseListing";
import { withMockSourceDataContext } from "./__mock__/MockContext";

const meta: Meta<typeof ExerciseListing> = {
  title: "management/ExerciseListing",
  component: ExerciseListing,
};

export default meta;
export const Default: StoryObj<typeof ExerciseListing> = {
  name: "Empty exercise listing",
  render: () => {
    return <ExerciseListing />;
  },
  decorators: [
    withMockSourceDataContext({
      sourceData: {},
    }),
  ],
};

export const WithExerciseList: StoryObj<typeof ExerciseListing> = {
  name: "With exercise in listing",
  render: () => {
    return <ExerciseListing />;
  },
  decorators: [
    withMockSourceDataContext({
      sourceData: {
        exercises: {
          "e 1": {
            name: "e 1",
            supersets: ["abc", "def"],
            tags: ["tag1", "tag2"],
          },
        },
      },
    }),
  ],
};
