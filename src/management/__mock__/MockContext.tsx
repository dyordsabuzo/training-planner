import { ComponentType } from "react";
import SourceDataContext from "../../context/SourceDataContext";
import SessionContext from "../../context/SessionContext";
import AuthContext from "../../context/AuthContext";

export const withMockSourceDataContext =
  (customData: any) => (Story: ComponentType) => (
    <SourceDataContext.Provider value={customData}>
      <Story />
    </SourceDataContext.Provider>
  );

export const withMockSessionDataContext =
  (customData: any) => (Story: ComponentType) => (
    <SessionContext.Provider value={customData}>
      <Story />
    </SessionContext.Provider>
  );

export const withMockAuthContext =
  (customData: any) => (Story: ComponentType) => (
    <AuthContext.Provider value={customData}>
      <Story />
    </AuthContext.Provider>
  );
