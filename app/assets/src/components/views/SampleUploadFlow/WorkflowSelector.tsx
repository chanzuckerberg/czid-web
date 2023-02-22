import cx from "classnames";
import { Icon, InputCheckbox, InputRadio, Tooltip } from "czifui";
import { compact, find, kebabCase, map, size } from "lodash/fp";
import React, { useState, useContext } from "react";

import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import SectionsDropdown from "~/components/ui/controls/dropdowns/SectionsDropdown";
import {
  ARTIC_PIPELINE_LINK,
  CG_ILLUMINA_PIPELINE_GITHUB_LINK,
  GUPPY_BASECALLER_DOC_LINK,
  MNGS_ILLUMINA_PIPELINE_GITHUB_LINK,
  MNGS_NANOPORE_PIPELINE_GITHUB_LINK,
  UPLOAD_SAMPLE_PIPELINE_OVERVIEW_LINK,
} from "~/components/utils/documentationLinks";
import { AMR_V1_FEATURE, ONT_V1_FEATURE } from "~/components/utils/features";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import Toggle from "~ui/controls/Toggle";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import StatusLabel from "~ui/labels/StatusLabel";

import {
  UPLOAD_WORKFLOWS,
  CG_WETLAB_OPTIONS,
  SEQUENCING_TECHNOLOGY_OPTIONS,
  CG_NANOPORE_WETLAB_OPTIONS,
  GUPPY_BASECALLER_SETTINGS,
  MEDAKA_MODEL_OPTIONS,
  LOCAL_UPLOAD,
  REMOTE_UPLOAD,
  BASESPACE_UPLOAD,
  NANOPORE,
  Technology,
  UploadWorkflows,
} from "./constants";
import cs from "./workflow_selector.scss";

interface WorkflowSelectorProps {
  onClearLabsChange?: (usedClearLabs: boolean) => void;
  onMedakaModelChange?: (selected: string) => void;
  onTechnologyToggle?: (technology: string) => void;
  onGuppyBasecallerSettingChange?: (selected: string) => void;
  onWetlabProtocolChange?: (selected: string) => void;
  onWorkflowToggle?: (workflow: string) => void;
  currentTab?: string;
  selectedMedakaModel?: string;
  selectedGuppyBasecallerSetting?: string;
  selectedTechnology?: string;
  selectedWetlabProtocol?: string;
  selectedWorkflows?: Set<string>;
  s3UploadEnabled?: boolean;
  usedClearLabs?: boolean;
}

const WorkflowSelector = ({
  onClearLabsChange,
  onMedakaModelChange,
  onTechnologyToggle,
  onGuppyBasecallerSettingChange,
  onWetlabProtocolChange,
  onWorkflowToggle,
  currentTab,
  selectedMedakaModel,
  selectedGuppyBasecallerSetting,
  selectedTechnology,
  selectedWetlabProtocol,
  selectedWorkflows,
  s3UploadEnabled,
  usedClearLabs,
}: WorkflowSelectorProps) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};
  const [workflowOptionHovered, setWorkflowOptionHovered] = useState(null);

  const renderTechnologyOptions = (workflowKey: string) => {
    return (
      <div className={cs.optionText} onClick={e => e.stopPropagation()}>
        <div className={cx(cs.title, cs.technologyTitle)}>
          Sequencing Platform:
          <div className={cs.technologyOptions}>
            {renderIlluminaOption(workflowKey)}
            {renderNanoporeOption(workflowKey)}
          </div>
        </div>
      </div>
    );
  };

  const renderIlluminaOption = (workflowKey: string) => {
    const workflowObject = find(
      w => w.workflow === workflowKey,
      WORKFLOW_UPLOAD_OPTIONS,
    );
    const illuminaTechnologyOptionSelected =
      selectedTechnology === SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA;

    return (
      <div
        className={cx(
          cs.selectableOption,
          cs.technology,
          illuminaTechnologyOptionSelected && cs.selected,
        )}
        onClick={() =>
          onTechnologyToggle(SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA)
        }
        data-testid={`sequencing-technology-${kebabCase(
          SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA,
        )}`}
      >
        <InputRadio
          stage={illuminaTechnologyOptionSelected ? "checked" : "unchecked"}
          className={cx(cs.radioButton, cs.alignTitle)}
        />
        <div className={cs.optionText}>
          <div className={cs.title}>Illumina</div>
          <div className={cs.technologyDescription}>
            You can check out the Illumina pipeline on GitHub{" "}
            {createExternalLink({
              analyticsEventName: workflowObject.illuminaClickedLinkEvent,
              content: "here",
              link: workflowObject.illuminaLink,
            })}
            .
          </div>
          <div className={cs.technologyContent}>
            {selectedWorkflows.has(UPLOAD_WORKFLOWS.CONSENSUS_GENOME.value) &&
              illuminaTechnologyOptionSelected &&
              renderWetlabSelector(SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA)}
          </div>
        </div>
      </div>
    );
  };

  const renderCGNanoporeContent = () => (
    <div className={cs.technologyContent}>
      <div className={cs.item}>
        <div className={cs.subheader}>
          Used Clear Labs:
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
              "Pipeline will be adjusted to accomodate Clear Lab fastq files which have undergone the length filtering and trimming steps."
            }
            position={"top center"}
            link={"https://www.clearlabs.com/"}
          />
        </div>
        <div className={cs.description} onClick={e => e.stopPropagation()}>
          <Toggle
            className={cs.toggle}
            initialChecked={usedClearLabs}
            onLabel={"Yes"}
            offLabel={"No"}
            onChange={(label: string) => onClearLabsChange(label === "Yes")}
          />
        </div>
      </div>

      {/* If uploading ClearLabs samples, only allow default wetlab and medaka model options. */}
      {!usedClearLabs ? (
        <>
          {renderWetlabSelector(SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE)}
          <div className={cs.item}>
            <div className={cs.subheader}>
              Medaka Model:
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
                  "For best results, specify the correct model. Where a version of Guppy has been used without a corresponding model, choose a model with the highest version equal to or less than the Guppy version."
                }
                position={"top center"}
                link={UPLOAD_SAMPLE_PIPELINE_OVERVIEW_LINK}
              />
            </div>
            <SectionsDropdown
              className={cs.dropdown}
              menuClassName={cs.dropdownMenu}
              fluid
              categories={MEDAKA_MODEL_OPTIONS}
              onChange={(val: string) => onMedakaModelChange(val)}
              selectedValue={selectedMedakaModel}
            />
          </div>
        </>
      ) : (
        <>
          <div className={cs.item}>
            <div className={cs.subheader}>Wetlab Protocol&#58;</div>
            <div className={cx(cs.description, cs.text)}>ARTIC v3</div>
          </div>
          <div className={cs.item}>
            <div className={cs.subheader}>
              Medaka Model:
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
                  "Medaka is a tool to create consensus sequences and variant calls from Nanopore sequencing data."
                }
                position={"top center"}
              />
            </div>
            <div className={cx(cs.description, cs.text)}>
              r941_min_high_g360
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderMNGSNanoporeContent = () => (
    <div className={cs.technologyContent}>
      {renderGuppyBasecallerSettingSelector()}
    </div>
  );

  const renderNanoporeOption = (workflowKey: string) => {
    const workflowObject = find(
      w => w.workflow === workflowKey,
      WORKFLOW_UPLOAD_OPTIONS,
    );
    const nanoporeTechnologyOptionSelected =
      selectedTechnology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE;
    const shouldDisableOption = shouldDisableTechnologyOption(
      SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE,
      workflowObject.workflow,
    );
    let radioButton = (
      <InputRadio
        disabled={shouldDisableOption}
        stage={nanoporeTechnologyOptionSelected ? "checked" : "unchecked"}
        className={cx(cs.radioButton, cs.alignTitle)}
      />
    );
    if (shouldDisableOption) {
      const tooltipText = workflowObject.nanoporeDisabledTooltipText;
      radioButton = (
        <Tooltip arrow placement="top" title={tooltipText}>
          <span>{radioButton}</span>
        </Tooltip>
      );
    }
    return (
      <div
        className={cx(
          cs.selectableOption,
          cs.technology,
          nanoporeTechnologyOptionSelected && cs.selected,
          shouldDisableOption && cs.disabled,
        )}
        onClick={() =>
          shouldDisableOption
            ? null
            : onTechnologyToggle(SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE)
        }
        data-testid={`sequencing-technology-${kebabCase(
          SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE,
        )}`}
      >
        {radioButton}
        <div className={cs.optionText}>
          <div className={cs.title}>
            Nanopore
            {workflowKey === UPLOAD_WORKFLOWS.MNGS.value && (
              <StatusLabel
                className={shouldDisableOption && cs.disabledStatus}
                inline
                status="Beta"
                type="beta"
              />
            )}
          </div>
          <div
            className={cx(
              cs.technologyDescription,
              shouldDisableOption && cs.disabled,
            )}
          >
            {workflowObject.nanoporeText}
            {createExternalLink({
              analyticsEventName: workflowObject.nanoporeClickedLinkEvent,
              content: "here",
              link: workflowObject.nanoporeLink,
              disabled: shouldDisableOption,
            })}
            .
          </div>
          {nanoporeTechnologyOptionSelected && workflowObject.nanoporeContent}
        </div>
      </div>
    );
  };

  const createExternalLink = ({
    additionalStyle = null,
    analyticsEventName,
    content,
    link,
    disabled = false,
  }: {
    additionalStyle?: string;
    analyticsEventName: string;
    content: string;
    link: string;
    disabled?: boolean;
  }) => (
    <ExternalLink
      href={link}
      analyticsEventName={analyticsEventName}
      className={additionalStyle && additionalStyle}
      disabled={disabled}
    >
      {content}
    </ExternalLink>
  );

  const renderWetlabSelector = (technology: string) => {
    return (
      <div className={cs.item}>
        <div className={cs.subheader}>Wetlab Protocol&#58;</div>
        <Dropdown
          className={cs.dropdown}
          onChange={(value: string) => {
            onWetlabProtocolChange(value);
            trackEvent("WorkflowSelector_wetlab-protocol_selected", {
              wetlabOption: value,
            });
          }}
          options={
            technology === SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA
              ? CG_WETLAB_OPTIONS
              : CG_NANOPORE_WETLAB_OPTIONS
          }
          placeholder="Select"
          value={selectedWetlabProtocol}
        ></Dropdown>
      </div>
    );
  };

  const renderGuppyBasecallerSettingSelector = () => {
    return (
      <div className={cs.item}>
        <div className={cs.subheader}>
          {"Guppy Basecaller Setting:"}
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
              "Specifies which basecalling model of 'Guppy' was used to generate the data. This will affect the pipeline parameters."
            }
            position={"top center"}
            link={GUPPY_BASECALLER_DOC_LINK}
          />
        </div>
        <Dropdown
          className={cs.dropdown}
          options={GUPPY_BASECALLER_SETTINGS}
          placeholder="Select"
          value={selectedGuppyBasecallerSetting}
          onChange={(value: $TSFixMe) => onGuppyBasecallerSettingChange(value)}
        ></Dropdown>
      </div>
    );
  };

  // `sdsIcon` maps directly with czifui Icon component prop: sdsIcon
  const WORKFLOW_UPLOAD_OPTIONS = [
    {
      workflow: UPLOAD_WORKFLOWS.MNGS.value,
      title: UPLOAD_WORKFLOWS.MNGS.label,
      description: allowedFeatures.includes(ONT_V1_FEATURE)
        ? "Run your samples through our metagenomics pipeline. Our pipeline supports Illumina and Nanopore technologies."
        : "Run your samples through our metagenomics pipeline. Our pipeline only supports Illumina.",
      otherOptions: allowedFeatures.includes(ONT_V1_FEATURE)
        ? () => renderTechnologyOptions(UPLOAD_WORKFLOWS.MNGS.value)
        : null,
      beta: false,
      sdsIcon: UPLOAD_WORKFLOWS.MNGS.icon,
      illuminaText: "You can check out the Illumina pipeline on GitHub ",
      illuminaLink: MNGS_ILLUMINA_PIPELINE_GITHUB_LINK,
      illuminaClickedLinkEvent:
        ANALYTICS_EVENT_NAMES.UPLOAD_SAMPLE_STEP_MNGS_ILLUMINA_PIPELINE_LINK_CLICKED,
      nanoporeText: "You can check out the Nanopore pipeline on Github ",
      nanoporeLink: MNGS_NANOPORE_PIPELINE_GITHUB_LINK,
      nanoporeClickedLinkEvent:
        ANALYTICS_EVENT_NAMES.UPLOAD_SAMPLE_STEP_MNGS_NANOPORE_PIPELINE_LINK_CLICKED,
      nanoporeContent: renderMNGSNanoporeContent(),
      nanoporeDisabledTooltipText:
        "This pipeline only supports upload from your computer.",
    },
    {
      workflow: UPLOAD_WORKFLOWS.AMR.value,
      title: UPLOAD_WORKFLOWS.AMR.label,
      description:
        "Run your samples through our antimicrobial resistance pipeline. Our pipeline supports metagenomics or whole genome data. It only supports Illumina. You can also run the AMR pipeline from within an existing project by selecting previously uploaded mNGS samples.",
      beta: true,
      sdsIcon: UPLOAD_WORKFLOWS.AMR.icon,
      shouldHideOption: !allowedFeatures.includes(AMR_V1_FEATURE),
    },
    {
      workflow: UPLOAD_WORKFLOWS.CONSENSUS_GENOME.value,
      title: UPLOAD_WORKFLOWS.CONSENSUS_GENOME.label,
      description:
        "Run your samples through our Illumina or Nanopore supported pipelines to get consensus genomes for SARS-CoV-2.",
      otherOptions: () =>
        renderTechnologyOptions(UPLOAD_WORKFLOWS.CONSENSUS_GENOME.value),
      beta: false,
      sdsIcon: UPLOAD_WORKFLOWS.CONSENSUS_GENOME.icon,
      illuminaText: "You can check out the Illumina pipeline on GitHub ",
      illuminaLink: CG_ILLUMINA_PIPELINE_GITHUB_LINK,
      illuminaClickedLinkEvent:
        ANALYTICS_EVENT_NAMES.UPLOAD_SAMPLE_CG_ILLUMINA_PIPELINE_GITHUB_LINK_CLICKED,
      nanoporeText:
        "We are using the ARTIC network’s nCoV-2019 novel coronavirus bioinformatics protocol for nanopore sequencing, which can be found ",
      nanoporeLink: ARTIC_PIPELINE_LINK,
      nanoporeClickedLinkEvent:
        ANALYTICS_EVENT_NAMES.UPLOAD_SAMPLE_STEP_CG_ARTIC_PIPELINE_LINK_CLICKED,
      nanoporeContent: renderCGNanoporeContent(),
      nanoporeDisabledTooltipText: `This pipeline only supports upload from your computer${
        s3UploadEnabled ? " or S3" : ""
      }.`,
    },
  ];

  const shouldDisableWorkflowOption = (workflow: string) => {
    const workflowIsCurrentlySelected = selectedWorkflows.has(workflow);
    const selectedMNGSNanopore =
      selectedWorkflows.has(UPLOAD_WORKFLOWS.MNGS.value) &&
      selectedTechnology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE;
    switch (workflow) {
      case UPLOAD_WORKFLOWS.MNGS.value:
        return (
          !workflowIsCurrentlySelected &&
          selectedWorkflows.has(UPLOAD_WORKFLOWS.CONSENSUS_GENOME.value)
        );
      case UPLOAD_WORKFLOWS.AMR.value:
        return (
          !workflowIsCurrentlySelected &&
          (selectedWorkflows.has(UPLOAD_WORKFLOWS.CONSENSUS_GENOME.value) ||
            selectedMNGSNanopore)
        );
      case UPLOAD_WORKFLOWS.CONSENSUS_GENOME.value:
        return !workflowIsCurrentlySelected && size(selectedWorkflows) > 0;
    }
  };

  const shouldDisableTechnologyOption = (
    technology: Technology,
    workflow: UploadWorkflows,
  ) => {
    switch (currentTab) {
      case REMOTE_UPLOAD:
        return (
          technology === NANOPORE && workflow === UPLOAD_WORKFLOWS.MNGS.value
        );
      case BASESPACE_UPLOAD:
        return technology === NANOPORE;
      case LOCAL_UPLOAD:
        return false;
    }
  };

  const renderAnalysisTypes = () =>
    compact(
      map(
        ({
          beta,
          description,
          shouldHideOption,
          otherOptions,
          title,
          sdsIcon,
          workflow,
        }) => {
          if (shouldHideOption) return;

          const analysisOptionSelected = selectedWorkflows.has(workflow);
          const shouldDisableOption =
            allowedFeatures.includes(AMR_V1_FEATURE) &&
            shouldDisableWorkflowOption(workflow);

          let radioOption = allowedFeatures.includes(AMR_V1_FEATURE) ? (
            <InputCheckbox
              disabled={shouldDisableOption}
              className={cs.checkbox}
              stage={analysisOptionSelected ? "checked" : "unchecked"}
            />
          ) : (
            <InputRadio
              stage={analysisOptionSelected ? "checked" : "unchecked"}
              className={cs.radioButton}
            />
          );

          if (
            allowedFeatures.includes(AMR_V1_FEATURE) &&
            shouldDisableOption &&
            workflowOptionHovered === workflow
          ) {
            const tooltipText =
              "This is disabled because this pipeline cannot be run with the current selection.";
            radioOption = (
              <Tooltip open arrow placement="top" title={tooltipText}>
                <span>{radioOption}</span>
              </Tooltip>
            );
          }
          return (
            <div
              className={cx(
                cs.selectableOption,
                analysisOptionSelected && cs.selected,
                shouldDisableOption && cs.disabled,
              )}
              onClick={() =>
                shouldDisableOption ? null : onWorkflowToggle(workflow)
              }
              onMouseEnter={() => setWorkflowOptionHovered(workflow)}
              onMouseLeave={() => setWorkflowOptionHovered(null)}
              key={title}
              data-testid={`analysis-type-${kebabCase(title)}`}
            >
              {radioOption}
              <div className={cs.iconSample}>
                <Icon
                  sdsIcon={sdsIcon}
                  sdsSize="xl"
                  sdsType="static"
                  className={shouldDisableOption && cs.disabledIcon}
                />
              </div>
              <div className={cs.optionText}>
                <div className={cx(cs.title, beta && cs.alignBetaIcon)}>
                  <span>{title}</span>
                  {beta && (
                    <span className={cs.statusLabel}>
                      <StatusLabel
                        className={shouldDisableOption && cs.disabledStatus}
                        inline
                        status="Beta"
                        type="beta"
                      />
                    </span>
                  )}
                </div>
                <div className={cs.description}>{description}</div>
                {analysisOptionSelected && otherOptions && otherOptions()}
              </div>
            </div>
          );
        },
        WORKFLOW_UPLOAD_OPTIONS,
      ),
    );

  return (
    <div className={cs.workflowSelector}>
      <div className={cs.header}>Analysis Type</div>
      {renderAnalysisTypes()}
    </div>
  );
};

export default WorkflowSelector;
