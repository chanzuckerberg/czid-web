import {
  WorkflowConfigType,
  WORKFLOWS,
  WorkflowType,
} from "~/components/utils/workflows";
import { WorkflowRun } from "~/interface/sample";
import { PipelineRun } from "~/interface/shared";

interface PipelineVersionSelectConfigProps {
  timeKey: string;
  versionKey: string;
  workflowName: string;
  getDatabaseVersionString: (x: WorkflowRun | PipelineRun) => string;
}

export const PipelineVersionSelectConfig: WorkflowConfigType<PipelineVersionSelectConfigProps> =
  {
    [WorkflowType.AMR]: {
      timeKey: "executed_at",
      versionKey: "wdl_version",
      // we special case abbreviate AMR because it's so long
      workflowName: "AMR",
      getDatabaseVersionString: (workflowRun: WorkflowRun) => {
        const cardVersion = workflowRun.inputs?.card_version;
        const wildcardVersion = workflowRun.inputs?.wildcard_version;
        let dbVersionString = "";
        if (cardVersion) {
          dbVersionString += `CARD DB: ${cardVersion} | `;
        }
        if (wildcardVersion) {
          dbVersionString += `Wildcard DB: ${wildcardVersion} | `;
        }
        return dbVersionString;
      },
    },
    [WorkflowType.CONSENSUS_GENOME]: {
      timeKey: "executed_at",
      versionKey: "wdl_version",
      workflowName: WORKFLOWS["CONSENSUS_GENOME"].pipelineName,
      getDatabaseVersionString: () => "",
    },
    [WorkflowType.SHORT_READ_MNGS]: {
      timeKey: "created_at",
      versionKey: "pipeline_version",
      workflowName: WORKFLOWS["SHORT_READ_MNGS"].pipelineName,
      getDatabaseVersionString: (pipelineRun: PipelineRun) => {
        const alignmentDbVersion = pipelineRun.version?.alignment_db;
        return alignmentDbVersion ? alignmentDbVersion.concat(" | ") : "";
      },
    },
    [WorkflowType.LONG_READ_MNGS]: {
      timeKey: "created_at",
      versionKey: "pipeline_version",
      workflowName: WORKFLOWS["LONG_READ_MNGS"].pipelineName,
      getDatabaseVersionString: (pipelineRun: PipelineRun) => {
        const alignmentDbVersion = pipelineRun.version?.alignment_db;
        return alignmentDbVersion ? alignmentDbVersion.concat(" | ") : "";
      },
    },
    [WorkflowType.BENCHMARK]: {
      timeKey: "executed_at",
      versionKey: "wdl_version",
      workflowName: WORKFLOWS["BENCHMARK"].pipelineName,
      getDatabaseVersionString: () => "",
    },
  };
