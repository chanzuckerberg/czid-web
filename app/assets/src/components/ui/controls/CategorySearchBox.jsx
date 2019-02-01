import PropTypes from "prop-types";
import cx from "classnames";
import React from "react";
import cs from "./category_search_box.scss";
import SearchBox from "./SearchBox";

const CategorySearchBox = props => {
  return <SearchBox category {...props} />;
};

CategorySearchBox.propTypes = {
  // Provide either clientSearchSource or serverSearchAction.
  // If clientSearchSource is provided, query matching will happen on the client side (use for small data).
  // If serverSearchAction is provided, query matching will happen on the server side (use for large data).
  clientSearchSource: PropTypes.array,
  serverSearchAction: PropTypes.string,
  rounded: PropTypes.bool,
  initialValue: PropTypes.string,
  onResultSelect: PropTypes.func,
  placeholder: PropTypes.string
};

export default CategorySearchBox;
