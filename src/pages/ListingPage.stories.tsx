import type { Meta, StoryObj } from "@storybook/react";
import { ComponentType } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import ListingPage from "./ListingPage";
import { withMockSourceDataContext } from "../management/__mock__/MockContext";

// ListingPage reads the active tab from a `:tab` route param (see
// AllRoutes.tsx) — a bare MemoryRouter with no matching Route wouldn't
// update useParams() on navigate, so tab clicks would silently do nothing
// in a story despite working in the real app. Declaring the same two
// routes here keeps every story honest, and taking the initial path as an
// argument lets a story deep-link straight to a specific tab, exactly like
// a bookmark or the admin dashboard's "Manage training plans" button does.
const withManageRouter = (initialPath: string) => (Story: ComponentType) => (
  <MemoryRouter initialEntries={[initialPath]}>
    <Routes>
      <Route path="/training-planner/manage" element={<Story />} />
      <Route path="/training-planner/manage/:tab" element={<Story />} />
    </Routes>
  </MemoryRouter>
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
      Squat: { name: "Squat", supersets: ["Leg day"], tags: ["legs"] },
      "Bench Press": { name: "Bench Press", supersets: ["Push day"], tags: ["chest"] },
    },
    supersets: {
      "Leg day": { name: "Leg day", exercises: ["Squat", "Lunge"] },
    },
    sessions: {
      "Session A": { name: "Session A", supersets: ["Leg day"] },
    },
    plans: {
      "Plan 1": { name: "Plan 1", weeks: {} },
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

export const DeepLinkedToPlansTab: StoryObj<typeof ListingPage> = {
  name: "Deep-linked directly to the Plans tab",
  render: () => {
    return <ListingPage />;
  },
  decorators: [withManageRouter("/training-planner/manage/plans"), mockSourceData],
};
