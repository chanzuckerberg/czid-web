import React from "react";
import { Container as SemanticContainer } from "semantic-ui-react";

interface ContainerProps {
  children: React.ReactNode[] | React.ReactNode;
}

class Container extends React.Component<ContainerProps> {
  render() {
    return (
      <SemanticContainer className="idseq-ui" {...this.props}>
        {this.props.children}
      </SemanticContainer>
    );
  }
}

export default Container;
