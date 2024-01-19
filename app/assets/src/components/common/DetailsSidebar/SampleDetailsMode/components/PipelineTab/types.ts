import { WorkflowLabelType } from "~/components/utils/workflows";

export interface MngsPipelineInfo {
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2411
  workflow?: { text: WorkflowLabelType };
  [key: string]: {
    text?: string | null;
    link?: string;
    linkLabel?: string;
  };
}

export interface AmrPipelineTabInfo {
  analysisType: { text: WorkflowLabelType };
  workflow: { text: WorkflowLabelType };
  technology: { text: string };
  pipelineVersion: { text: string; link: string; linkLabel: string };
  cardDatabaseVersion?: { text: string };
  totalReads?: { text: string };
  totalErccReads?: { text: string };
  nonhostReads?: { text: string };
  qcPercent?: { text: string };
  compressionRatio?: { text: string };
  meanInsertSize?: { text: string };
  lastProcessedAt: { text: string };
  wildcardDatabaseVersion?: { text: string };
}

export type PipelineInfo = AmrPipelineTabInfo | MngsPipelineInfo;

export type PipelineStepDictState =
  | PiplineStepDictInterface
  | Record<string, never>;
interface PiplineStepDictInterface {
  name: string;
  stageDescription: string;
  steps: {
    [key: string]: {
      fileList: {
        displayName: string;
        key: string | null;
        url: string | null;
      }[];
      name: string;
      readsAfter: number | null;
      stepDescription: string;
    };
  };
}
