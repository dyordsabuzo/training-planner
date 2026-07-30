import type { Meta, StoryObj } from "@storybook/react";
import { DataTable } from "./DataTable";
import { Badge } from "../others/Badge";

type Exercise = { id: string; name: string; muscleGroup: string; sets: number };

const meta: Meta<typeof DataTable<Exercise>> = {
  title: "components/form/DataTable",
};

export default meta;

const rows: Exercise[] = [
  { id: "1", name: "Squat", muscleGroup: "Legs", sets: 4 },
  { id: "2", name: "Bench Press", muscleGroup: "Chest", sets: 3 },
  { id: "3", name: "Deadlift", muscleGroup: "Back", sets: 3 },
];

export const Default: StoryObj = {
  name: "Basic DataTable",
  render: () => (
    <DataTable<Exercise>
      columns={[
        { key: "name", header: "Name" },
        {
          key: "muscleGroup",
          header: "Muscle group",
          render: (row) => <Badge variant="neutral">{row.muscleGroup}</Badge>,
        },
        { key: "sets", header: "Sets" },
      ]}
      rows={rows}
      getRowKey={(row) => row.id}
    />
  ),
};

export const Clickable: StoryObj = {
  name: "Clickable rows",
  render: () => (
    <DataTable<Exercise>
      columns={[
        { key: "name", header: "Name" },
        { key: "muscleGroup", header: "Muscle group" },
        { key: "sets", header: "Sets" },
      ]}
      rows={rows}
      getRowKey={(row) => row.id}
      onRowClick={(row) => console.log("clicked", row)}
    />
  ),
};

export const Empty: StoryObj = {
  name: "No rows",
  render: () => (
    <DataTable<Exercise>
      columns={[
        { key: "name", header: "Name" },
        { key: "muscleGroup", header: "Muscle group" },
      ]}
      rows={[]}
      getRowKey={(row) => row.id}
      emptyMessage="No exercises yet."
    />
  ),
};
