import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./Card";

const meta: Meta<typeof Card> = {
  title: "components/others/Card",
  component: Card,
};

export default meta;

export const Default: StoryObj<typeof Card> = {
  name: "Card",
  render: () => {
    return (
      <Card className="max-w-sm">
        <h3 className="font-semibold mb-2">Card title</h3>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
          Card content goes here.
        </p>
      </Card>
    );
  },
  decorators: [],
};
