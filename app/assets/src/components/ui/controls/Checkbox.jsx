import React from "react";
import PropTypes from "prop-types";

class Checkbox extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isChecked: false
    };

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event) {
    const { value, onChange } = this.props;

    event.stopPropagation();
    this.setState({ isChecked: !this.state.isChecked }, () => {
      onChange(value, this.state.isChecked, event);
    });
  }

  render() {
    const { disabled, label, value } = this.props;
    const { isChecked } = this.state;

    return (
      <div className="idseq-ui input checkbox" onClick={this.handleClick}>
        <input
          type="checkbox"
          value={value}
          checked={isChecked}
          readOnly={true}
          disabled={disabled}
        />
        <span className="checkmark" />
        <span className="label">{label}</span>
      </div>
    );
  }
}

Checkbox.defaultProps = {
  checked: false
};

Checkbox.propTypes = {
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default Checkbox;
