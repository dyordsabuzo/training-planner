import type { Meta, StoryObj } from "@storybook/react";
import { ComponentType } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ListingPage from "./ListingPage";
import { withMockSourceDataContext } from "../management/__mock__/MockContext";

// ListingPage reads the active tab from a `:tab` route param (see
// AllRoutes.tsx) — a bare MemoryRouter with no matching Route wouldn't
// update useParams() on navigate, so tab clicks would silently do nothing
// in a story despite working in the real app. Declaring the same two
// routes here keeps every story honest, and taking the initial path as an
// argument lets a story deep-link straight to a specific tab, exactly like
// a bookmark or the admin dashboard's "Manage training plans" button does.
const queryClient = new QueryClient();

const withManageRouter = (initialPath: string) => (Story: ComponentType) => (
  // The Library tab fetches through react-query.
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/training-planner/manage" element={<Story />} />
        <Route path="/training-planner/manage/:tab" element={<Story />} />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>
);

const meta: Meta<typeof ListingPage> = {
  title: "pages/components/ListingPage",
  component: ListingPage,
};

export default meta;

const mockSourceData = withMockSourceDataContext({
  initialise: () => {},
  sourceData: {
    exercises: {
      Squat: { name: "Squat", supersets: ["Leg day", "Full body"], tags: ["legs"] },
      Lunge: { name: "Lunge", supersets: ["Leg day"], tags: ["legs", "balance"] },
      "Bench Press": { name: "Bench Press", tags: ["chest"] },
      "Romanian Deadlift with a really long name": { name: "Romanian Deadlift with a really long name" },
      "Shared Row": {
        name: "Shared Row",
        tags: ["back"],
        linked: { orgId: "o2", srcId: "s1", ownerName: "Dragon Paddlers" },
      },
    },
    supersets: {
      "Leg day": { name: "Leg day", exercises: ["Squat", "Lunge"], tags: ["legs"] },
      "Full body": { name: "Full body", exercises: ["Squat"] },
    },
    sessions: {
      "Session A": { name: "Session A", supersets: ["Leg day"], tags: ["push"] },
      "Session B": { name: "Session B", supersets: ["Full body"], date: "2026-11-12" },
      "Technique": { name: "Technique", groups: [{ name: "Warm up" }, { name: "Drills" }], date: "2026-11-05", optional: true },
    },
    plans: {
      "Plan 1": {
        name: "Plan 1",
        status: "Active",
        startDate: "2026-10-05",
        weeks: {
          "Week 1": { weekNumber: 0, annotation: "Easy start" },
          "Week 2": { weekNumber: 1 },
        },
        sessions: ["Session A", "Session B", "Technique"],
      },
      "Open plan": { name: "Open plan", open: true, sessions: ["Technique", "Removed session"] },
    },
  },
});

export const Default: StoryObj<typeof ListingPage> = {
  name: "Manage page",
  render: () => {
    return <ListingPage />;
  },
  decorators: [withManageRouter("/training-planner/manage"), mockSourceData],
};

export const SessionsTab: StoryObj<typeof ListingPage> = {
  name: "Sessions tab, first section open",
  render: () => {
    return <ListingPage />;
  },
  decorators: [withManageRouter("/training-planner/manage/sessions"), mockSourceData],
};

export const UnusedExercises: StoryObj<typeof ListingPage> = {
  name: "Exercises filtered to unused",
  render: () => {
    return <ListingPage />;
  },
  decorators: [withManageRouter("/training-planner/manage/exercises?unused=1"), mockSourceData],
};

export const DeepLinkedToPlansTab: StoryObj<typeof ListingPage> = {
  name: "Deep-linked directly to the Plans tab",
  render: () => {
    return <ListingPage />;
  },
  decorators: [withManageRouter("/training-planner/manage/plans"), mockSourceData],
};
