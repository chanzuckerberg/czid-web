import React from "react";
import { Input as SemanticInput } from "semantic-ui-react";
import PropTypes from "prop-types";

class Input extends React.Component {
  handleChange = (_, inputProps) => {
    if (this.props.onChange) {
      this.props.onChange(inputProps.value);
    }
  };

  render() {
    let { className, disableAutocomplete, ...props } = this.props;
    className = "idseq-ui " + className;
    return (
      <SemanticInput
        {...props}
        className={className}
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
