import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import { ProfileMenu } from "./ProfileMenu";

const meta: Meta<typeof ProfileMenu> = {
  title: "components/navigation/ProfileMenu",
  component: ProfileMenu,
};

export default meta;

// The dropdown opens upward (bottom-full), so each story reserves space
// above the button for it to render into without clipping in the canvas.
// Wrapped in MemoryRouter since the dropdown's Profile/Admin/Log out items
// are react-router <Link>s.
const withSpaceAbove = (children: React.ReactNode) => (
  <MemoryRouter>
    <div className="pt-64">{children}</div>
  </MemoryRouter>
);

export const NoNameSet: StoryObj<typeof ProfileMenu> = {
  name: "No name set (falls back to email prefix)",
  render: () => withSpaceAbove(<ProfileMenu email="sam@example.com" />),
};

export const WithName: StoryObj<typeof ProfileMenu> = {
  name: "First and last name set",
  render: () =>
    withSpaceAbove(
      <ProfileMenu email="sam@example.com" firstName="Sam" lastName="Trainee" />
    ),
};

export const AdminUser: StoryObj<typeof ProfileMenu> = {
  name: "Admin (shows Admin menu item)",
  render: () =>
    withSpaceAbove(
      <ProfileMenu
        email="admin@example.com"
        firstName="Ada"
        lastName="Admin"
        isAdmin
      />
    ),
};

export const PartialName: StoryObj<typeof ProfileMenu> = {
  name: "Only first name set (still falls back to email prefix)",
  render: () =>
    withSpaceAbove(<ProfileMenu email="jamie@example.com" firstName="Jamie" />),
};
