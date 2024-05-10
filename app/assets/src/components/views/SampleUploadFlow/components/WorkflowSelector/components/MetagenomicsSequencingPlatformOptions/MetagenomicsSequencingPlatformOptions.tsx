import cx from "classnames";
import React from "react";
import { WorkflowType } from "~/components/utils/workflows";
import cs from "~/components/views/SampleUploadFlow/components/WorkflowSelector/workflow_selector.scss";
import { PipelineVersions, SampleUploadType } from "~/interface/shared";
import {
  NCBI_INDEX,
  NO_TECHNOLOGY_SELECTED,
  SEQUENCING_TECHNOLOGY_OPTIONS,
  UploadWorkflows,
  UPLOAD_WORKFLOWS,
} from "../../../../constants";
import { shouldDisableSequencingPlatformOption } from "../../WorkflowSelector";
import { WorkflowLinksConfig } from "../../workflowTypeConfig";
import { IlluminaSequencingPlatformOption } from "../IlluminaSequencingPlatformOption";
import { MetagenomicsWithNanopore } from "./components/MetagenomicsWithNanopore";

interface MetagenomicsSequencingPlatformOptionsProps {
  currentTab: SampleUploadType;
  latestMajorPipelineVersions: PipelineVersions;
  onChangeGuppyBasecallerSetting(selected: string): void;
  onTechnologyToggle(
    workflow: UploadWorkflows,
    technology: SEQUENCING_TECHNOLOGY_OPTIONS,
  ): void;
  onWetlabProtocolChange(value: string): void;
  selectedGuppyBasecallerSetting: string;
  selectedTechnology:
    | SEQUENCING_TECHNOLOGY_OPTIONS
    | typeof NO_TECHNOLOGY_SELECTED;
  selectedWetlabProtocol: string;
  projectPipelineVersions?: PipelineVersions;
}

const MetagenomicsSequencingPlatformOptions = ({
  currentTab,
  onChangeGuppyBasecallerSetting,
  onTechnologyToggle,
  onWetlabProtocolChange,
  selectedGuppyBasecallerSetting,
  selectedTechnology,
  selectedWetlabProtocol,
  projectPipelineVersions,
  latestMajorPipelineVersions,
}: MetagenomicsSequencingPlatformOptionsProps) => {
  const { ILLUMINA, NANOPORE } = SEQUENCING_TECHNOLOGY_OPTIONS;
  const MNGS = UPLOAD_WORKFLOWS.MNGS.value;

  return (
    <button
      className={cx(cs.optionText, "noStyleButton")}
      onClick={e => e.stopPropagation()}
    >
      <div className={cx(cs.title, cs.technologyTitle)}>
        Sequencing Platform:
      </div>
      <div className={cs.technologyOptions}>
        <IlluminaSequencingPlatformOption
          indexVersion={projectPipelineVersions?.[NCBI_INDEX]}
          isCg={false}
          isSelected={selectedTechnology === ILLUMINA}
          onClick={() => onTechnologyToggle(MNGS, ILLUMINA)}
          selectedWetlabProtocol={selectedWetlabProtocol}
          onWetlabProtocolChange={onWetlabProtocolChange}
          pipelineVersion={
            projectPipelineVersions?.[WorkflowType.SHORT_READ_MNGS]
          }
          latestMajorPipelineVersion={
            latestMajorPipelineVersions?.[WorkflowType.SHORT_READ_MNGS]
          }
          latestMajorIndexVersion={latestMajorPipelineVersions?.[NCBI_INDEX]}
          versionHelpLink={
            WorkflowLinksConfig[WorkflowType.SHORT_READ_MNGS]
              .pipelineVersionLink
          }
          warningHelpLink={
            WorkflowLinksConfig[WorkflowType.SHORT_READ_MNGS].warningLink
          }
        />
        <MetagenomicsWithNanopore
          indexVersion={projectPipelineVersions?.[NCBI_INDEX]}
          isDisabled={shouldDisableSequencingPlatformOption(
            currentTab,
            NANOPORE,
            MNGS,
          )}
          isSelected={selectedTechnology === NANOPORE}
          onClick={() => onTechnologyToggle(MNGS, NANOPORE)}
          selectedGuppyBasecallerSetting={selectedGuppyBasecallerSetting}
          onChangeGuppyBasecallerSetting={onChangeGuppyBasecallerSetting}
          pipelineVersion={
            projectPipelineVersions?.[WorkflowType.LONG_READ_MNGS]
          }
          latestMajorPipelineVersion={
            latestMajorPipelineVersions?.[WorkflowType.LONG_READ_MNGS]
          }
          latestMajorIndexVersion={latestMajorPipelineVersions?.[NCBI_INDEX]}
        />
      </div>
    </button>
  );
};

export { MetagenomicsSequencingPlatformOptions };
