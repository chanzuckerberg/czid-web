import cx from "classnames";
import React from "react";
import { Radio } from "semantic-ui-react";

import cs from "./toggle.scss";

interface ToggleProps {
  className?: string;
  onChange?: $TSFixMeFunction;
  // Use isChecked when using custom logic to determine whether or not to toggle in the parent component
  isChecked?: boolean;
  onLabel: string;
  offLabel: string;
  initialChecked: boolean;
}

interface ToggleState {
  checked?: boolean;
}
/**
 * Extension of semantic-ui radio toggle that shows on/off labels. The current
 * label is sent to the onChange handler. The current state can be overriden
 * by passing in new props.
 */
class Toggle extends React.PureComponent<ToggleProps, ToggleState> {
  static defaultProps: ToggleProps;
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

Toggle.defaultProps = {
  onLabel: "On",
  offLabel: "Off",
  initialChecked: false,
};

export default Toggle;
