import cx from "classnames";
import React from "react";
import { DateInput as BaseDateInput } from "semantic-ui-calendar-react";
import cs from "./date_input.scss";

// TODO: fix limitations of the original component
// 1) Styles of the date picker (table in popup) cannot be overridden
// (no specific classes and classname is not passed down)
// 2) Events onBlur and onChange do not behave as expected, as when
// user clicks a date onBlur fires before onChange (triggering onBlur
// manually would create problems with async setState)

interface DateInputProps {
  className: string;
  onChange: $TSFixMeFunction;
  value: string | number;
}

class DateInput extends React.Component<DateInputProps> {
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
        // @ts-expect-error Type 'string | number' is not assignable to type 'string'.
        value={this.props.value || ""}
        dateFormat="YYYY-MM-DD"
        popupPosition="bottom right"
      />
    );
  }
}

export default DateInput;
