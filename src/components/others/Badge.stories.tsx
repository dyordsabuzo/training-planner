import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "components/others/Badge",
  component: Badge,
};

export default meta;

export const Default: StoryObj<typeof Badge> = {
  name: "Badge variants",
  render: () => {
    return (
      <div className="flex gap-2">
        <Badge variant="primary">Superset</Badge>
        <Badge variant="success">Complete</Badge>
        <Badge variant="warning">Pending</Badge>
        <Badge variant="danger">Missed</Badge>
        <Badge variant="neutral">Neutral</Badge>
      </div>
    );
  },
  decorators: [],
};
