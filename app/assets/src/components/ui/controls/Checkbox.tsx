import cx from "classnames";
import React from "react";
import cs from "./checkbox.scss";

interface CheckboxProps {
  className?: string;
  checked?: boolean;
  disabled?: boolean;
  label?: string | React.ReactElement;
  onChange?: $TSFixMeFunction;
  value?: string | number;
  testId?: string;
}

interface CheckboxState {
  isChecked: boolean;
}
class Checkbox extends React.Component<CheckboxProps, CheckboxState> {
  static defaultProps: CheckboxProps;
  constructor(props) {
    super(props);

    this.state = {
      isChecked: false,
    };

    this.handleClick = this.handleClick.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    if (props.checked !== state.oldIsChecked) {
      return {
        isChecked: props.checked,
        oldIsChecked: props.checked,
      };
    }
    return null;
  }

  handleClick(event) {
    const { value, onChange } = this.props;

    event.stopPropagation();
    this.setState({ isChecked: !this.state.isChecked }, () => {
      onChange(value, this.state.isChecked, event);
    });
  }

  render() {
    const { disabled, label, value, className, testId } = this.props;
    const { isChecked } = this.state;

    return (
      <div
        className={cx(cs.checkbox, className, disabled && cs.disabled)}
        onClick={disabled ? null : this.handleClick}
        data-testid={testId}
      >
        <input
          type="checkbox"
          value={value}
          checked={isChecked}
          readOnly={true}
          disabled={disabled}
        />
        <span className={cs.checkmark} />
        {label && <span className={cs.label}>{label}</span>}
      </div>
    );
  }
}

Checkbox.defaultProps = {
  checked: false,
};

export default Checkbox;
