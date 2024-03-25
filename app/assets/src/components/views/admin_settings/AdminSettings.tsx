import React, { useEffect, useState } from "react";
import { getAppConfigs, setAppConfig } from "~/api/index";
import cs from "./admin_settings.scss";
import { CreateAppConfig } from "./components/CreateAppConfig";
import { FeatureFlagControls } from "./components/FeatureFlagControls";
import { GenerateEnrichedUserToken } from "./components/GenerateEnrichedUserToken";
import { UpdateAppConfig } from "./components/UpdateAppConfig";
import { WorkflowVersions } from "./components/WorkflowVersions";

export interface AppConfigType {
  id: string;
  key: string;
  value: string;
}

export interface AppConfigParams {
  key: string;
  value: string;
}

const AdminSettings = () => {
  const [appConfigs, setAppConfigs] = useState<AppConfigType[]>([]);
  const [workflowVersions, setWorkflowVersions] = useState<AppConfigType[]>([]);

  useEffect(() => {
    const fetchAppConfigs = async () => {
      const allAppConfigs = await getAppConfigs();
      const workflowVersions = allAppConfigs.filter(appConfig =>
        appConfig.key.includes("version"),
      );
      const otherAppConfigs = allAppConfigs.filter(
        (appConfig: AppConfigType) => !workflowVersions.includes(appConfig),
      );
      setWorkflowVersions(workflowVersions);
      setAppConfigs(otherAppConfigs);
    };
    fetchAppConfigs();
  }, []);

  const handleSetAppConfig = async ({ key, value }: AppConfigParams) => {
    const { status } = await setAppConfig(key, value);
    return status;
  };

  return (
    <div className={cs.page}>
      <h1 className={cs.header}>Admin Settings</h1>
      <GenerateEnrichedUserToken />
      <WorkflowVersions workflowVersions={workflowVersions} />
      <FeatureFlagControls />
      <UpdateAppConfig
        appConfigs={appConfigs}
        handleSetAppConfig={handleSetAppConfig}
      />
      <CreateAppConfig handleSetAppConfig={handleSetAppConfig} />
    </div>
  );
};

export default AdminSettings;
