import type { Meta, StoryObj } from "@storybook/react";
import { PlanProgressCard } from "./PlanProgressCard";

const meta: Meta<typeof PlanProgressCard> = {
  title: "pages/others/PlanProgressCard",
  component: PlanProgressCard,
};

export default meta;

export const InProgress: StoryObj<typeof PlanProgressCard> = {
  name: "Plan in progress",
  render: () => (
    <PlanProgressCard
      planName="Strength Plan"
      totalWeeks={8}
      completedWeeks={3}
      currentWeekIndex={3}
      sessionsLogged={9}
      onContinue={() => console.log("continue")}
    />
  ),
};

export const NotStarted: StoryObj<typeof PlanProgressCard> = {
  name: "Not started yet",
  render: () => (
    <PlanProgressCard
      planName="Mobility Plan"
      totalWeeks={4}
      completedWeeks={0}
      currentWeekIndex={null}
      sessionsLogged={0}
      onContinue={() => console.log("continue")}
    />
  ),
};

export const Completed: StoryObj<typeof PlanProgressCard> = {
  name: "Fully completed",
  render: () => (
    <PlanProgressCard
      planName="Beginner Plan"
      totalWeeks={6}
      completedWeeks={6}
      currentWeekIndex={5}
      sessionsLogged={18}
      onContinue={() => console.log("continue")}
    />
  ),
};
