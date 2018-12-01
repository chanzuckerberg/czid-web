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

    return (
      <BareDropdown trigger={trigger} className={cs.pipelineVersionDropdown}>
        <BareDropdown.Menu>
          {otherVersions.map(version => {
            return (
              <BareDropdown.Item
                onClick={() => this.props.onPipelineVersionSelect(version)}
                key={version}
              >
                {"Pipeline v" + version}
              </BareDropdown.Item>
            );
          })}
        </BareDropdown.Menu>
      </BareDropdown>
    );
  };

  render() {
    const { pipelineVersions, lastProcessedAt } = this.props;

    if (!lastProcessedAt) return null;

    // No version select.
    if (pipelineVersions.length <= 1) {
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
