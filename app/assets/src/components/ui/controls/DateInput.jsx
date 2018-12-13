import React from "react";
import PropTypes from "prop-types";
import { DateInput as BaseDateInput } from "semantic-ui-calendar-react";
import cs from "./date_input.scss";
import cx from "classnames";
import { forbidExtraProps } from "airbnb-prop-types";

// TODO: fix styling limitations of the original component
// Styles of the date picker (table in popup) cannot be overridden
// (no specific classes and classname is not passed down)
class DateInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: this.props.value || ""
    };

    // variables used to emulate proper onBlur/onChange behavior
    this.focused = false;
    this.changedSinceBlur = false;
  }

  handleChange = (_, { value }) => {
    this.changedSinceBlur = true;
    this.setState({ value }, () => {
      this.props.onChange && this.props.onChange(this.state.value);
      if (!this.focused) {
        this.changedSinceBlur = false;
        this.props.onBlur && this.props.onBlur();
      }
    });
  };

  handleFocus = () => {
    this.focused = true;
  };

  handleBlur = () => {
    this.focused = false;
    if (this.changedSinceBlur) {
      this.props.onBlur && this.props.onBlur();
    }
  };

  render() {
    const { className, onBlur, onChange, value, ...props } = this.props;
    return (
      <BaseDateInput
        fluid
        className={cx("idseq-ui", "input", cs.dateInput, className)}
        onBlur={this.handleBlur}
        onChange={this.handleChange}
        value={this.state.value}
        dateFormat="YYYY-MM-DD"
        popupPosition="bottom left"
        {...props}
      />
    );
  }
}

DateInput.propTypes = forbidExtraProps({
  className: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
});

export default DateInput;
