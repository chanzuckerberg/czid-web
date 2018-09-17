import React from "react";
import { Input as SemanticInput } from "semantic-ui-react";

class Input extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let { className, ...props } = this.props;
    className = "idseq-ui " + className;
    return <SemanticInput className={className} {...props} />;
  }
}

export default Input;
