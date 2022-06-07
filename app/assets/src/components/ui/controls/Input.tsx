import React from "react";
import { Input as SemanticInput } from "semantic-ui-react";

interface InputProps {
  value?: string | number;
  onChange?: $TSFixMeFunction;
  className?: string;
  disableAutocomplete?: boolean;
  fluid?: boolean;
  icon?: string;
  loading?: boolean;
  placeholder?: string;
  onKeyPress: $TSFixMeFunction;
}

class Input extends React.Component<InputProps> {
  handleChange = (_, inputProps) => {
    if (this.props.onChange) {
      this.props.onChange(inputProps.value);
    }
  };

  render() {
    /* eslint-disable prefer-const */
    let { className, disableAutocomplete, ...props } = this.props;
    className = "idseq-ui " + className;
    return (
      <SemanticInput
        /* eslint-disable prefer-const */
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

export default Input;
