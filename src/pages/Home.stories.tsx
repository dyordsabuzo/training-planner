import type { Meta, StoryObj } from "@storybook/react";
import { ReactNode, useEffect, useState } from "react";
import { MemoryRouter } from "react-router";
import dayjs from "dayjs";
import { Home } from "./Home";
import { OPEN_WEEK } from "../common/planCycle";
import AuthContext from "../context/AuthContext";
import UserManagementContext from "../context/UserManagementContext";
import {
  withMockAuthContext,
  withMockSourceDataContext,
  withMockUserManagementContext,
} from "../management/__mock__/MockContext";

const meta: Meta<typeof Home> = {
  title: "pages/main/Home",
  component: Home,
  decorators: [
    // Home relies on App.tsx's outer wrapper for its page background — that
    // wrapper isn't part of this isolated story tree, so it's reproduced
    // here to preview dark mode accurately (matches production, where this
    // div always surrounds every route).
    (Story) => (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <MemoryRouter initialEntries={["/"]}>
          <Story />
        </MemoryRouter>
      </div>
    ),
  ],
};

export default meta;

const weeksOf = (count: number) =>
  Object.fromEntries(Array.from({ length: count }, (_, i) => [`Week ${i + 1}`, {}]));

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
// Local date, matching how the app compares session dates.
const dateAgo = (days: number) => dayjs().subtract(days, "day").format("YYYY-MM-DD");
const timeAgo = (days: number, hour: number) => {
  const date = daysAgo(days);
  date.setHours(hour, 15, 0, 0);
  return date.toISOString();
};

export const AsAdmin: StoryObj<typeof Home> = {
  name: "Admin",
  decorators: [
    withMockAuthContext({
      user: { email: "admin@trainingplanner.com" },
      userPermission: { role: "admin", plans: [], firstName: "Ada", lastName: "Admin" },
      isLoading: false,
    }),
    withMockSourceDataContext({
      sourceData: {
        plans: {
          "Strength Plan": { id: "plan-1", name: "Strength Plan", weeks: weeksOf(8) },
          "Mobility Plan": { id: "plan-2", name: "Mobility Plan", weeks: weeksOf(4) },
        },
        exercises: {
          "Bench Press": { id: "ex-1", name: "Bench Press" },
          Squat: { id: "ex-2", name: "Squat" },
          Deadlift: { id: "ex-3", name: "Deadlift" },
        },
      },
      initialise: () => {},
    }),
    withMockUserManagementContext({
      users: [
        { id: "uid-admin-1", email: "admin@trainingplanner.com", role: "admin", plans: [] },
        { id: "uid-user-1", email: "sam@trainingplanner.com", role: "user", plans: ["plan-1"] },
        { id: "uid-user-2", email: "jamie@trainingplanner.com", role: "user", plans: [] },
      ],
      fetchUsers: () => {},
    }),
  ],
};

// Regression guard for a real bug: AuthContext resolves `user` (Firebase
// Auth) and `userPermission` (a separate Firestore fetch) at different
// times — `user` is set first, `role` settles moments later. This wrapper
// reproduces that exact sequence with real state updates (not a static
// mock), so it catches the bug where a one-shot effect keyed only on
// `user` would fire before `role` was "admin", skip fetchUsers(), and
// latch shut — leaving the admin dashboard stuck on the loading spinner
// forever even once role did resolve.
const DelayedAdminAuth = ({ children }: { children: ReactNode }) => {
  const [userPermission, setUserPermission] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUserPermission({ role: "admin", plans: [], firstName: "Ada", lastName: "Admin" });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthContext.Provider
      value={
        {
          user: { email: "admin@trainingplanner.com" },
          userPermission,
          isLoading: false,
        } as any
      }
    >
      {children}
    </AuthContext.Provider>
  );
};

const DelayedUserManagement = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<any>(null);

  const fetchUsers = () => {
    setUsers([{ id: "uid-admin-1", email: "admin@trainingplanner.com", role: "admin", plans: [] }]);
  };

  return (
    <UserManagementContext.Provider value={{ users, fetchUsers, saveUser: () => {}, createUser: () => {}, saveTrainers: () => {}, saveError: null }}>
      {children}
    </UserManagementContext.Provider>
  );
};

export const AdminRoleResolvesAfterUser: StoryObj<typeof Home> = {
  name: "Regression: role resolves after user",
  render: () => (
    <DelayedAdminAuth>
      <DelayedUserManagement>
        <Home />
      </DelayedUserManagement>
    </DelayedAdminAuth>
  ),
  decorators: [
    withMockSourceDataContext({
      sourceData: {
        plans: { "Strength Plan": { id: "plan-1", name: "Strength Plan", weeks: weeksOf(8) } },
        exercises: {},
      },
      initialise: () => {},
    }),
  ],
};

export const NoPlansGranted: StoryObj<typeof Home> = {
  name: "No plans granted yet",
  decorators: [
    withMockAuthContext({
      user: { email: "sam@trainingplanner.com" },
      userPermission: { role: "user", plans: [] },
      isLoading: false,
    }),
    withMockSourceDataContext({ sourceData: { plans: {} }, initialise: () => {} }),
  ],
};

export const PlansWithNoHistoryYet: StoryObj<typeof Home> = {
  name: "Plans granted, nothing logged yet",
  decorators: [
    withMockAuthContext({
      user: { email: "sam@trainingplanner.com" },
      userPermission: {
        role: "user",
        plans: ["plan-1"],
        firstName: "Sam",
        lastName: "Trainee",
      },
      isLoading: false,
    }),
    withMockSourceDataContext({
      sourceData: {
        plans: {
          "Strength Plan": {
            id: "plan-1",
            name: "Strength Plan",
            startDate: daysAgo(2),
            weeks: weeksOf(8),
          },
        },
        userdata: {},
      },
      initialise: () => {},
    }),
  ],
};

const richSourceData = {
  plans: {
    "Strength Plan": {
      id: "plan-1",
      name: "Strength Plan",
      startDate: daysAgo(21),
      weeks: weeksOf(8),
    },
    "Mobility Plan": {
      id: "plan-2",
      name: "Mobility Plan",
      open: true,
      sessions: ["Hip Flow", "Shoulder Flow", "Full Body Stretch", "Recovery Walk", "Easy Swim"],
      weeks: {},
    },
  },
  // One session done, one due today and one overdue, so the day strip
  // shows each dot colour. Optional ones: today's is labelled, and the
  // one 3 days ago is neither missed nor marked.
  sessions: {
    "Hip Flow": { date: dateAgo(2) },
    "Shoulder Flow": { date: dateAgo(1) },
    "Full Body Stretch": { date: dateAgo(0) },
    "Recovery Walk": { date: dateAgo(0), optional: true },
    "Easy Swim": { date: dateAgo(3), optional: true },
  },
  userdata: {
    "uid-user-1": {
      "Strength Plan": {
        "Week 1": {
          "Upper Body": {
            mood: { before: { rating: 3 }, after: { rating: 4 } },
            meta: { completedAt: timeAgo(14, 7) },
          },
        },
        "Week 2": {
          "Upper Body": {
            mood: { before: { rating: 4 }, after: { rating: 4 } },
            meta: { completedAt: timeAgo(7, 7) },
          },
        },
        "Week 3": {
          "Upper Body": {
            mood: { before: { rating: 4 }, after: { rating: 5 } },
            meta: { completedAt: timeAgo(0, 7) },
          },
        },
      },
      "Mobility Plan": {
        [OPEN_WEEK]: {
          "Hip Flow": { meta: { completedAt: timeAgo(2, 18) } },
        },
      },
    },
  },
};

const richHistoryAuth = withMockAuthContext({
  user: { email: "sam@trainingplanner.com" },
  userPermission: {
    role: "user",
    plans: ["plan-1", "plan-2"],
    firstName: "Sam",
    lastName: "Trainee",
  },
  isLoading: false,
});

export const PlansWithRichHistory: StoryObj<typeof Home> = {
  name: "Plans granted, with session/mood history",
  decorators: [
    richHistoryAuth,
    withMockSourceDataContext({
      sourceData: richSourceData,
      checkins: {},
      saveCheckin: async () => {},
      initialise: () => {},
    }),
  ],
};

// Today's check-in is saved (the card shows its summary); yesterday's shows
// in the agenda when that day is selected.
export const WithCheckIns: StoryObj<typeof Home> = {
  name: "Plans granted, with daily check-ins",
  decorators: [
    richHistoryAuth,
    withMockSourceDataContext({
      sourceData: richSourceData,
      checkins: {
        [dateAgo(0)]: { mood: 4, sleepHours: 7.5, sleepQuality: 4, energy: 4, soreness: 2 },
        [dateAgo(1)]: { mood: 2, sleepHours: 5, energy: 2, soreness: 4 },
      },
      saveCheckin: async () => {},
      initialise: () => {},
    }),
  ],
};
