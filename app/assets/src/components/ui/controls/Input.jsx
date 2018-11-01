import React from "react";
import { Input as SemanticInput } from "semantic-ui-react";
import PropTypes from "prop-types";

class Input extends React.Component {
  constructor(props) {
    super(props);
  }

  onChange = (_, inputProps) => {
    if (this.props.onChange) {
      this.props.onChange(inputProps.value);
    }
  };

  render() {
    let { className, ...props } = this.props;
    className = "idseq-ui " + className;
    return (
      <SemanticInput
        className={className}
        {...props}
        onChange={this.onChange}
      />
    );
  }
}

Input.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  className: PropTypes.string
};

export default Input;
