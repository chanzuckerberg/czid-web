import { forEach, values, sortBy } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import { BaseMultipleFilter } from "~/components/common/filters";

class LocationFilter extends React.Component {
  expandParents = options => {
    let mergedOptions = {};
    forEach(option => {
      // Tally parents
      forEach(parent => {
        if (!mergedOptions[parent]) {
          mergedOptions[parent] = {
            text: parent,
            value: parent,
            count: option.count,
          };
        } else {
          mergedOptions[parent].count += option.count;
        }
      }, option.parents || []);

      // Tally current option
      const val = option.value;
      if (!mergedOptions[val]) {
        mergedOptions[val] = {
          text: option.text,
          value: val,
          count: option.count,
        };
      } else {
        mergedOptions[val].count += option.count;
      }
    }, options);
    return values(mergedOptions);
  };

  render() {
    const { options, ...otherProps } = this.props;

    return (
      <BaseMultipleFilter
        {...otherProps}
        options={sortBy("text", this.expandParents(options))}
      />
    );
  }
}

LocationFilter.propTypes = {
  options: PropTypes.array,
};

export default LocationFilter;
