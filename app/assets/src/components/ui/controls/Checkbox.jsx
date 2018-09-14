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

  handleClick() {
    const { value, onChange } = this.props;

    this.setState(
      ({ isChecked }) => ({
        isChecked: !isChecked
      }),
      () => onChange(value, this.state.isChecked)
    );
  }

  render() {
    const { value } = this.props;
    const { isChecked } = this.state;

    return (
      <div className="checkbox" onClick={this.handleClick}>
        <input
          className="idseq-ui input test"
          type="checkbox"
          value={value}
          checked={isChecked}
        />
      </div>
    );
  }
}

Checkbox.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired
};

export default Checkbox;
