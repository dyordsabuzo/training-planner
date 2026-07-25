import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import Navigation from "./Navigation";
import { withMockAuthContext } from "../../management/__mock__/MockContext";
import { SidebarContextProvider } from "../../context/SidebarContext";

const meta: Meta<typeof Navigation> = {
  title: "components/navigation/Navigation",
  component: Navigation,
};

export default meta;

export const LoggedOut: StoryObj<typeof Navigation> = {
  name: "Logged out",
  render: () => (
    <MemoryRouter initialEntries={["/"]}>
      <SidebarContextProvider>
        <Navigation />
      </SidebarContextProvider>
    </MemoryRouter>
  ),
  decorators: [
    withMockAuthContext({
      user: null,
      userPermission: null,
    }),
  ],
};

export const LoggedInAdmin: StoryObj<typeof Navigation> = {
  name: "Logged in (admin)",
  render: () => (
    <MemoryRouter initialEntries={["/training-planner/manage"]}>
      <SidebarContextProvider>
        <Navigation />
      </SidebarContextProvider>
    </MemoryRouter>
  ),
  decorators: [
    withMockAuthContext({
      user: { email: "admin@trainingplanner.com", photoURL: null },
      userPermission: { role: "admin", plans: [] },
    }),
  ],
};
