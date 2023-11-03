import { Button, Callout, InputText } from "@czi-sds/components";
import { FormControl } from "@mui/material";
import { compact, isEmpty, map, size, trim } from "lodash/fp";
import React, { useContext, useEffect, useState } from "react";
import { getLaunchedFeatureList, modifyFeatureFlagForUsers } from "~/api/index";
import { UserContext } from "~/components/common/UserContext";
import * as features from "~/components/utils/features";
import cs from "../../admin_settings.scss";
import { FeatureFlagList } from "./FeatureFlagList";

export const FeatureFlagControls = () => {
  const { userEmail } = useContext(UserContext) ?? {};
  const [launchedFeatureList, setLaunchedFeatureList] = useState<string[]>([]);
  const [allowedFeatureList, setAllowedFeatureList] = useState<string[]>([]);
  const [featureFlagUsersList, setFeatureFlagUsersList] = useState<Set<string>>(
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    new Set([userEmail]),
  );
  const [featureFlag, setFeatureFlag] = useState<string>("");
  const [featureFlagMsgResponse, setFeatureFlagMsgResponse] = useState<
    string[]
  >([]);
  const [featureFlagCalloutIntent, setFeatureFlagCalloutIntent] = useState<
    "error" | "info" | "success" | "warning" | undefined
  >();

  useEffect(() => {
    const fetchLaunchedFeatureList = async () => {
      const {
        launched_feature_list: launchedFeatureList,
        allowed_feature_list: allowedFeatureList,
      } = await getLaunchedFeatureList();
      setLaunchedFeatureList(launchedFeatureList);
      setAllowedFeatureList(allowedFeatureList);
    };
    fetchLaunchedFeatureList();
  }, [featureFlagMsgResponse]);

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

      // Select correct past tense suffix based on whether last letter is "e".
      const actionSuffix = actionToPerform.slice(-1) === "e" ? "d" : "ed";

      const messages = compact([
        !isEmpty(usersWithUpdatedFeatureFlags) &&
          `Successfully ${actionToPerform}${actionSuffix} feature flag for ${usersWithUpdatedFeatureFlags.join(
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

  const featuresList = Object.values(features);
  const unlaunchedFeatures = featuresList
    .filter(feature => !launchedFeatureList?.includes(feature))
    .sort();

  return (
    <div>
      <div className={cs.adminActionContainer}>
        <h2 className={cs.title}>Set feature flags</h2>
        <FeatureFlagList
          flagNames={unlaunchedFeatures}
          enabledFlags={allowedFeatureList}
          setSelectedFeatureFlag={setFeatureFlag}
        />
        <FormControl className={cs.formControl}>
          <InputText
            sdsType="textArea"
            label="User(s)"
            id="users"
            style={{ minWidth: "400px" }}
            defaultValue={userEmail}
            inputProps={{ style: { minWidth: "400px" } }}
            onChange={e =>
              setFeatureFlagUsersList(new Set(e.target.value.split(",")))
            }
          />
          <InputText
            sdsType="textField"
            label="Feature flag"
            id="feature"
            value={featureFlag}
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
      {featureFlagCalloutIntent && !isEmpty(featureFlagMsgResponse) && (
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
      )}
    </div>
  );
};
