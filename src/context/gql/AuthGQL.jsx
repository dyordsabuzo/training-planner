import { gql } from "@apollo/client";

export const VERIFY_USER = gql`
  mutation Verify($user: UserInput) {
    verify(user: $user) {
      uid
      groupid
      isAdmin
      isGroupAdmin
      licenseType
    }
  }
`;
