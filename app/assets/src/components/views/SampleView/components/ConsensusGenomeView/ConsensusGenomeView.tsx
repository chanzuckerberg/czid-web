import React, { Suspense } from "react";
import { SampleMessage } from "~/components/common/SampleMessage";
import csSampleMessage from "~/components/common/SampleMessage/sample_message.scss";
import Sample, { SampleStatus, WorkflowRun } from "~/interface/sample";
import { IconLoading } from "~ui/icons";
import { ConsensusGenomeHeader } from "./components/ConsensusGenomeHeader";
import { ConsensusGenomeReport } from "./components/ConsensusGenomeReport";
interface ConsensusGenomeViewProps {
  onWorkflowRunSelect: $TSFixMeFunction;
  sample: Sample | null;
  workflowRun?: WorkflowRun | null;
}

export const ConsensusGenomeView = ({
  onWorkflowRunSelect,
  sample,
  workflowRun,
}: ConsensusGenomeViewProps) => {
  if (sample && workflowRun) {
    return (
      <>
        <ConsensusGenomeHeader
          sample={sample}
          workflowRun={workflowRun}
          onWorkflowRunSelect={onWorkflowRunSelect}
        />
        <Suspense
          fallback={
            <SampleMessage
              icon={<IconLoading className={csSampleMessage.icon} />}
              message={"Loading report data."}
              status={"Loading"}
              type={"inProgress"}
            />
          }
        >
          <ConsensusGenomeReport sample={sample} workflowRun={workflowRun} />
        </Suspense>
      </>
    );
  } else {
    return (
      <SampleMessage
        icon={<IconLoading className={csSampleMessage.icon} />}
        message={"Loading report data."}
        status={SampleStatus.LOADING}
        type={"inProgress"}
      />
    );
  }
};
