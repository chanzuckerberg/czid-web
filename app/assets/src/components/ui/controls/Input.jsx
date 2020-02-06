import React from "react";
import { Input as SemanticInput } from "semantic-ui-react";
import PropTypes from "prop-types";

class Input extends React.Component {
  constructor(props) {
    super(props);
  }

  handleChange = (_, inputProps) => {
    if (this.props.onChange) {
      this.props.onChange(inputProps.value);
    }
  };

  render() {
    let { className, disableAutocomplete, value, ...props } = this.props;
    className = "idseq-ui " + className;
    return (
      <SemanticInput
        {...props}
        className={className}
        // If undefined is passed to SemanticInput, the previous value of the input will continue to
        // be displayed instead of an empty string.
        // Therefore, we force an empty string to be passed.
        value={value || ""}
        onChange={this.handleChange}
        // Chrome ignores autocomplete="off" on purpose, so use a non-standard
        // label. See: https://stackoverflow.com/questions/15738259/disabling-chrome-autofill
        autoComplete={disableAutocomplete ? "idseq-ui" : null}
      />
    );
  }
}

Input.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  className: PropTypes.string,
  disableAutocomplete: PropTypes.bool,
};

export default Input;
