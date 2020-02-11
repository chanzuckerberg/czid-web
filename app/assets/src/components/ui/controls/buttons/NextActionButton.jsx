// A button that displays a right-arrow to the right of the label.
// Useful for suggesting a "next action" to the user.
import React from "react";
import { Button as BaseButton } from "semantic-ui-react";
import PropTypes from "prop-types";
import cx from "classnames";

const NextActionButton = ({ label }) => {
  return (
    <BaseButton primary className={cx("idseq-ui next-action-button")}>
      {label}
      <i className={cx("fa fa-angle-right right-icon")} />
    </BaseButton>
  );
};

NextActionButton.propTypes = {
  label: PropTypes.string,
};

export default NextActionButton;
