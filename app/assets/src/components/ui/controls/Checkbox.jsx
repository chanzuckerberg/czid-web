import React from "react";
import PropTypes from "prop-types";

class Checkbox extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isChecked: this.props.checked
    };

    this.handleClick = this.handleClick.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    if (props.checked !== state.isChecked) {
      return {
        isChecked: props.checked
      };
    }
    return null;
  }

  handleClick() {
    console.log(
      "Checkbox::handleClick",
      this.props,
      this.state,
      !this.state.isChecked
    );
    const { value, onChange } = this.props;

    this.setState({ isChecked: !this.state.isChecked }, () => {
      console.log(
        "Checkbox::handleClick - before on change",
        this.state.isChecked
      );
      onChange(value, this.state.isChecked);
    });
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
