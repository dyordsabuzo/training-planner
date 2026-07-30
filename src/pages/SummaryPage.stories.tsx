import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import { SummaryPage } from "./SummaryPage";
import { withMockSessionDataContext } from "../management/__mock__/MockContext";

const meta: Meta<typeof SummaryPage> = {
  title: "pages/components/SummaryPage",
  component: SummaryPage,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/training-planner/train"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

const supersets = {
  "Chest Superset": {
    name: "Chest Superset",
    exercises: [
      { exercise: { name: "Bench Press" } },
      { exercise: { name: "Push Up" } },
    ],
  },
  "Back Superset": {
    name: "Back Superset",
    exercises: [
      {
        exercise: {
          name: "A very long exercise name that could wrap onto two lines",
        },
      },
      { exercise: { name: "Row" } },
    ],
  },
  "Leg Superset": {
    name: "Leg Superset",
    exercises: [{ exercise: { name: "Squat" } }, {}],
  },
};

const sessionContextStub = {
  sessionData: {
    supersets,
    session: "Push Day",
    week: "Week 3",
    annotation: "Focus on form and control",
  },
  isRunning: false,
  isSessionOn: true,
  setIsSessionOn: () => {},
  setIsRunning: () => {},
  initialiseSession: () => {},
  setSessionData: () => {},
  updateUserData: () => {},
  wrapSession: () => {},
};

export const Begin: StoryObj<typeof SummaryPage> = {
  name: "Before starting (BEGIN)",
  render: () => <SummaryPage />,
  decorators: [withMockSessionDataContext(sessionContextStub)],
};

export const NextSuperset: StoryObj<typeof SummaryPage> = {
  name: "Superset complete, more remain (NEXT)",
  render: () => (
    <SummaryPage
      currentSuperset={supersets["Chest Superset"]}
      nextSuperset={supersets["Back Superset"]}
      supersetIndex={0}
      actualSupersetData={{}}
    />
  ),
  decorators: [withMockSessionDataContext(sessionContextStub)],
};

export const SessionComplete: StoryObj<typeof SummaryPage> = {
  name: "Last superset complete (FINISH)",
  render: () => (
    <SummaryPage
      currentSuperset={supersets["Leg Superset"]}
      supersetIndex={2}
      actualSupersetData={{}}
    />
  ),
  decorators: [withMockSessionDataContext(sessionContextStub)],
};
