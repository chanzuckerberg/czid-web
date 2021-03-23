import React, { useContext } from "react";

import Dropdown from "~ui/controls/dropdowns/Dropdown";
import RadioButton from "~ui/controls/RadioButton";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import { IconInfoSmall } from "~/components/ui/icons";
import IconSample from "~ui/icons/IconSample";
import PropTypes from "~utils/propTypes";
import { WORKFLOWS } from "~utils/workflows";
import { UserContext } from "~/components/common/UserContext";
import { NANOPORE_FEATURE } from "~/components/utils/features";
import { CG_WETLAB_OPTIONS, CG_TECHNOLOGY_OPTIONS } from "./constants";
import { ANALYTICS_EVENT_NAMES, logAnalyticsEvent } from "~/api/analytics";
import {
  ARTIC_PIPELINE_LINK,
  CG_ILLUMINA_PIPELINE_GITHUB_LINK,
} from "~/components/utils/documentationLinks";

import cx from "classnames";
import cs from "./workflow_selector.scss";

const WorkflowSelector = ({
  onTechnologyToggle,
  onWetlabProtocolChange,
  onWorkflowToggle,
  selectedTechnology,
  selectedWetlabProtocol,
  selectedWorkflows,
}) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures = [] } = userContext || {};
  const nanoporeFeatureEnabled = allowedFeatures.includes(NANOPORE_FEATURE);

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

  const renderWetlabSelector = () => {
    return (
      <div className={cs.wetlabOption}>
        <div className={cs.title}>Wetlab protocol:</div>
        <Dropdown
          className={cs.dropdown}
          onChange={value => {
            onWetlabProtocolChange(value);
            !nanoporeFeatureEnabled &&
              onTechnologyToggle(CG_TECHNOLOGY_OPTIONS.ILLUMINA);

            logAnalyticsEvent("WorkflowSelector_wetlab-protocol_selected", {
              wetlabOption: value,
            });
          }}
          options={CG_WETLAB_OPTIONS}
          placeholder="Select"
          value={selectedWetlabProtocol}
        ></Dropdown>
      </div>
    );
  };

  const renderMngsAnalysisType = () => {
    return (
      <div
        className={cs.selectableOption}
        onClick={() => onWorkflowToggle(WORKFLOWS.SHORT_READ_MNGS.value)}
      >
        <RadioButton
          selected={selectedWorkflows.has(WORKFLOWS.SHORT_READ_MNGS.value)}
          className={cs.radioButton}
        />
        <IconSample className={cs.iconSample} />
        <div className={cs.optionText}>
          <div className={cs.title}>Metagenomics</div>
          <div className={cs.description}>
            Run your samples through our metagenomics pipeline. Our pipeline
            only supports Illumina.
          </div>
        </div>
      </div>
    );
  };

  const renderCGAnalysisType = () => {
    const cgWorkflowSelected = selectedWorkflows.has(
      WORKFLOWS.CONSENSUS_GENOME.value
    );
    return (
      <div
        className={cs.selectableOption}
        onClick={() => onWorkflowToggle(WORKFLOWS.CONSENSUS_GENOME.value)}
      >
        <RadioButton selected={cgWorkflowSelected} className={cs.radioButton} />
        <IconSample className={cs.iconSample} />
        <div className={cs.optionText}>
          <div className={cs.title}>SARS-CoV-2 Consensus Genome</div>
          <div className={cs.description}>
            Run your samples through our Illumina or Nanopore supported
            pipelines to get consensus genomes for SARS-CoV-2.
          </div>
          {cgWorkflowSelected &&
            (nanoporeFeatureEnabled
              ? renderTechnologyOptions()
              : renderWetlabSelector())}
        </div>
      </div>
    );
  };

  const renderTechnologyOptions = () => {
    return (
      <div className={cs.optionText}>
        <div className={cx(cs.title, cs.technologyTitle)}>
          Sequencing Platform:
          <div className={cs.technologyOptions}>
            {renderIlluminaOption()}
            {renderNanoporeOption()}
          </div>
        </div>
      </div>
    );
  };

  const renderIlluminaOption = () => {
    const illuminaTechnologyOptionSelected =
      selectedTechnology === CG_TECHNOLOGY_OPTIONS.ILLUMINA;

    return (
      <div
        className={cx(cs.selectableOption, cs.technology)}
        onClick={() => onTechnologyToggle(CG_TECHNOLOGY_OPTIONS.ILLUMINA)}
      >
        <RadioButton
          selected={illuminaTechnologyOptionSelected}
          className={cs.radioButton}
        />
        <div className={cs.optionText}>
          <div className={cs.title}>Illumina</div>
          <div className={cs.technologyDescription}>
            You can check out the Illumina pipeline on GitHub{" "}
            {createExternalLink({
              analyticsEventName:
                ANALYTICS_EVENT_NAMES.UPLOAD_SAMPLE_CG_ILLUMINA_PIPELINE_GITHUB_LINK_CLICKED,
              content: "here",
              link: CG_ILLUMINA_PIPELINE_GITHUB_LINK,
            })}
            .
          </div>
          {selectedWorkflows.has(WORKFLOWS.CONSENSUS_GENOME.value) &&
            illuminaTechnologyOptionSelected &&
            renderWetlabSelector()}
        </div>
      </div>
    );
  };

  const renderNanoporeContent = () => (
    <div className={cs.nanoporeContent}>
      <div className={cs.item}>
        <div className={cs.subheader}>Wetlab Protocol&#58;</div>
        <div className={cs.description}>ARTIC v3</div>
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
        <div className={cs.description}>r941_min_fast_g303</div>
      </div>
    </div>
  );

  const renderNanoporeOption = () => {
    const nanoporeTechnologyOptionSelected =
      selectedTechnology === CG_TECHNOLOGY_OPTIONS.NANOPORE;
    return (
      <div
        className={cx(cs.selectableOption, cs.technology)}
        onClick={() => onTechnologyToggle(CG_TECHNOLOGY_OPTIONS.NANOPORE)}
      >
        <RadioButton
          selected={nanoporeTechnologyOptionSelected}
          className={cs.radioButton}
        />
        <div className={cs.optionText}>
          <div className={cs.title}>Nanopore</div>
          <div className={cs.technologyDescription}>
            We are using the ARTIC network’s nCoV-2019 novel coronavirus
            bioinformatics pipeline for Nanopore sequencing, which can be found{" "}
            {createExternalLink({
              analyticsEventName:
                ANALYTICS_EVENT_NAMES.UPLOAD_SAMPLE_STEP_CG_ARTIC_PIPELINE_LINK_CLICKED,
              content: "here",
              link: ARTIC_PIPELINE_LINK,
            })}
            .
          </div>
          {nanoporeTechnologyOptionSelected && renderNanoporeContent()}
        </div>
      </div>
    );
  };

  return (
    <div className={cs.workflowSelector}>
      <div className={cs.header}>Analysis Type</div>
      {renderMngsAnalysisType()}
      {renderCGAnalysisType()}
    </div>
  );
};

WorkflowSelector.propTypes = {
  onTechnologyToggle: PropTypes.func,
  onWetlabProtocolChange: PropTypes.func,
  onWorkflowToggle: PropTypes.func,
  selectedTechnology: PropTypes.string,
  selectedWetlabProtocol: PropTypes.string,
  selectedWorkflows: PropTypes.instanceOf(Set),
};

export default WorkflowSelector;
