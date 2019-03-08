import React from "react";
import PropTypes from "prop-types";
import { DateInput as BaseDateInput } from "semantic-ui-calendar-react";
import cs from "./date_input.scss";
import cx from "classnames";
import { forbidExtraProps } from "airbnb-prop-types";

// TODO: fix limitations of the original component
// 1) Styles of the date picker (table in popup) cannot be overridden
// (no specific classes and classname is not passed down)
// 2) Events onBlur and onChange do not behave as expected, as when
// user clicks a date onBlur fires before onChange (triggering onBlur
// manually would create problems with async setState)
class DateInput extends React.Component {
  handleChange = (_, { value }) => {
    this.props.onChange(value);
  };

  render() {
    const { className } = this.props;
    return (
      <BaseDateInput
        fluid
        closable
        className={cx("idseq-ui", "input", cs.dateInput, className)}
        onChange={this.handleChange}
        value={this.props.value || ""}
        dateFormat="YYYY-MM-DD"
        popupPosition="bottom right"
      />
    );
  }
}

DateInput.propTypes = forbidExtraProps({
  className: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
});

export default DateInput;
