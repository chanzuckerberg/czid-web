import React from "react";
import PropTypes from "prop-types";
import cs from "./filter_tag.scss";
import cx from "classnames";
import { Label, Icon } from "semantic-ui-react";

const FilterTag = props => {
  const { className, onClose, text } = props;
  return (
    <Label className={cx(className, cs.filterTag)} size="tiny">
      {text}
      <Icon name="close" onClick={onClose} />
    </Label>
  );
};

FilterTag.propTypes = {
  className: PropTypes.string,
  text: PropTypes.string,
  onClose: PropTypes.func
};

export default FilterTag;
