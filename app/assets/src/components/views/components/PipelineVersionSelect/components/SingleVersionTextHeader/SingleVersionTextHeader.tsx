import React from "react";
import { Popup } from "semantic-ui-react";
import cs from "./single_version_text_header.scss";

interface SingleVersionTextHeaderProps {
  versionInfoString: string;
  currentPipelineString: string;
}

export const SingleVersionTextHeader = ({
  currentPipelineString,
  versionInfoString,
}: SingleVersionTextHeaderProps) => {
  return (
    <>
      <Popup
        content={"This is the only version available."}
        position={"top center"}
        inverted={false}
        trigger={
          <span
            className={cs.pipelineVersion}
            data-testid="pipeline-version-select"
          >
            {currentPipelineString}
          </span>
        }
      />

      <span className={cs.pipelineVersion}>{versionInfoString}</span>
    </>
  );
};
