import { isEmpty } from "lodash/fp";
import React from "react";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { BenchmarkWorkflowRunAdditionalInfo } from "~/interface/sampleView";
import { ValueWithTooltip } from "../ValueWithTooltip";
import cs from "./stacked_sample_ids.scss";

interface StackedSampleIdsProps {
  cellData: BenchmarkWorkflowRunAdditionalInfo[];
}

// Renders two sampleIds stacked on top of each other with tooltips containing the sample name.
// If there's only one sampleId, only one value will be shown.
// Clicking on the sampleID will link you to its respective sample report.
export const StackedSampleIds = ({
  cellData: additionalInfo,
}: StackedSampleIdsProps) => {
  const sampleIds = Object.keys(additionalInfo);
  if (isEmpty(sampleIds)) return;

  const firstSampleId = sampleIds[0];
  const firstSample = (
    <ValueWithTooltip
      tooltipTitle={additionalInfo?.[firstSampleId]?.sampleName}
      className={cs.stackedValue}
    >
      <ExternalLink
        className={cs.stackedValue}
        href={`/samples/${firstSampleId}`}
      >
        {`${firstSampleId}${
          additionalInfo?.[firstSampleId]?.isRef ? " (ref)" : ""
        }`}
      </ExternalLink>
    </ValueWithTooltip>
  );

  if (sampleIds.length === 1) {
    return firstSample;
  } else {
    const secondSampleId = sampleIds[1];
    return (
      <div className={cs.stackedValues}>
        {firstSample}
        <div className={cs.horizontalSeparator} />
        <ValueWithTooltip
          tooltipTitle={additionalInfo?.[secondSampleId]?.sampleName}
          className={cs.stackedValue}
        >
          <ExternalLink
            href={`/samples/${secondSampleId}`}
            className={cs.stackedValue}
          >
            {`${secondSampleId}${
              additionalInfo?.[secondSampleId]?.isRef ? " (ref)" : ""
            }`}
          </ExternalLink>
        </ValueWithTooltip>
      </div>
    );
  }
};
