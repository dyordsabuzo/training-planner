import type { Meta, StoryObj } from "@storybook/react";
import { UserListing } from "./UserListing";
import {
  withMockUserManagementContext,
  withMockSourceDataContext,
  withMockAuthContext,
} from "./__mock__/MockContext";

const meta: Meta<typeof UserListing> = {
  title: "management/UserListing",
  component: UserListing,
};

export default meta;

const mockUsers = [
  {
    id: "uid-admin-1",
    email: "admin@example.com",
    displayName: "Ada Admin",
    firstName: "Ada",
    lastName: "Admin",
    role: "admin",
    plans: [],
  },
  {
    id: "uid-user-1",
    email: "sam@example.com",
    displayName: "Sam Trainee",
    firstName: "Sam",
    lastName: "Trainee",
    role: "user",
    plans: ["plan-doc-id-1"],
  },
  {
    id: "uid-user-2",
    email: "jamie@example.com",
    displayName: "",
    role: "user",
    plans: [],
  },
];

// Plans are keyed by name (matching sourceData's shape elsewhere) but each
// record's own `id` is the real Firestore doc ID — the identifier actually
// stored in a users/{uid}.plans array. mockUsers above references
// "plan-doc-id-1" (not "Strength Plan") to demonstrate that id→name
// resolution, not just a lucky string match.
const mockPlans = {
  "Strength Plan": { name: "Strength Plan", id: "plan-doc-id-1" },
  "Mobility Plan": { name: "Mobility Plan", id: "plan-doc-id-2" },
};

export const Empty: StoryObj<typeof UserListing> = {
  name: "No registered users",
  decorators: [
    withMockUserManagementContext({
      users: [],
      fetchUsers: () => {},
      saveUser: () => {},
    }),
    withMockSourceDataContext({ sourceData: { plans: mockPlans }, initialise: () => {} }),
    withMockAuthContext({ getUid: () => "uid-admin-1" }),
  ],
};

export const WithUsers: StoryObj<typeof UserListing> = {
  name: "With registered users",
  decorators: [
    withMockUserManagementContext({
      users: mockUsers,
      fetchUsers: () => {},
      saveUser: (user: any) => console.log("saveUser", user),
    }),
    withMockSourceDataContext({ sourceData: { plans: mockPlans }, initialise: () => {} }),
    withMockAuthContext({ getUid: () => "uid-admin-1" }),
  ],
};

// Regression guard: a users/{uid} doc created before auto-provisioning
// existed (e.g. manually set to role:"admin" in the Firestore console per
// the bootstrap instructions) has no email field at all — this must not
// render as a blank User column.
const missingDataUsers = [
  {
    id: "uid-bootstrapped-admin",
    email: "",
    displayName: "",
    role: "admin",
    plans: [],
  },
  {
    id: "uid-partial-name",
    email: "",
    displayName: "",
    firstName: "Alex",
    role: "user",
    plans: [],
  },
];

export const MissingEmailAndName: StoryObj<typeof UserListing> = {
  name: "Legacy docs missing email/name",
  decorators: [
    withMockUserManagementContext({
      users: missingDataUsers,
      fetchUsers: () => {},
      saveUser: () => {},
    }),
    withMockSourceDataContext({ sourceData: { plans: mockPlans }, initialise: () => {} }),
    withMockAuthContext({ getUid: () => "uid-bootstrapped-admin" }),
  ],
};
