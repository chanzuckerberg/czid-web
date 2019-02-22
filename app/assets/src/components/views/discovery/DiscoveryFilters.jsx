import React from "react";
import PropTypes from "prop-types";
import LabeledDropdown from "../../ui/controls/dropdowns/LabeledDropdown";
import { MultipleDropdown } from "../../ui/controls/dropdowns";
import { find } from "lodash";
import Label from "~ui/labels/Label";
import cs from "./discovery_filters.scss";

class DiscoveryFilters extends React.Component {
  render() {
    const {
      pathogenOptions,
      pathogenValue,
      locationOptions,
      locationValue,
      tissueOptions,
      tissueValue,
      hostOptions,
      hostValue
    } = this.props;

    return (
      <div>
        <MultipleDropdown
          hideCounter
          rounded
          search
          checkedOnTop
          menuLabel="Select Columns"
          onChange={this.handleFilterSelectionChange}
          value={pathogenValue}
          options={pathogenOptions}
        />
        <div className={cs.labelList}>
          {pathogenOptions.map(option => <Label text={"temp"} />)}
        </div>
      </div>
    );
  }
}

export default DiscoveryFilters;
