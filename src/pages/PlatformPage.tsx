import { useState } from "react";
import { Tabs } from "@dyordsabuzo/ui-components";
import { AppSettingsForm } from "../management/AppSettingsForm";
import { PlatformOrgs } from "../management/PlatformOrgs";
import { PlatformRequests } from "../management/PlatformRequests";
import { PlatformMarketplace } from "../management/PlatformMarketplace";
import WrapperPage from "./WrapperPage";

const TABS = ["Organisations", "Requests", "Marketplace", "Settings"];

// Super admins only (see AllRoutes): the whole platform rather than the active org.
const PlatformPage = () => {
  const [tab, setTab] = useState(TABS[0]);
  return (
    <WrapperPage className="max-w-5xl">
      <div className="w-full flex flex-col gap-4 pt-4">
        <h1 className="px-2 text-2xl font-bold text-text-light dark:text-text-dark">Platform</h1>

        <div className="px-2">
          <Tabs tabs={TABS} activeTab={tab} onChange={setTab} ariaLabel="Platform sections" />
        </div>

        <div className="w-full px-2">
          {tab === "Organisations" && <PlatformOrgs />}
          {tab === "Requests" && <PlatformRequests />}
          {tab === "Marketplace" && <PlatformMarketplace />}
          {tab === "Settings" && <AppSettingsForm />}
        </div>
      </div>
    </WrapperPage>
  );
};

export default PlatformPage;
