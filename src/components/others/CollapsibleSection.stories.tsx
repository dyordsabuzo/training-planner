import type { Meta, StoryObj } from "@storybook/react";
import { CollapsibleSection } from "./CollapsibleSection";

const meta: Meta<typeof CollapsibleSection> = {
  title: "components/others/CollapsibleSection",
  component: CollapsibleSection,
};

export default meta;

export const Default: StoryObj<typeof CollapsibleSection> = {
  name: "Collapsed by default",
  render: () => (
    <CollapsibleSection label="Advanced settings">
      <div className="text-sm text-text-light dark:text-text-dark">Target Rep</div>
      <div className="text-sm text-text-light dark:text-text-dark">Target Set</div>
      <div className="text-sm text-text-light dark:text-text-dark">Rest</div>
    </CollapsibleSection>
  ),
};

export const OpenByDefault: StoryObj<typeof CollapsibleSection> = {
  name: "Open by default",
  render: () => (
    <CollapsibleSection label="Advanced settings" defaultOpen>
      <div className="text-sm text-text-light dark:text-text-dark">Target Rep</div>
      <div className="text-sm text-text-light dark:text-text-dark">Target Set</div>
      <div className="text-sm text-text-light dark:text-text-dark">Rest</div>
    </CollapsibleSection>
  ),
};
