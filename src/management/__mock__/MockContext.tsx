import { ComponentType } from "react";
import SourceDataContext from "../../context/SourceDataContext";
import SessionContext from "../../context/SessionContext";

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
