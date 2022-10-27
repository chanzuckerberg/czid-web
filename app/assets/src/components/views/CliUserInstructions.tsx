import React from "react";
import ReactMarkdown from "react-markdown";
import cs from "./cli_user_instructions.scss";

const CliUserInstructions = (props: { readme: string }) => {
  const readme = props.readme
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"');
  return (
    <div className={cs.instructionContainer}>
      <ReactMarkdown source={readme} />
    </div>
  );
};

export default CliUserInstructions;
