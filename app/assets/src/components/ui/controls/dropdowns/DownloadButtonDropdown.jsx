import { Icon } from "semantic-ui-react";
import { forbidExtraProps } from "airbnb-prop-types";
import ButtonDropdown from "./ButtonDropdown";
import PropTypes from "prop-types";
import React from "react";

const DownloadButtonDropdown = props => {
  return (
    <ButtonDropdown
      {...props}
      secondary
      fluid
      text="Download"
      icon={<Icon size="large" className={"cloud download alternate"} />}
    />
  );
};

DownloadButtonDropdown.propTypes = forbidExtraProps({
  disabled: PropTypes.bool,
  options: PropTypes.array,
  onClick: PropTypes.func,
  direction: PropTypes.oneOf(["left", "right"])
});

export default DownloadButtonDropdown;
