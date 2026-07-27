import type { Meta, StoryObj } from "@storybook/react";
import dayjs from "dayjs";
import { PlanListing } from "./PlanListing";
import { withMockSourceDataContext } from "./__mock__/MockContext";

const meta: Meta<typeof PlanListing> = {
  title: "management/PlanListing",
  component: PlanListing,
};

export default meta;

export const Empty: StoryObj<typeof PlanListing> = {
  name: "Empty plan listing",
  render: () => <PlanListing />,
  decorators: [
    withMockSourceDataContext({
      sourceData: {
        plans: {},
      },
    }),
  ],
};

const buildWeeks = (count: number, annotatedIndexes: number[] = []) => {
  let weeks: any = {};
  for (let i = 0; i < count; i++) {
    weeks[`Week ${i + 1}`] = {
      weekNumber: i,
      targetSet: 3,
      targetRep: 10,
      targetTime: 0,
      annotation: annotatedIndexes.includes(i)
        ? "Deload week - reduce intensity"
        : "",
    };
  }
  return weeks;
};

export const WithPlans: StoryObj<typeof PlanListing> = {
  name: "With plan listing",
  render: () => <PlanListing />,
  decorators: [
    withMockSourceDataContext({
      sourceData: {
        plans: {
          "Strength Plan": {
            name: "Strength Plan",
            numberOfWeeks: "8",
            startDate: dayjs().subtract(9, "day").toDate(),
            sessions: ["Push Day", "Pull Day"],
            weeks: buildWeeks(8, [3]),
          },
          "Mobility Plan": {
            name: "Mobility Plan",
            numberOfWeeks: "4",
            startDate: dayjs().add(5, "day").toDate(),
            sessions: ["Stretch Day"],
            weeks: buildWeeks(4),
          },
          "Legacy Plan": {
            name: "Legacy Plan",
            numberOfWeeks: "0",
            sessions: [],
            weeks: {},
          },
        },
      },
    }),
  ],
};
