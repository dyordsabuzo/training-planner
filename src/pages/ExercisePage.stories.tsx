import type { Meta, StoryObj } from "@storybook/react";
import { ExercisePage } from "./ExercisePage";
import { withMockSessionDataContext } from "../management/__mock__/MockContext";
import { SessionData } from "../types/SessionData";

const meta: Meta<typeof ExercisePage> = {
  title: "pages/ExercisePage",
  component: ExercisePage,
};

let isRunning = true;
let sessionData: SessionData | null = {
  plans: {},
  supersets: [
    {
      name: "Back and chest",
      exercises: [
        {
          name: "Seated cable rows try it to be very long name",
          // targetWeight: 45,
          videoLink: "https://google.com",
        },
        {
          name: "DB Bench flies",
        },
      ],
      targetRep: 8,
      targetSet: 3,
      annotation: "Some annotation",
      rest: 60,
    },
  ],
  week: 1,
};

const wrapSession = () => {
  console.log("wrap session");
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
