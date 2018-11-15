import React from "react";
import { TextArea as SemanticTextarea } from "semantic-ui-react";
import cs from "./textarea.scss";
import cx from "classnames";
import PropTypes from "prop-types";

class Textarea extends React.Component {
  constructor(props) {
    super(props);
  }

  handleChange = (_, inputProps) => {
    if (this.props.onChange) {
      this.props.onChange(inputProps.value);
    }
  };

  render() {
    let { className, ...props } = this.props;
    return (
      <SemanticTextarea
        className={cx(cs.textarea, className)}
        {...props}
        onChange={this.handleChange}
      />
    );
  }
}

Textarea.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  className: PropTypes.string
};

export default Textarea;
