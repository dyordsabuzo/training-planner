import type { Meta, StoryObj } from "@storybook/react";
import { PlanListing } from "./PlanListing";
import { withMockSourceDataContext } from "./__mock__/MockContext";

const meta: Meta<typeof PlanListing> = {
  title: "management/PlanListing",
  component: PlanListing,
};

export default meta;
export const Default: StoryObj<typeof PlanListing> = {
  name: "Empty plan listing",
  render: () => {
    const formData = [];
    return <PlanListing />;
  },
  decorators: [
    withMockSourceDataContext({
      sourceData: {
        plans: {},
      },
    }),
  ],
};

export const EmptyForm: StoryObj<typeof PlanListing> = {
  name: "With plan listing",
  render: () => {
    const formData = [];
    return <PlanListing />;
  },
  decorators: [
    withMockSourceDataContext({
      sourceData: {
        plans: {
          plan1: {
            name: "plan1",
          },
          plan2: {
            name: "plan2",
          },
        },
      },
    }),
  ],
};
