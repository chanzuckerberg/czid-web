import { Button, Icon } from "czifui";
import React from "react";
import cs from "./style.scss";

interface FeatureFlagListProps {
  enabledFlags: string[];
  flagNames: string[];
  setSelectedFeatureFlag: (flag: string) => void;
}

export const FeatureFlagList = ({
  enabledFlags,
  flagNames,
  setSelectedFeatureFlag,
}: FeatureFlagListProps): JSX.Element => {
  const handleCopyClick = (flagName: string): void => {
    setSelectedFeatureFlag(flagName);
  };

  return (
    <>
      <h3 className={cs.header}>Unlaunched flags</h3>
      <p className={cs.text}>
        Note: checks denote flags that are turned on for the current CZID user.
      </p>
      <ul className={cs.featureFlagList}>
        {flagNames.map(flagName => {
          const isEnabledIcon = enabledFlags?.includes(flagName)
            ? "flagCheck"
            : "flagOutline";
          return (
            <li key={flagName} className={cs.featureFlagListItem}>
              <Button
                sdsStyle="minimal"
                sdsType="secondary"
                isAllCaps={false}
                onClick={() => handleCopyClick(flagName)}
                className={cs.styledButton}>
                <div className={cs.iconWrapper}>
                  <Icon
                    sdsIcon={isEnabledIcon}
                    sdsSize="s"
                    sdsType="interactive"
                  />
                </div>
                {flagName}
              </Button>
            </li>
          );
        })}
      </ul>
    </>
  );
};
