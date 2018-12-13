import React from "react";
import PropTypes from "prop-types";
import { DateInput as BaseDateInput } from "semantic-ui-calendar-react";
import cs from "./date_input.scss";
import cx from "classnames";

class DateInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: this.props.value || ""
    };
  }

  handleChange = (_, { value }) => {
    this.setState({ value }, () => this.props.onChange(this.state.value));
  };

  render() {
    const { className, onChange, value, ...props } = this.props;
    return (
      <BaseDateInput
        fluid
        className={cx("idseq-ui", "input", cs.dateInput, className)}
        onChange={this.handleChange}
        value={this.state.value}
        dateFormat="YYYY-MM-DD"
        {...props}
      />
    );
  }
}

DateInput.propTypes = {
  className: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default DateInput;
