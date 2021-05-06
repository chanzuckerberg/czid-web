import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import { Divider } from "~/components/layout";
import { Dropdown } from "~ui/controls/dropdowns";
import SequentialLegendVis from "~/components/visualizations/legends/SequentialLegendVis.jsx";

import cs from "./amr_heatmap_view.scss";

export default class AMRHeatmapControls extends React.Component {
  handleOptionChange(control, option) {
    const { selectedOptions, onSelectedOptionsChange } = this.props;
    if (option !== selectedOptions[control]) {
      onSelectedOptionsChange({ [control]: option });
    }
  }

  renderControlDropdowns() {
    const { controls, selectedOptions, isDataReady } = this.props;
    const controlsList = controls.map(control => {
      return (
        <div className={cs.filterControl} key={control.key}>
          <Dropdown
            fluid
            rounded
            options={control.options}
            onChange={option => this.handleOptionChange(control.key, option)}
            value={selectedOptions[control.key]}
            label={control.label}
            disabled={!isDataReady}
          />
        </div>
      );
    });
    return controlsList;
  }

  renderLegend() {
    const { isDataReady, maxValueForLegend, selectedOptions } = this.props;
    // Don't render a color legend if the heatmap is still loading
    if (!isDataReady) {
      return;
    }
    return (
      <div className={cs.filterControl} key="SequentialLegendVis">
        <SequentialLegendVis
          min={0}
          max={maxValueForLegend}
          scale={selectedOptions.scale}
        />
      </div>
    );
  }

  render() {
    return (
      <div className={cs.menu}>
        <Divider />
        <div className={cx(cs.filterRow, "row")}>
          {this.renderControlDropdowns()}
          {this.renderLegend()}
        </div>
        <Divider />
      </div>
    );
  }
}

AMRHeatmapControls.propTypes = {
  controls: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          text: PropTypes.string,
          value: PropTypes.string,
        })
      ),
      label: PropTypes.string,
    })
  ),
  selectedOptions: PropTypes.shape({
    metric: PropTypes.string,
    viewLevel: PropTypes.string,
    scale: PropTypes.string,
  }),
  onSelectedOptionsChange: PropTypes.func.isRequired,
  isDataReady: PropTypes.bool,
  maxValueForLegend: PropTypes.number,
};
