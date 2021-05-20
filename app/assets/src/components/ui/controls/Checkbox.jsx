import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";

import cs from "./checkbox.scss";

class Checkbox extends React.Component {
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
    const { disabled, label, value, className } = this.props;
    const { isChecked } = this.state;

    return (
      <div className={cx(cs.checkbox, className)} onClick={this.handleClick}>
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

Checkbox.propTypes = {
  className: PropTypes.string,
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default Checkbox;
