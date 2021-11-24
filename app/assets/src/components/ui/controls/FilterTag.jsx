import cx from "classnames";
import React from "react";

import Label from "~/components/ui/labels/Label";
import PropTypes from "~/components/utils/propTypes";
import Icon from "~ui/icons/Icon";

import cs from "./filter_tag.scss";

const FilterTag = ({ text, onClose, className }) => {
  const labelText = (
    <>
      {text}
      {onClose && <Icon name="close" onClick={onClose} />}
    </>
  );

  return (
    <Label
      className={cx(cs.filterTag, className)}
      size="tiny"
      text={labelText}
    />
  );
};

FilterTag.propTypes = {
  text: PropTypes.string,
  onClose: PropTypes.func,
  className: PropTypes.string,
};

export default FilterTag;
