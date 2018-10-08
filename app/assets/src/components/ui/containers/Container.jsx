import PropTypes from "prop-types";
import React from "react";
import { Container as SemanticContainer } from "semantic-ui-react";

class Container extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <SemanticContainer className="idseq-ui" {...this.props}>
        {this.props.children}
      </SemanticContainer>
    );
  }
}

Container.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
};

export default Container;
