import PropTypes from "prop-types";
import React from "react";
import SearchBox from "./SearchBox";
import cs from "./category_search_box.scss";

const CategorySearchBox = props => {
  return (
    <div className={cs.categorySearchBox}>
      <SearchBox category {...props} />
    </div>
  );
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
