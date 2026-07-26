import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router";
import dayjs from "dayjs";
import SessionPage from "./SessionPage";
import {
  withMockSourceDataContext,
  withMockSessionDataContext,
} from "../management/__mock__/MockContext";

const meta: Meta<typeof SessionPage> = {
  title: "pages/SessionPage",
  component: SessionPage,
};

export default meta;

const baseSourceData = {
  sessions: {
    "Push Day": { name: "Push Day", supersets: ["Chest Superset"] },
    "Pull Day": { name: "Pull Day", supersets: ["Back Superset"] },
  },
  supersets: {
    "Chest Superset": {
      name: "Chest Superset",
      exercises: ["Bench Press"],
      sessions: ["Push Day"],
    },
    "Back Superset": {
      name: "Back Superset",
      exercises: ["Pull Up"],
      sessions: ["Pull Day"],
    },
  },
  exercises: {
    "Bench Press": { name: "Bench Press" },
    "Pull Up": { name: "Pull Up" },
  },
  userdata: {},
};

const buildWeeks = (count: number) => {
  let weeks: any = {};
  for (let i = 0; i < count; i++) {
    weeks[`Week ${i + 1}`] = {
      weekNumber: i,
      targetSet: 3,
      targetRep: 10,
      targetTime: 0,
      annotation: "",
    };
  }
  return weeks;
};

const sessionContextStub = {
  sessionData: null,
  isRunning: false,
  isSessionOn: false,
  setIsSessionOn: () => {},
  setIsRunning: () => {},
  initialiseSession: () => {},
  setSessionData: () => {},
  updateUserData: () => {},
  wrapSession: () => {},
};

const withTrainRouter = (Story: React.ComponentType) => (
  <MemoryRouter initialEntries={["/training-planner/train"]}>
    <Story />
  </MemoryRouter>
);

export const SinglePlanAutoSelect: StoryObj<typeof SessionPage> = {
  name: "Single plan auto-selects current week",
  render: () => <SessionPage />,
  decorators: [
    withTrainRouter,
    withMockSourceDataContext({
      sourceData: {
        ...baseSourceData,
        plans: {
          "Strength Plan": {
            name: "Strength Plan",
            startDate: dayjs().subtract(9, "day").toDate(),
            sessions: ["Push Day", "Pull Day"],
            weeks: buildWeeks(8),
          },
        },
      },
      initialise: () => {},
    }),
    withMockSessionDataContext(sessionContextStub),
  ],
};

export const FullyAutoSelected: StoryObj<typeof SessionPage> = {
  name: "Single plan and single session ready immediately",
  render: () => <SessionPage />,
  decorators: [
    withTrainRouter,
    withMockSourceDataContext({
      sourceData: {
        ...baseSourceData,
        plans: {
          "Strength Plan": {
            name: "Strength Plan",
            startDate: dayjs().subtract(9, "day").toDate(),
            sessions: ["Push Day"],
            weeks: buildWeeks(8),
          },
        },
      },
      initialise: () => {},
    }),
    withMockSessionDataContext(sessionContextStub),
  ],
};

export const MultiplePlans: StoryObj<typeof SessionPage> = {
  name: "Multiple plans require selection",
  render: () => <SessionPage />,
  decorators: [
    withTrainRouter,
    withMockSourceDataContext({
      sourceData: {
        ...baseSourceData,
        plans: {
          "Strength Plan": {
            name: "Strength Plan",
            startDate: dayjs().subtract(9, "day").toDate(),
            sessions: ["Push Day", "Pull Day"],
            weeks: buildWeeks(8),
          },
          "Mobility Plan": {
            name: "Mobility Plan",
            startDate: dayjs().toDate(),
            sessions: ["Push Day"],
            weeks: buildWeeks(4),
          },
        },
      },
      initialise: () => {},
    }),
    withMockSessionDataContext(sessionContextStub),
  ],
};

export const NoPlansAssigned: StoryObj<typeof SessionPage> = {
  name: "No plans assigned",
  render: () => <SessionPage />,
  decorators: [
    withTrainRouter,
    withMockSourceDataContext({
      sourceData: { ...baseSourceData, plans: {} },
      initialise: () => {},
    }),
    withMockSessionDataContext(sessionContextStub),
  ],
};

export const StaleSessionUrlRedirects: StoryObj<typeof SessionPage> = {
  name: "Stale /train/:sessionId with no active session redirects back",
  render: () => (
    <Routes>
      <Route path="/training-planner/train" element={<SessionPage />} />
      <Route
        path="/training-planner/train/:sessionId"
        element={<SessionPage />}
      />
    </Routes>
  ),
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/training-planner/train/stale-id-123"]}>
        <Story />
      </MemoryRouter>
    ),
    withMockSourceDataContext({
      sourceData: {
        ...baseSourceData,
        plans: {
          "Strength Plan": {
            name: "Strength Plan",
            startDate: dayjs().subtract(9, "day").toDate(),
            sessions: ["Push Day"],
            weeks: buildWeeks(8),
          },
        },
      },
      initialise: () => {},
    }),
    withMockSessionDataContext(sessionContextStub),
  ],
};
