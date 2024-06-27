import { Button, Dropdown, InputText } from "@czi-sds/components";
import React, { useState } from "react";
import { AppConfigParams, AppConfigType } from "../../AdminSettings";
import cs from "../../admin_settings.scss";

interface UpdateAppConfigProps {
  appConfigs: AppConfigType[];
  handleSetAppConfig: ({ key, value }: AppConfigParams) => Promise<string>;
}

export const UpdateAppConfig = ({
  appConfigs,
  handleSetAppConfig,
}: UpdateAppConfigProps) => {
  const [selectedAppConfig, setSelectedAppConfig] =
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    useState<AppConfigType>(null);
  const [selectedAppConfigNewValue, setSelectedAppConfigNewValue] =
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    useState<string>(null);
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
  const [requestStatus, setRequestStatus] = useState<string>(null);

  const onSelectAppConfig = (appConfigKey: string) => {
    const appConfig = appConfigs.find(
      appConfig => appConfig.key === appConfigKey,
    );
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    setSelectedAppConfig(appConfig);
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    setSelectedAppConfigNewValue(appConfig.value);
  };

  const onSubmitAppConfig = async ({ key, value }: AppConfigParams) => {
    const status = await handleSetAppConfig({ key, value });
    setRequestStatus(status);
  };

  const label = selectedAppConfig?.key ?? "Select App Config";

  return (
    <>
      <div className={cs.adminActionContainer}>
        <h2 className={cs.title}>Set App Config</h2>
        <Dropdown
          className={cs.appConfigDropdown}
          InputDropdownProps={{
            label,
            intent: "default",
            sdsStyle: "square",
            sdsType: "label",
          }}
          isTriggerChangeOnOptionClick
          label={label}
          search
          options={appConfigs.map(appConfig => ({ name: appConfig.key }))}
          onChange={appConfigKey => {
            if (appConfigKey) {
              onSelectAppConfig(appConfigKey.name);
            }
          }}
        />
        <InputText
          sdsType="textField"
          label="App Config Value"
          id="appConfig"
          value={selectedAppConfigNewValue ?? ""}
          onChange={e => setSelectedAppConfigNewValue(e.target.value)}
        />
        <Button
          onClick={() =>
            onSubmitAppConfig({
              key: selectedAppConfig.key,
              value: selectedAppConfigNewValue,
            })
          }
          sdsStyle="square"
          sdsType="primary"
          disabled={
            !selectedAppConfig ||
            selectedAppConfigNewValue === selectedAppConfig?.value
          }
        >
          Update App Config
        </Button>
        <div>{requestStatus}</div>
      </div>
    </>
  );
};
