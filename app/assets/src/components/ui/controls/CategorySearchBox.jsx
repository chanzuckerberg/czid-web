import PropTypes from "prop-types";
import React from "react";
import SearchBox from "./SearchBox";
import cs from "./category_search_box.scss"; /* eslint-disable-line */

const CategorySearchBox = props => {
  return <SearchBox category {...props} />;
};

CategorySearchBox.propTypes = {
  clientSearchSource: PropTypes.array,
  serverSearchAction: PropTypes.string,
  rounded: PropTypes.bool,
  initialValue: PropTypes.string,
  onResultSelect: PropTypes.func,
  placeholder: PropTypes.string
};

export default CategorySearchBox;
