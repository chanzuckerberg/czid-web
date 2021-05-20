import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { Radio } from "semantic-ui-react";

import cs from "./toggle.scss";

/**
 * Extension of semantic-ui radio toggle that shows on/off labels. The current
 * label is sent to the onChange handler. The current state can be overriden
 * by passing in new props.
 */
class Toggle extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }

  // For "apply all" to work, it needs to override local state
  static getDerivedStateFromProps(props, state) {
    if (props.initialChecked !== state.prevInitialChecked) {
      return {
        prevInitialChecked: props.initialChecked,
        checked: props.initialChecked,
      };
    } else {
      return {
        prevInitialChecked: props.initialChecked,
        checked: state.checked,
      };
    }
  }

  render() {
    const { onLabel, offLabel, onChange, isChecked } = this.props;
    return (
      <Radio
        toggle
        checked={isChecked !== undefined ? isChecked : this.state.checked}
        label={this.state.checked ? onLabel : offLabel}
        onChange={(_, inputProps) => {
          const checked =
            isChecked !== undefined ? isChecked : inputProps.checked;
          this.setState({ checked: checked });
          onChange && onChange(checked ? onLabel : offLabel);
        }}
        className={cx(this.props.className, cs.toggle)}
      />
    );
  }
}

Toggle.propTypes = {
  className: PropTypes.string,
  onChange: PropTypes.func,
  // Use isChecked when using custom logic to determine whether or not to toggle in the parent component
  isChecked: PropTypes.bool,
  onLabel: PropTypes.string.isRequired,
  offLabel: PropTypes.string.isRequired,
  initialChecked: PropTypes.bool.isRequired,
};

Toggle.defaultProps = {
  onLabel: "On",
  offLabel: "Off",
  initialChecked: false,
};

export default Toggle;
