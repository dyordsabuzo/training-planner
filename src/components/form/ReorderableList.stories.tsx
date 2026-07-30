import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ReorderableList } from "./ReorderableList";

const meta: Meta<typeof ReorderableList> = {
  title: "components/form/ReorderableList",
  component: ReorderableList,
};

export default meta;

export const Default: StoryObj<typeof ReorderableList> = {
  name: "Basic ReorderableList",
  render: () => {
    const ReorderableListDemo = () => {
      const [items, setItems] = useState<string[]>(["Chest Superset", "Back Superset", "Leg Superset"]);
      return (
        <ReorderableList
          label="Supersets"
          items={items}
          onReorder={setItems}
          onRemove={(item) => setItems(items.filter((i) => i !== item))}
        />
      );
    };
    return <ReorderableListDemo />;
  },
};

export const Empty: StoryObj<typeof ReorderableList> = {
  name: "No items selected",
  render: () => {
    return (
      <ReorderableList
        label="Supersets"
        items={[]}
        onReorder={() => {}}
        emptyMessage="No supersets added yet"
      />
    );
  },
};

export const ReadOnly: StoryObj<typeof ReorderableList> = {
  name: "Without remove button",
  render: () => {
    const ReorderableListDemo = () => {
      const [items, setItems] = useState<string[]>(["Chest Superset", "Back Superset"]);
      return <ReorderableList items={items} onReorder={setItems} />;
    };
    return <ReorderableListDemo />;
  },
};
