import cx from "classnames";
import { Icon } from "czifui";
import React from "react";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import Toggle from "~/components/ui/controls/Toggle";
import SectionsDropdown from "~/components/ui/controls/dropdowns/SectionsDropdown";
import { UPLOAD_SAMPLE_PIPELINE_OVERVIEW_LINK } from "~/components/utils/documentationLinks";
import cs from "~/components/views/SampleUploadFlow/WorkflowSelector/workflow_selector.scss";
import {
  MEDAKA_MODEL_OPTIONS,
  SEQUENCING_TECHNOLOGY_OPTIONS,
} from "~/components/views/SampleUploadFlow/constants";
import { WetlabSelector } from "../../../../../WetlabSelector";

const infoIcon = (
  <span>
    <Icon
      sdsIcon="infoCircle"
      sdsSize="s"
      sdsType="interactive"
      className={cs.infoIcon}
    />
  </span>
);

interface ConsensusGenomeNanoporeSettingsProps {
  onClearLabsChange(toggle: boolean): void;
  onMedakaModelChange(value: string): void;
  selectedMedakaModel: string;
  usedClearLabs: boolean;
  onWetlabProtocolChange(value: string): void;
  selectedWetlabProtocol: string;
}

const ConsensusGenomeNanoporeSettings = ({
  onClearLabsChange,
  onMedakaModelChange,
  selectedMedakaModel,
  usedClearLabs,
  onWetlabProtocolChange,
  selectedWetlabProtocol,
}: ConsensusGenomeNanoporeSettingsProps) => {
  return (
    <div className={cs.technologyContent}>
      <div className={cs.item}>
        <div className={cs.subheader}>
          Used Clear Labs:
          <ColumnHeaderTooltip
            trigger={infoIcon}
            content="Pipeline will be adjusted to accomodate Clear Lab fastq files which have undergone the length filtering and trimming steps."
            position="top center"
            link="https://www.clearlabs.com/"
          />
        </div>
        <div className={cs.description} onClick={e => e.stopPropagation()}>
          <Toggle
            initialChecked={usedClearLabs}
            onLabel="Yes"
            offLabel="No"
            onChange={(label: string) => onClearLabsChange(label === "Yes")}
          />
        </div>
      </div>

      {/* If uploading ClearLabs samples, only allow default wetlab and medaka model options. */}
      <div className={cs.item}>
        <div className={cs.subheader}>Wetlab Protocol:</div>
        {usedClearLabs ? (
          <div className={cx(cs.description, cs.text)}>ARTIC v3</div>
        ) : (
          <WetlabSelector
            technology={SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE}
            selectedWetlabProtocol={selectedWetlabProtocol}
            onWetlabProtocolChange={onWetlabProtocolChange}
          />
        )}
      </div>
      <div className={cs.item}>
        <div className={cs.subheader}>
          Medaka Model:
          <ColumnHeaderTooltip
            trigger={infoIcon}
            content={
              usedClearLabs
                ? "Medaka is a tool to create consensus sequences and variant calls from Nanopore sequencing data."
                : "For best results, specify the correct model. Where a version of Guppy has been used without a corresponding model, choose a model with the highest version equal to or less than the Guppy version."
            }
            position="top center"
            link={UPLOAD_SAMPLE_PIPELINE_OVERVIEW_LINK}
          />
        </div>
        {usedClearLabs ? (
          <div className={cx(cs.description, cs.text)}>r941_min_high_g360</div>
        ) : (
          <SectionsDropdown
            className={cs.dropdown}
            menuClassName={cs.dropdownMenu}
            categories={MEDAKA_MODEL_OPTIONS}
            onChange={(val: string) => onMedakaModelChange(val)}
            selectedValue={selectedMedakaModel}
          />
        )}
      </div>
    </div>
  );
};

export { ConsensusGenomeNanoporeSettings };
