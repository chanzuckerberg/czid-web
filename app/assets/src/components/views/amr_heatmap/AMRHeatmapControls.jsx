import React from "react";
import PropTypes from "prop-types";

import { Divider } from "~/components/layout";
import { Dropdown } from "~ui/controls/dropdowns";

import cs from "./amr_heatmap_view.scss";

export default class AMRHeatmapControls extends React.Component {
  constructor(props) {
    super(props);
  }

  generateChangeFunction(filter) {
    const { selectedOptions, onSelectedOptionsChange } = this.props;
    const changeFunction = option => {
      if (option !== selectedOptions[filter]) {
        onSelectedOptionsChange({ [filter]: option });
      }
    };
    return changeFunction;
  }

  renderFilterDropdowns() {
    const { filters, selectedOptions, hasData } = this.props;
    const filtersList = [];
    filters.forEach((filterOptionData, filter) => {
      filtersList.push(
        <div className="col s3">
          <Dropdown
            fluid
            rounded
            options={filterOptionData.options}
            onChange={this.generateChangeFunction(filter)}
            value={selectedOptions[filter]}
            label={filterOptionData.label}
            disabled={!hasData}
          />
        </div>
      );
    });
    return filtersList;
  }

  render() {
    return (
      <div className={cs.menu}>
        <Divider />
        <div className={`${cs.filterRow} row`}>
          {this.renderFilterDropdowns()}
        </div>
        <Divider />
      </div>
    );
  }
}

AMRHeatmapControls.propTypes = {
  filters: PropTypes.instanceOf(Map).isRequired,
  selectedOptions: PropTypes.shape({
    metric: PropTypes.string,
    viewLevel: PropTypes.string,
  }),
  onSelectedOptionsChange: PropTypes.func.isRequired,
  hasData: PropTypes.bool,
};
