import { Button } from "@czi-sds/components";
import React, { useContext } from "react";
import { UserContext } from "~/components/common/UserContext";
import { WORKFLOW_VALUES } from "~/components/utils/workflows";
import Sample from "~/interface/sample";
import cs from "./pipeline_runs_button.scss";
import { PipelineRunsButtonConfig } from "./workflowTypeConfig";

export interface PipelineRunsButtonProps {
  sample: Sample;
  workflow: WORKFLOW_VALUES;
}

export const PipelineRunsButton = ({
  sample,
  workflow,
}: PipelineRunsButtonProps) => {
  const { admin: userIsAdmin } = useContext(UserContext) || {};
  const { hasPipelineRunsButton } = PipelineRunsButtonConfig[workflow];

  return (
    <>
      {userIsAdmin && hasPipelineRunsButton && (
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
