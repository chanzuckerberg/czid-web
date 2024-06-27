import { Button, InputText } from "@czi-sds/components";
import React, { useState } from "react";
import { AppConfigParams } from "../../AdminSettings";
import cs from "../../admin_settings.scss";

interface CreateAppConfigProps {
  handleSetAppConfig: ({ key, value }: AppConfigParams) => Promise<string>;
}

export const CreateAppConfig = ({
  handleSetAppConfig,
}: CreateAppConfigProps) => {
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
  const [newAppConfigName, setNewAppConfigName] = useState<string>(null);
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
  const [newAppConfigValue, setNewAppConfigValue] = useState<string>(null);
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
  const [requestStatus, setRequestStatus] = useState<string>(null);

  const onSubmitAppConfig = async ({ key, value }: AppConfigParams) => {
    const status = await handleSetAppConfig({ key, value });
    setRequestStatus(status);
  };

  return (
    <div className={cs.adminActionContainer}>
      <h2 className={cs.title}>Create App Config</h2>
      <InputText
        sdsType="textField"
        label="App Config Name"
        id="appConfigName"
        value={newAppConfigName ?? ""}
        onChange={e => setNewAppConfigName(e.target.value)}
      />
      <InputText
        sdsType="textField"
        label="App Config Value"
        id="appConfigValue"
        value={newAppConfigValue ?? ""}
        onChange={e => setNewAppConfigValue(e.target.value)}
      />
      <Button
        onClick={() =>
          onSubmitAppConfig({
            key: newAppConfigName,
            value: newAppConfigValue,
          })
        }
        sdsStyle="square"
        sdsType="primary"
        disabled={!(newAppConfigName && newAppConfigValue)}
      >
        Create App Config
      </Button>
      <div>{requestStatus}</div>
    </div>
  );
};
