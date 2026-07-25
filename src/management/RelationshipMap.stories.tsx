import type { Meta, StoryObj } from "@storybook/react";
import { RelationshipMap } from "./RelationshipMap";
import { withMockSourceDataContext } from "./__mock__/MockContext";

const meta: Meta<typeof RelationshipMap> = {
  title: "management/RelationshipMap",
  component: RelationshipMap,
};

export default meta;

const connectedMockData = {
  plans: {
    "Strength Plan": { name: "Strength Plan", sessions: ["Push Day", "Pull Day"] },
    "Hypertrophy Plan": { name: "Hypertrophy Plan", sessions: ["Pull Day", "Leg Day"] },
    "Mobility Plan": { name: "Mobility Plan", sessions: ["Stretch Day"] },
  },
  sessions: {
    "Push Day": { name: "Push Day", supersets: ["Chest Superset"] },
    "Pull Day": { name: "Pull Day", supersets: ["Back Superset", "Chest Superset"] },
    "Leg Day": { name: "Leg Day", supersets: ["Leg Superset"] },
    "Stretch Day": { name: "Stretch Day", supersets: ["Stretch Superset"] },
  },
  supersets: {
    "Chest Superset": { name: "Chest Superset", exercises: ["Bench Press", "Push Up"] },
    "Back Superset": { name: "Back Superset", exercises: ["Pull Up", "Row"] },
    "Leg Superset": { name: "Leg Superset", exercises: ["Squat", "Lunge"] },
    "Stretch Superset": { name: "Stretch Superset", exercises: ["Hamstring Stretch"] },
  },
  exercises: {
    "Bench Press": { name: "Bench Press" },
    "Push Up": { name: "Push Up" },
    "Pull Up": { name: "Pull Up" },
    Row: { name: "Row" },
    Squat: { name: "Squat" },
    Lunge: { name: "Lunge" },
    "Hamstring Stretch": { name: "Hamstring Stretch" },
  },
};

export const Connected: StoryObj<typeof RelationshipMap> = {
  name: "Connected dataset",
  render: () => <RelationshipMap />,
  decorators: [withMockSourceDataContext({ sourceData: connectedMockData })],
};

export const Empty: StoryObj<typeof RelationshipMap> = {
  name: "Empty state",
  render: () => <RelationshipMap />,
  decorators: [withMockSourceDataContext({ sourceData: {} })],
};
