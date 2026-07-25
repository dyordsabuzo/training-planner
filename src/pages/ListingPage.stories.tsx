import type { Meta, StoryObj } from "@storybook/react";
import ListingPage from "./ListingPage";
import { withMockSourceDataContext } from "../management/__mock__/MockContext";

const meta: Meta<typeof ListingPage> = {
  title: "pages/ListingPage",
  component: ListingPage,
};

export default meta;

export const Default: StoryObj<typeof ListingPage> = {
  name: "Manage page",
  render: () => {
    return <ListingPage list="exercises" />;
  },
  decorators: [
    withMockSourceDataContext({
      initialise: () => {},
      sourceData: {
        exercises: {
          Squat: { name: "Squat", supersets: ["Leg day"], tags: ["legs"] },
          "Bench Press": { name: "Bench Press", supersets: ["Push day"], tags: ["chest"] },
        },
        supersets: {
          "Leg day": { name: "Leg day", exercises: ["Squat", "Lunge"] },
        },
        sessions: {
          "Session A": { name: "Session A", supersets: ["Leg day"] },
        },
        plans: {
          "Plan 1": { name: "Plan 1", weeks: {} },
        },
      },
    }),
  ],
};
