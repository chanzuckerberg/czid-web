import { Button } from "@czi-sds/components";
import React, { useContext } from "react";
import { UserContext } from "~/components/common/UserContext";
import Sample from "~/interface/sample";
import cs from "./pipeline_runs_button.scss";

export interface PipelineRunsButtonProps {
  sample: Sample;
}

export const PipelineRunsButton = ({ sample }: PipelineRunsButtonProps) => {
  const { admin: userIsAdmin } = useContext(UserContext) || {};

  return (
    <>
      {userIsAdmin && (
        <>
          <Button
            className={cs.controlElement}
            sdsType="primary"
            sdsStyle="minimal"
            isAllCaps
            onClick={() =>
              (location.href = `/samples/${sample?.id}/pipeline_runs`)
            }
          >
            Pipeline Runs
          </Button>
          <span className={cs.seperator}> | </span>
        </>
      )}
    </>
  );
};
