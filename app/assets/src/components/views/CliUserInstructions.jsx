import PropTypes from "prop-types";
import React from "react";
import ReactMarkdown from "react-markdown";
import cs from "./cli_user_instructions.scss";

class CliUserInstructions extends React.Component {
  render() {
    const readme = this.props.readme.replaceAll("&#39;", "'").replaceAll("&quot;", '"');
    return <div className = { cs.instructionContainer } >
      <ReactMarkdown
        source={readme}
      />
    </div>;
  }
}

CliUserInstructions.propTypes = {
  readme: PropTypes.string,
};

export default CliUserInstructions;