import cx from "classnames";
import React from "react";
import { TextArea as SemanticTextarea, TextAreaProps } from "semantic-ui-react";
import cs from "./textarea.scss";

interface TextareaProps extends TextAreaProps {
  value?: string;
  onChange?: $TSFixMeFunction;
  onBlur?: $TSFixMeFunction;
  className?: string;
  maxLength?: number;
  placeholder?: string;
}

class Textarea extends React.Component<TextareaProps> {
  handleChange = (_, inputProps) => {
    if (this.props.onChange) {
      this.props.onChange(inputProps.value);
    }
  };

  render() {
    const { className, ...props } = this.props;
    return (
      <SemanticTextarea
        className={cx(cs.textarea, className)}
        {...props}
        onChange={this.handleChange}
      />
    );
  }
}

export default Textarea;
