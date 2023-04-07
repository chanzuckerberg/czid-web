import { cx } from "@emotion/css";
import React from "react";
import {
  Input as SemanticInput,
  InputProps as InputPropsBase,
} from "semantic-ui-react";
import { MetadataValue } from "~/interface/shared";
import { APP_CSS_CLASS_PREFIX } from "./constants";

interface InputProps extends Omit<InputPropsBase, "onChange"> {
  className?: string;
  disableAutocomplete?: boolean;
  onChange?: (val: MetadataValue) => void;
}

const Input = ({
  className,
  disableAutocomplete,
  onChange,
  ...props
}: InputProps) => {
  const handleChange = (_: unknown, inputProps: InputPropsBase) => {
    if (onChange) {
      onChange(inputProps.value);
    }
  };

  return (
    <SemanticInput
      {...props}
      className={cx(APP_CSS_CLASS_PREFIX, className)}
      onChange={handleChange}
      // Chrome ignores autocomplete="off" on purpose, so use a non-standard
      // label. See: https://stackoverflow.com/questions/15738259/disabling-chrome-autofill
      autoComplete={disableAutocomplete ? "idseq-ui" : null}
    />
  );
};

export default Input;
