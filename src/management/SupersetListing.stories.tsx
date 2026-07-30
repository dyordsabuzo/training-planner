import type { Meta, StoryObj } from "@storybook/react";
import { SupersetListing } from "./SupersetListing";
import { withMockSourceDataContext } from "./__mock__/MockContext";

const meta: Meta<typeof SupersetListing> = {
  title: "management/SupersetListing",
  component: SupersetListing,
};

export default meta;
export const EmptyForm: StoryObj<typeof SupersetListing> = {
  name: "Empty superset listing",
  render: () => {
    return <SupersetListing />;
  },
  decorators: [
    withMockSourceDataContext({
      sourceData: {},
    }),
  ],
};

export const WithSupersets: StoryObj<typeof SupersetListing> = {
  name: "With supersets in listing",
  render: () => {
    return <SupersetListing />;
  },
  decorators: [
    withMockSourceDataContext({
      sourceData: {
        supersets: {
          "Leg day": {
            name: "Leg day",
            exercises: ["Squat", "Lunge"],
            tags: ["legs"],
          },
        },
        sessions: {
          "Push Day": { name: "Push Day", supersets: ["Leg day"] },
        },
      },
    }),
  ],
};
