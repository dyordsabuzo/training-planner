import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import { ExercisePage } from "./ExercisePage";
import { withMockSessionDataContext } from "../../management/__mock__/MockContext";
import { SessionData } from "../../types/SessionData";

const meta: Meta<typeof ExercisePage> = {
  title: "pages/ExercisePage",
  component: ExercisePage,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/training-planner/train/test-session"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
};

let isRunning = true;
let sessionData: SessionData | null = {
  plans: {},
  supersets: [
    {
      name: "Back and chest",
      exercises: [
        {
          exercise: {
            name: "Exercise with a very long name",
            // targetWeight: 45,
            videoLink: "https://google.com",
          },
          targetWeight: 45,
        },
        {
          exercise: {
            name: "DB Bench flies",
          },
        },
      ],
      targetWeight: 45,
      targetRep: 8,
      targetSet: 3,
      annotation: "Some annotation",
      rest: 60,
    },
    {
      name: "Legs",
      exercises: [
        { exercise: { name: "Squat" } },
        { exercise: { name: "Lunge" } },
      ],
      targetRep: 10,
      targetSet: 3,
      rest: 90,
    },
    {
      name: "Shoulders",
      exercises: [{ exercise: { name: "Overhead Press" } }],
      targetRep: 12,
      targetSet: 3,
      rest: 60,
    },
  ],
  week: "Week 3",
  session: "Push Day",
  annotation: "Focus on form and control",
} as any;

const wrapSession = () => {
  isRunning = false;
  sessionData = null;
};

export default meta;
export const EmptyForm: StoryObj<typeof ExercisePage> = {
  name: "Empty exercise listing",
  render: () => {
    const formData = null;
    return <ExercisePage />;
  },
  decorators: [
    withMockSessionDataContext({
      sessionData,
      isRunning,
      wrapSession,
    }),
  ],
};
