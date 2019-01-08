import React from "react";
import moment from "moment";
import BasicPopup from "~/components/BasicPopup";
import BareDropdown from "~/components/ui/controls/dropdowns/BareDropdown";
import PropTypes from "~/components/utils/propTypes";
import cs from "./sample_view.scss";

class PipelineVersionSelect extends React.Component {
  getLastProcessedString = () => {
    const lastProcessedFormattedDate = moment(this.props.lastProcessedAt)
      .startOf("second")
      .fromNow();

    return `processed ${lastProcessedFormattedDate}`;
  };

  renderPipelineVersionDropdown = () => {
    const otherVersions = this.props.pipelineVersions.filter(
      v => v !== this.props.pipelineRun.pipeline_version
    );

    const trigger = (
      <span className={cs.dropdownTrigger}>
        {this.getLastProcessedString()}
      </span>
    );

    const options = otherVersions.map(version => ({
      text: `Pipeline v${version}`,
      value: version
    }));

    return (
      <BareDropdown
        trigger={trigger}
        className={cs.pipelineVersionDropdown}
        options={options}
        onChange={this.props.onPipelineVersionSelect}
      />
    );
  };

  render() {
    const { pipelineVersions, lastProcessedAt, pipelineRun } = this.props;

    if (!lastProcessedAt) return null;

    // Don't show selector if there's only 1 version and it's the current one.
    // Note: If the latest/any run failed it won't be in the pipelineVersions.
    if (
      pipelineVersions.length === 0 ||
      (pipelineVersions.length === 1 &&
        pipelineVersions[0] === pipelineRun.pipeline_version)
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
  lastProcessedAt: PropTypes.string, // Actually a datestring.
  onPipelineVersionSelect: PropTypes.func.isRequired
};

export default PipelineVersionSelect;
