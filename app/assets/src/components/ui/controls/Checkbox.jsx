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

  static getDerivedStateFromProps(props, state) {
    if (props.checked !== state.oldIsChecked) {
      return {
        isChecked: props.checked,
        oldIsChecked: props.checked
      };
    }
    return null;
  }

  handleClick() {
    const { value, onChange } = this.props;

    this.setState({ isChecked: !this.state.isChecked }, () => {
      onChange(value, this.state.isChecked);
    });
  }

  render() {
    const { value } = this.props;
    const { isChecked } = this.state;

    return (
      <div className="idseq-ui input checkbox" onClick={this.handleClick}>
        <input
          type="checkbox"
          value={value}
          checked={isChecked}
          readOnly={true}
        />
      </div>
    );
  }
}

Checkbox.defaultProps = {
  checked: false
};

Checkbox.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

export default Checkbox;
