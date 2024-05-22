import React from "react";
import ReactMarkdown from "react-markdown";
import cs from "./cli_user_instructions.scss";

export const CliUserInstructions = (props: { readme: string }) => {
  const readme = props.readme.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  return (
    <div className={cs.instructionContainer}>
      <ReactMarkdown source={readme} />
    </div>
  );
};
