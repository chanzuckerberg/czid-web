import React from "react";
import PropTypes from "prop-types";
import cs from "./filter_tag.scss";
import { Label, Icon } from "semantic-ui-react";

const FilterTag = props => {
  return (
    <Label className={cs.filterTag} size="tiny">
      {props.text}
      <Icon name="close" onClick={props.onClose} />
    </Label>
  );
};

FilterTag.propTypes = {
  text: PropTypes.string,
  onClose: PropTypes.func
};

export default FilterTag;
