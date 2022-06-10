import React, { HTMLInputTypeAttribute } from "react";

import { Input as SemanticInput } from "semantic-ui-react";
import { APP_CSS_CLASS_PREFIX } from "./constants";

interface InputProps {
  value?: string | number;
  onChange?: (value: string | number) => void;
  className?: string;
  disableAutocomplete?: boolean;
  fluid?: boolean;
  icon?: string;
  loading?: boolean;
  placeholder?: string;
  onKeyPress?: $TSFixMeFunction;
  type?: HTMLInputTypeAttribute;
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
    let inputClass = APP_CSS_CLASS_PREFIX;
    if (className) {
      inputClass = `${inputClass} ${className}`;
    }

    return (
      <SemanticInput
        /* eslint-disable prefer-const */
        {...props}
        className={inputClass}
        onChange={this.handleChange}
        // Chrome ignores autocomplete="off" on purpose, so use a non-standard
        // label. See: https://stackoverflow.com/questions/15738259/disabling-chrome-autofill
        autoComplete={disableAutocomplete ? "idseq-ui" : null}
      />
    );
  }
}

export default Input;
