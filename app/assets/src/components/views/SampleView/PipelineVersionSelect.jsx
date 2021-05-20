import moment from "moment";
import React from "react";
import BasicPopup from "~/components/BasicPopup";
import BareDropdown from "~/components/ui/controls/dropdowns/BareDropdown";
import PropTypes from "~/components/utils/propTypes";

import cs from "./pipeline_version_select.scss";

class PipelineVersionSelect extends React.Component {
  getLastProcessedString = () => {
    const lastProcessedFormattedDate = moment(this.props.lastProcessedAt)
      .startOf("second")
      .fromNow();

    return `processed ${lastProcessedFormattedDate}`;
  };

  renderPipelineVersionDropdown = () => {
    const {
      pipelineVersions,
      pipelineRun,
      versionKey,
      onPipelineVersionSelect,
    } = this.props;
    const otherVersions = pipelineVersions.filter(
      v => v !== pipelineRun[versionKey]
    );

    const trigger = (
      <span className={cs.dropdownTrigger}>
        {this.getLastProcessedString()}
      </span>
    );

    const options = otherVersions.map(version => ({
      text: `Pipeline v${version}`,
      value: version,
    }));

    return (
      <BareDropdown
        trigger={trigger}
        options={options}
        onChange={onPipelineVersionSelect}
        smallArrow
      />
    );
  };

  render() {
    const {
      pipelineVersions,
      lastProcessedAt,
      pipelineRun,
      versionKey,
    } = this.props;

    if (!lastProcessedAt) return null;

    // Don't show selector if there's only 1 version and it's the current one.
    // Note: If the latest/any run failed it won't be in the pipelineVersions.
    if (
      pipelineVersions.length === 0 ||
      (pipelineVersions.length === 1 &&
        pipelineVersions[0] === pipelineRun[versionKey])
    ) {
      return (
        <span className={cs.pipelineVersionSelectContainer}>
          | {this.getLastProcessedString()}
        </span>
      );
    }

    // Show a dropdown menu for version selection.
    const trigger = (
      <div className={cs.pipelineVersionSelectContainer}>
        <div className={cs.pipelineVersionSelect}>
          {"| "}
          {this.renderPipelineVersionDropdown()}
        </div>
      </div>
    );

    return <BasicPopup trigger={trigger} content="Select Report Version" />;
  }
}

PipelineVersionSelect.propTypes = {
  pipelineRun: PropTypes.PipelineRun,
  pipelineVersions: PropTypes.arrayOf(PropTypes.string),
  versionKey: PropTypes.string,
  lastProcessedAt: PropTypes.string, // Actually a datestring.
  onPipelineVersionSelect: PropTypes.func.isRequired,
};

export default PipelineVersionSelect;
