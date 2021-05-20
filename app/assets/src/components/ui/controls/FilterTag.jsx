import cx from "classnames";
import React from "react";

import Label from "~/components/ui/labels/Label";
import PropTypes from "~/components/utils/propTypes";
import Icon from "~ui/icons/Icon";

import cs from "./filter_tag.scss";

export default class FilterTag extends React.Component {
  render() {
    const { text, onClose, className } = this.props;
    const labelText = (
      <React.Fragment>
        {text}
        <Icon name="close" onClick={onClose} />
      </React.Fragment>
    );

    return (
      <Label
        className={cx(cs.filterTag, className)}
        size="tiny"
        text={labelText}
      />
    );
  }
}

FilterTag.propTypes = {
  text: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string,
};
