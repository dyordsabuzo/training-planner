import type { Meta, StoryObj } from "@storybook/react";
import { SessionPreview } from "./SessionPreview";
import { resolveSession } from "../resolveSessionSupersets";

const sourceData = {
  exercises: {
    "Back Squat": { name: "Back Squat", targetWeight: 80 },
    "Romanian Deadlift": { name: "Romanian Deadlift", targetWeight: 60 },
    "Single-arm Row": { name: "Single-arm Row", targetWeight: 22.5 },
    "Erg Sprint": { name: "Erg Sprint", targetWeight: 0 },
    Plank: { name: "Plank", targetWeight: 0 },
  },
  supersets: {
    "Lower Body": {
      name: "Lower Body",
      exercises: ["Back Squat", "Romanian Deadlift"],
      targetSet: "4",
      targetRep: "8",
      rest: 90,
    },
  },
};

const group = (name: string, exercises: string[], extra: any) => ({
  name,
  exercises,
  sets: 3,
  reps: 10,
  percent: 0,
  rpe: 0,
  ...extra,
});

const units = resolveSession(sourceData, {
  supersets: ["Lower Body"],
  groups: [
    group("Pull", ["Single-arm Row"], { leftRight: true, rpe: 7, rest: 60, tempoRequired: true, tempo: "3-1-1" }),
    group("Conditioning", ["Erg Sprint"], { sets: 5, measure: "distance", distance: 250 }),
    group("Core", ["Plank"], { measure: "time", time: 45 }),
  ],
});

const meta: Meta<typeof SessionPreview> = {
  title: "pages/others/SessionPreview",
  component: SessionPreview,
};

export default meta;

export const MixedSession: StoryObj<typeof SessionPreview> = {
  name: "Superset and groups",
  render: () => (
    <SessionPreview
      title="Strength A"
      details={["Strength Plan", "Week 3"]}
      units={units}
      onClose={() => console.log("close")}
    />
  ),
};

export const Empty: StoryObj<typeof SessionPreview> = {
  name: "No exercises yet",
  render: () => (
    <SessionPreview title="New session" details={["Open plan"]} units={{}} onClose={() => console.log("close")} />
  ),
};
