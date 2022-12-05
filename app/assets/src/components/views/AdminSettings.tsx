import { FormControl } from "@mui/material";
import { Button, Callout, InputText } from "czifui";
import { compact, isEmpty, map, size, trim } from "lodash/fp";
import React, { useState } from "react";
import { modifyFeatureFlagForUsers, setWorkflowVersion } from "~/api/index";
import cs from "./admin_settings.scss";

interface AdminSettingsProps {
  workflows: WorkflowType[];
}

interface WorkflowType {
  id: string;
  key: string;
  value: string;
}

const AdminSettingsView = ({ workflows }: AdminSettingsProps) => {
  const [requestResult, setRequestResult] = useState<string>("");
  const [featureFlagUsersList, setFeatureFlagUsersList] = useState<Set<string>>(
    new Set(),
  );
  const [featureFlag, setFeatureFlag] = useState<string>("");
  const [featureFlagMsgResponse, setFeatureFlagMsgResponse] = useState<
    string[]
  >([]);
  const [featureFlagCalloutIntent, setFeatureFlagCalloutIntent] = useState<
    "error" | "info" | "success" | "warning" | undefined
  >();

  const handleSetWorkflows = async (event: React.SyntheticEvent) => {
    event.preventDefault(); // prevents redirect behaviour
    const workflow = event.target[0].value;
    const version = event.target[1].value;
    const { status } = await setWorkflowVersion(workflow, version);
    setRequestResult(status);
  };

  const renderWorkflowVersions = () => (
    <div className={cs.workflow_versions}>
      <div className={cs.title}>Set Workflow Versions</div>
      {workflows.map((workflow: WorkflowType) => (
        <form key={workflow["key"]} onSubmit={handleSetWorkflows}>
          <textarea
            className={cs.textarea}
            cols={30}
            rows={1}
            value={workflow["key"]}
            readOnly={true}
          />
          <textarea
            className={cs.textarea}
            cols={20}
            rows={1}
            defaultValue={workflow["value"]}
          />
          <input
            className={cs.submit}
            name="commit"
            type="submit"
            value={"Update " + workflow["key"].replace("-version", "")}
          />
        </form>
      ))}
      <span>{requestResult}</span>
    </div>
  );

  const handleModifyFeatureFlagClick = async (
    actionToPerform: "add" | "remove",
  ) => {
    if (featureFlag && !isEmpty(featureFlagUsersList)) {
      const {
        usersThatAlredyHadFeatureFlag,
        usersWithNoAccounts,
        usersWithUpdatedFeatureFlags,
      } = await modifyFeatureFlagForUsers({
        featureFlag,
        // Remove leading and trailing whitespace from each email.
        userEmails: map(trim, Array.from(featureFlagUsersList)),
        action: actionToPerform,
      });
      let intent;

      if (size(usersWithUpdatedFeatureFlags) === 0) {
        intent = "error";
      } else if (
        size(usersThatAlredyHadFeatureFlag) > 0 ||
        size(usersWithNoAccounts) > 0
      ) {
        intent = "warning";
      } else {
        intent = "success";
      }
      const messages = compact([
        !isEmpty(usersWithUpdatedFeatureFlags) &&
          `Successfully ${actionToPerform}ed feature flag for ${usersWithUpdatedFeatureFlags.join(
            ", ",
          )}`,
        !isEmpty(usersWithNoAccounts) &&
          `The following users do not have accounts: ${usersWithNoAccounts.join(
            ", ",
          )}`,
        !isEmpty(usersThatAlredyHadFeatureFlag) &&
          `The following users already had the feature flag: ${usersThatAlredyHadFeatureFlag.join(
            ", ",
          )}`,
      ]);

      setFeatureFlagMsgResponse(messages);
      setFeatureFlagCalloutIntent(intent);
    }
  };

  const renderFeatureFlagCallout = () => {
    if (featureFlagCalloutIntent && !isEmpty(featureFlagMsgResponse)) {
      return (
        <Callout intent={featureFlagCalloutIntent}>
          <>
            {map(
              resp => (
                <div className={cs.featureFlagResponse}>{resp}</div>
              ),
              featureFlagMsgResponse,
            )}
          </>
        </Callout>
      );
    }
  };

  const renderControlFeatureFlags = () => {
    return (
      <div className={cs.addFeatureFlagContainer}>
        <div className={cs.title}>Set feature flags</div>
        <FormControl className={cs.formControl}>
          <InputText
            sdsType="textArea"
            label="User(s)"
            id="users"
            style={{ minWidth: "400px" }}
            inputProps={{ style: { minWidth: "400px" } }}
            onChange={e =>
              setFeatureFlagUsersList(new Set(e.target.value.split(",")))
            }
          />
          <InputText
            sdsType="textField"
            label="Feature flag"
            id="feature"
            onChange={e => setFeatureFlag(e.target.value)}
          />
        </FormControl>
        <div className={cs.actions}>
          <Button
            onClick={() => handleModifyFeatureFlagClick("add")}
            sdsStyle="square"
            sdsType="primary"
          >
            Add feature flag
          </Button>
          <Button
            onClick={() => handleModifyFeatureFlagClick("remove")}
            sdsStyle="square"
            sdsType="secondary"
          >
            Remove feature flag
          </Button>
        </div>
      </div>
    );
  };

  const renderFeatureFlagAdminControl = () => {
    return (
      <div>
        {renderControlFeatureFlags()}
        {renderFeatureFlagCallout()}
      </div>
    );
  };

  return (
    <div className={cs.page}>
      <div className={cs.header}>Admin Settings</div>
      {renderWorkflowVersions()}
      {renderFeatureFlagAdminControl()}
    </div>
  );
};

export default AdminSettingsView;
