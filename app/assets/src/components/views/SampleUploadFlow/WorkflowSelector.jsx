import cx from "classnames";
import { Checkbox, Icon, Tooltip } from "czifui";
import { compact, find, map, size } from "lodash/fp";
import React, { useState, useContext } from "react";

import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import SectionsDropdown from "~/components/ui/controls/dropdowns/SectionsDropdown";
import { IconInfoSmall } from "~/components/ui/icons";
import {
  ARTIC_PIPELINE_LINK,
  CG_ILLUMINA_PIPELINE_GITHUB_LINK,
  MNGS_ILLUMINA_PIPELINE_GITHUB_LINK,
  UPLOAD_SAMPLE_PIPELINE_OVERVIEW_LINK,
} from "~/components/utils/documentationLinks";
import { AMR_V1_FEATURE, ONT_V1_FEATURE } from "~/components/utils/features";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import RadioButton from "~ui/controls/RadioButton";
import Toggle from "~ui/controls/Toggle";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import StatusLabel from "~ui/labels/StatusLabel";
import PropTypes from "~utils/propTypes";
import { WORKFLOWS } from "~utils/workflows";

import {
  CG_WETLAB_OPTIONS,
  CG_TECHNOLOGY_OPTIONS,
  CG_NANOPORE_WETLAB_OPTIONS,
  GUPPY_BASECALLER_SETTINGS,
  MEDAKA_MODEL_OPTIONS,
  WORKFLOW_DISPLAY_NAMES,
} from "./constants";
import cs from "./workflow_selector.scss";

const WorkflowSelector = ({
  onClearLabsChange,
  onMedakaModelChange,
  onTechnologyToggle,
  onGuppyBasecallerSettingChange,
  onWetlabProtocolChange,
  onWorkflowToggle,
  selectedMedakaModel,
  selectedGuppyBasecallerSetting,
  selectedTechnology,
  selectedWetlabProtocol,
  selectedWorkflows,
  usedClearLabs,
}) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};
  const [workflowOptionHovered, setWorkflowOptionHovered] = useState(null);

  const renderTechnologyOptions = (workflowKey) => {
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

  const renderIlluminaOption = (workflowKey) => {
    const workflowObject = find(w => w.workflow === workflowKey, WORKFLOW_UPLOAD_OPTIONS);
    const illuminaTechnologyOptionSelected =
      selectedTechnology === CG_TECHNOLOGY_OPTIONS.ILLUMINA;

    return (
      <div
        className={cx(
          cs.selectableOption,
          cs.technology,
          illuminaTechnologyOptionSelected && cs.selected,
        )}
        onClick={() => onTechnologyToggle(CG_TECHNOLOGY_OPTIONS.ILLUMINA, workflowKey)}
      >
        <RadioButton
          selected={illuminaTechnologyOptionSelected}
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
            {selectedWorkflows.has(WORKFLOWS.CONSENSUS_GENOME.value) &&
              illuminaTechnologyOptionSelected &&
              renderWetlabSelector(CG_TECHNOLOGY_OPTIONS.ILLUMINA)}
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
            trigger={<IconInfoSmall className={cs.infoIcon} />}
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
            onChange={label => onClearLabsChange(label === "Yes")}
          />
        </div>
      </div>

      {/* If uploading ClearLabs samples, only allow default wetlab and medaka model options. */}
      {!usedClearLabs ? (
        <>
          {renderWetlabSelector(CG_TECHNOLOGY_OPTIONS.NANOPORE)}
          <div className={cs.item}>
            <div className={cs.subheader}>
              Medaka Model:
              <ColumnHeaderTooltip
                trigger={<IconInfoSmall className={cs.infoIcon} />}
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
              onChange={val => onMedakaModelChange(val)}
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
                trigger={<IconInfoSmall className={cs.infoIcon} />}
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

  const renderNanoporeOption = (workflowKey) => {
    const workflowObject = find(w => w.workflow === workflowKey, WORKFLOW_UPLOAD_OPTIONS);
    const nanoporeTechnologyOptionSelected =
      selectedTechnology === CG_TECHNOLOGY_OPTIONS.NANOPORE;
    return (
      <div
        className={cx(
          cs.selectableOption,
          cs.technology,
          nanoporeTechnologyOptionSelected && cs.selected,
        )}
        onClick={() => onTechnologyToggle(CG_TECHNOLOGY_OPTIONS.NANOPORE, workflowKey)}
      >
        <RadioButton
          selected={nanoporeTechnologyOptionSelected}
          className={cx(cs.radioButton, cs.alignTitle)}
        />
        <div className={cs.optionText}>
          <div className={cs.title}>
          Nanopore
          {workflowKey === WORKFLOWS.SHORT_READ_MNGS.value && (
                    <StatusLabel
                      inline
                      status="Beta"
                      type="beta"
                    />
                  )}</div>

          <div className={cs.technologyDescription}>
            {workflowObject.nanoporeText}

            {createExternalLink({
              analyticsEventName: workflowObject.nanoporeClickedLinkEvent,
              content: "here",
              link: workflowObject.nanoporeLink,
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
  }) => (
    <ExternalLink
      href={link}
      analyticsEventName={analyticsEventName}
      className={cx(cs.externalLink, additionalStyle && additionalStyle)}
    >
      {content}
    </ExternalLink>
  );

  const renderWetlabSelector = technology => {
    return (
      <div className={cs.item}>
        <div className={cs.subheader}>Wetlab Protocol&#58;</div>
        <Dropdown
          className={cs.dropdown}
          onChange={value => {
            onWetlabProtocolChange(value);
            trackEvent("WorkflowSelector_wetlab-protocol_selected", {
              wetlabOption: value,
            });
          }}
          options={
            technology === CG_TECHNOLOGY_OPTIONS.ILLUMINA
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
            trigger={<IconInfoSmall className={cs.infoIcon} />}
            content={
              "This specifies which version of the base calling software 'Guppy' was used to generate the data. This will affect the pipeline parameters."
            }
            position={"top center"}
            link={""} // TODO update link for guppy basecaller
          /></div>
        <Dropdown
          className={cs.dropdown}
          options={GUPPY_BASECALLER_SETTINGS}
          placeholder="Select"
          value={selectedGuppyBasecallerSetting}
          onChange={value => onGuppyBasecallerSettingChange(value)}
        ></Dropdown>
      </div>
    );
  };

  // `sdsIcon` maps directly with czifui Icon component prop: sdsIcon
  const WORKFLOW_UPLOAD_OPTIONS = [
    {
      workflow: WORKFLOWS.SHORT_READ_MNGS.value,
      title: WORKFLOW_DISPLAY_NAMES[WORKFLOWS.SHORT_READ_MNGS.value],
      description: allowedFeatures.includes(ONT_V1_FEATURE) ?
        "Run your samples through our metagenomics pipeline. Our pipeline supports Illumina and Nanopore technologies."
        : "Run your samples through our metagenomics pipeline. Our pipeline only supports Illumina.",
      otherOptions: allowedFeatures.includes(ONT_V1_FEATURE) ? () => renderTechnologyOptions(WORKFLOWS.SHORT_READ_MNGS.value) : null,
      beta: false,
      sdsIcon: "dna",
      illuminaText: "You can check out the Illumina pipeline on GitHub ",
      illuminaLink: MNGS_ILLUMINA_PIPELINE_GITHUB_LINK, // TODO there might be a more specific link than the current one
      illuminaClickedLinkEvent: "", // TODO add analytics here and below
      nanoporeText: "You can check out the Nanopore pipeline on Github ",
      nanoporeLink: "", // TODO add link once available
      nanoporeClickedLinkEvent: "",
      nanoporeContent: renderMNGSNanoporeContent(),
    },
    {
      workflow: WORKFLOWS.AMR.value,
      title: WORKFLOW_DISPLAY_NAMES[WORKFLOWS.AMR.value],
      description:
        "Run your samples through our antimicrobial resistance pipeline. Our pipeline supports metagenomics or whole genome data. It only supports Illumina.",
      beta: true,
      sdsIcon: "bacteria",
      shouldHideOption: !allowedFeatures.includes(AMR_V1_FEATURE),
    },
    {
      workflow: WORKFLOWS.CONSENSUS_GENOME.value,
      title: WORKFLOW_DISPLAY_NAMES[WORKFLOWS.CONSENSUS_GENOME.value],
      description:
        "Run your samples through our Illumina or Nanopore supported pipelines to get consensus genomes for SARS-CoV-2.",
      otherOptions: () => renderTechnologyOptions(WORKFLOWS.CONSENSUS_GENOME.value),
      beta: false,
      sdsIcon: "virus",
      illuminaText: "You can check out the Illumina pipeline on GitHub ",
      illuminaLink: CG_ILLUMINA_PIPELINE_GITHUB_LINK,
      illuminaClickedLinkEvent: ANALYTICS_EVENT_NAMES.UPLOAD_SAMPLE_CG_ILLUMINA_PIPELINE_GITHUB_LINK_CLICKED,
      nanoporeText: "We are using the ARTIC network’s nCoV-2019 novel coronavirus bioinformatics protocol for nanopore sequencing, which can be found ",
      nanoporeLink: ARTIC_PIPELINE_LINK,
      nanoporeClickedLinkEvent: ANALYTICS_EVENT_NAMES.UPLOAD_SAMPLE_STEP_CG_ARTIC_PIPELINE_LINK_CLICKED,
      nanoporeContent: renderCGNanoporeContent(),
    },
  ];

  const shouldDisableWorkflowOption = workflow => {
    const workflowIsCurrentlySelected = selectedWorkflows.has(workflow);
    const selectedMNGSNanopore = selectedWorkflows.has(WORKFLOWS.SHORT_READ_MNGS.value) && selectedTechnology === CG_TECHNOLOGY_OPTIONS.NANOPORE;
    switch (workflow) {
      case WORKFLOWS.SHORT_READ_MNGS.value:
        return (
          !workflowIsCurrentlySelected &&
          selectedWorkflows.has(WORKFLOWS.CONSENSUS_GENOME.value)
        );
      case WORKFLOWS.AMR.value:
        return (
          !workflowIsCurrentlySelected &&
          (selectedWorkflows.has(WORKFLOWS.CONSENSUS_GENOME.value) || selectedMNGSNanopore)
        );
      case WORKFLOWS.CONSENSUS_GENOME.value:
        return !workflowIsCurrentlySelected && size(selectedWorkflows) > 0;
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
            <Checkbox
              disabled={shouldDisableOption}
              className={cs.checkbox}
              stage={analysisOptionSelected ? "checked" : "unchecked"}
            />
          ) : (
            <RadioButton
              selected={analysisOptionSelected}
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
            >
              {radioOption}
              <div className={cs.iconSample}>
                <Icon sdsIcon={sdsIcon} sdsSize="xl" sdsType="static" />
              </div>
              <div className={cs.optionText}>
                <div className={cs.title}>
                  {title}
                  {beta && (
                    <StatusLabel
                      className={shouldDisableOption && cs.disabledStatus}
                      inline
                      status="Beta"
                      type="beta"
                    />
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

WorkflowSelector.propTypes = {
  onClearLabsChange: PropTypes.func,
  onMedakaModelChange: PropTypes.func,
  onTechnologyToggle: PropTypes.func,
  onGuppyBasecallerSettingChange: PropTypes.func,
  onWetlabProtocolChange: PropTypes.func,
  onWorkflowToggle: PropTypes.func,
  selectedMedakaModel: PropTypes.string,
  selectedGuppyBasecallerSetting: PropTypes.string,
  selectedTechnology: PropTypes.string,
  selectedWetlabProtocol: PropTypes.string,
  selectedWorkflows: PropTypes.instanceOf(Set),
  usedClearLabs: PropTypes.bool,
};

export default WorkflowSelector;
