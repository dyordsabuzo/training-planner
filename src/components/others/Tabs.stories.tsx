import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Tabs } from "./Tabs";

const meta: Meta<typeof Tabs> = {
  title: "components/others/Tabs",
  component: Tabs,
};

export default meta;

const categories = ["Exercises", "Supersets", "Sessions", "Plans", "Relationships"];

export const Default: StoryObj<typeof Tabs> = {
  name: "Interactive tabs",
  render: () => {
    const [activeTab, setActiveTab] = useState("Exercises");
    return <Tabs tabs={categories} activeTab={activeTab} onChange={setActiveTab} ariaLabel="Manage sections" />;
  },
};

export const ManyTabsOverflow: StoryObj<typeof Tabs> = {
  name: "Overflowing tabs (scroll arrows)",
  render: () => {
    const manyTabs = [
      "Exercises",
      "Supersets",
      "Sessions",
      "Plans",
      "Relationships",
      "Reports",
      "Settings",
      "Archive",
    ];
    const [activeTab, setActiveTab] = useState("Exercises");
    return (
      <div className="max-w-sm">
        <Tabs tabs={manyTabs} activeTab={activeTab} onChange={setActiveTab} ariaLabel="Overflowing tabs" />
      </div>
    );
  },
};
