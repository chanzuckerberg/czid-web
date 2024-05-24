import { Icon } from "@czi-sds/components";
import cx from "classnames";
import React, { useState } from "react";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import List from "~/components/ui/List";
import Sample from "~/interface/sample";
import Notification from "~ui/notifications/Notification";
import cs from "./sample_stats_info.scss";
interface SampleStatsInfoProps {
  runningSamples: Sample[];
  failedSamples: Sample[];
  validSamples: Sample[];
  totalSampleCount: number | null;
}

export const SampleStatsInfo = ({
  runningSamples,
  failedSamples,
  validSamples,
  totalSampleCount,
}: SampleStatsInfoProps) => {
  const [showProcessingSamplesMessage, setShowProcessingSamplesMessage] =
    useState(true);

  const hideprocessingSamplesMessage = () => {
    setShowProcessingSamplesMessage(false);
  };

  return (
    <div>
      {showProcessingSamplesMessage && runningSamples.length > 0 && (
        <Notification
          className={cx(
            cs.notification,
            showProcessingSamplesMessage ? cs.show : cs.hide,
          )}
          type="info"
          displayStyle="flat"
          onClose={hideprocessingSamplesMessage}
          closeWithDismiss={false}
          closeWithIcon={true}
        >
          {runningSamples.length}{" "}
          {runningSamples.length === 1 ? "sample is" : "samples are"} still
          being processed.
        </Notification>
      )}
      <span className={cs.statsRow}>
        Showing {validSamples.length} of {totalSampleCount} samples.
        <ColumnHeaderTooltip
          trigger={
            <span>
              <Icon
                sdsIcon="infoCircle"
                sdsSize="s"
                sdsType="interactive"
                className={cs.infoIcon}
              />
            </span>
          }
          content={
            <React.Fragment>
              <List
                listClassName={cs.statusList}
                listItems={[
                  `${validSamples.length}
                            ${
                              validSamples.length === 1
                                ? "sample has"
                                : "samples have"
                            } been
                            uploaded and selected by filters.`,
                  `${runningSamples.length}
                            ${
                              runningSamples.length === 1
                                ? "sample is"
                                : "samples are"
                            } still
                            being processed.`,
                  `${failedSamples.length}
                            ${
                              failedSamples.length === 1 ? "sample" : "samples"
                            } failed to
                            process. Failed samples are not displayed in the charts below.`,
                  `Samples with only Consensus Genome runs will not be displayed in the
                            charts below`,
                ]}
              />
            </React.Fragment>
          }
        />
      </span>
    </div>
  );
};
