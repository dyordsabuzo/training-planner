import type { Meta, StoryObj } from '@storybook/react';
import { SessionListing } from './SessionListing';
import { withMockSourceDataContext } from './__mock__/MockContext';

const meta: Meta<typeof SessionListing> = {
  title: 'management/SessionListing',
  component: SessionListing,
};

export default meta;
export const EmptyForm: StoryObj<typeof SessionListing> = {
  name: 'Empty plan listing',
  render: () => {
    return (
      <SessionListing/>
    )
  },
  decorators: [
    withMockSourceDataContext({
      sourceData: {},
    }),
  ],
};

export const WithSessions: StoryObj<typeof SessionListing> = {
  name: 'With sessions in listing',
  render: () => {
    return <SessionListing />;
  },
  decorators: [
    withMockSourceDataContext({
      sourceData: {
        sessions: {
          "Push Day": {
            name: "Push Day",
            supersets: ["Chest Superset", "Shoulders Superset"],
          },
          // Regression guard: legacy/malformed records without a `supersets`
          // array (e.g. undefined) must not crash the listing render.
          "Legacy Day": {
            name: "Legacy Day",
          },
        },
      },
    }),
  ],
};
