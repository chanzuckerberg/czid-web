import React from "react";
import { ANALYTICS_EVENT_NAMES, withAnalytics } from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import { DBType } from "~/interface/sampleView";
import { NtNrStack } from "../NtNrStack";

interface NtNrSelectorProps {
  dbType: DBType;
  handleNtNrChange: (selectedDbType: "nr" | "nt") => void;
}

export const NtNrSelector = ({
  dbType,
  handleNtNrChange,
}: NtNrSelectorProps) => {
  const selector = (
    <div>
      <NtNrStack
        cellData={["NT", "NR"]}
        dbType={dbType}
        onClick={[
          withAnalytics(
            () => handleNtNrChange("nt"),
            ANALYTICS_EVENT_NAMES.REPORT_TABLE_COUNT_TYPE_CLICKED,
            {
              countType: "nt",
            },
          ),
          withAnalytics(
            () => handleNtNrChange("nr"),
            ANALYTICS_EVENT_NAMES.REPORT_TABLE_COUNT_TYPE_CLICKED,
            {
              countType: "nr",
            },
          ),
        ]}
      />
    </div>
  );

  return (
    <BasicPopup
      trigger={selector}
      position="top right"
      content="Switch count type"
      inverted
      basic={false}
      size="small"
    />
  );
};
