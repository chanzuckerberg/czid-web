import cx from "classnames";
import React from "react";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import SectionsDropdown from "~/components/ui/controls/dropdowns/SectionsDropdown";
import Toggle from "~/components/ui/controls/Toggle";
import { UPLOAD_SAMPLE_PIPELINE_OVERVIEW_LINK } from "~/components/utils/documentationLinks";
import cs from "~/components/views/SampleUploadFlow/components/WorkflowSelector/workflow_selector.scss";
import {
  MEDAKA_MODEL_OPTIONS,
  SEQUENCING_TECHNOLOGY_OPTIONS,
} from "~/components/views/SampleUploadFlow/constants";
import { TooltipIcon } from "../../../../../TooltipIcon";
import { WetlabSelector } from "../../../../../WetlabSelector";

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
    <>
      <div className={cx(cs.item, cs.clearLabs)}>
        <div className={cs.subheader}>
          Used Clear Labs:
          <ColumnHeaderTooltip
            trigger={<TooltipIcon />}
            content="Pipeline will be adjusted to accomodate Clear Lab fastq files which have undergone the length filtering and trimming steps."
            position="top center"
            link="https://www.clearlabs.com/"
          />
        </div>
        <button
          className={cx(cs.description, "noStyleButton")}
          onClick={e => e.stopPropagation()}
        >
          <Toggle
            initialChecked={usedClearLabs}
            onLabel="Yes"
            offLabel="No"
            onChange={(label: string) => onClearLabsChange(label === "Yes")}
          />
        </button>
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
            trigger={<TooltipIcon />}
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
    </>
  );
};

export { ConsensusGenomeNanoporeSettings };
