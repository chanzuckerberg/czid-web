import cx from "classnames";
import React from "react";
import cs from "~/components/views/SampleUploadFlow/WorkflowSelector/workflow_selector.scss";
import { SampleUploadType } from "~/interface/shared";
import {
  SEQUENCING_TECHNOLOGY_OPTIONS,
  UPLOAD_WORKFLOWS,
} from "../../../constants";
import { shouldDisableSequencingPlatformOption } from "../../WorkflowSelector";
import { IlluminaSequencingPlatformOption } from "../IlluminaSequencingPlatformOption";
import { MetagenomicsWithNanopore } from "./components/MetagenomicsWithNanopore";

interface MetagenomicsSequencingPlatformOptionsProps {
  currentTab: SampleUploadType;
  onChangeGuppyBasecallerSetting(selected: string): void;
  onTechnologyToggle(value: SEQUENCING_TECHNOLOGY_OPTIONS): void;
  onWetlabProtocolChange(value: string): void;
  selectedGuppyBasecallerSetting: string;
  selectedTechnology: string;
  selectedWetlabProtocol: string;
}

const MetagenomicsSequencingPlatformOptions = ({
  currentTab,
  onChangeGuppyBasecallerSetting,
  onTechnologyToggle,
  onWetlabProtocolChange,
  selectedGuppyBasecallerSetting,
  selectedTechnology,
  selectedWetlabProtocol,
}: MetagenomicsSequencingPlatformOptionsProps) => {
  const { ILLUMINA, NANOPORE } = SEQUENCING_TECHNOLOGY_OPTIONS;
  const { MNGS } = UPLOAD_WORKFLOWS;

  return (
    <div className={cs.optionText} onClick={e => e.stopPropagation()}>
      <div className={cx(cs.title, cs.technologyTitle)}>
        Sequencing Platform:
        <div className={cs.technologyOptions}>
          <IlluminaSequencingPlatformOption
            isCg={false}
            isSelected={selectedTechnology === ILLUMINA}
            onClick={() => onTechnologyToggle(ILLUMINA)}
            selectedWetlabProtocol={selectedWetlabProtocol}
            onWetlabProtocolChange={onWetlabProtocolChange}
          />
          <MetagenomicsWithNanopore
            isDisabled={shouldDisableSequencingPlatformOption(
              currentTab,
              NANOPORE,
              MNGS.value,
            )}
            isSelected={selectedTechnology === NANOPORE}
            onClick={() => onTechnologyToggle(NANOPORE)}
            selectedGuppyBasecallerSetting={selectedGuppyBasecallerSetting}
            onChangeGuppyBasecallerSetting={onChangeGuppyBasecallerSetting}
          />
        </div>
      </div>
    </div>
  );
};

export { MetagenomicsSequencingPlatformOptions };
