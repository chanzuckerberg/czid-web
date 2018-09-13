import React from "react";
import { Input as SemanticInput } from "semantic-ui-react";

class Input extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <SemanticInput className="idseq-ui" {...this.props} />;
  }
}

export default Input;
