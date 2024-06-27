import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@czi-sds/components";
import { take } from "lodash/fp";
import React, { useState } from "react";
import {
  PrimaryButton,
  SecondaryButton,
} from "~/components/ui/controls/buttons";
import { WorkflowType } from "~/components/utils/workflows";
import { Entry } from "~/interface/samplesView";
import { BenchmarkSamplesTable } from "./BenchmarkSamplesTable";
import cs from "./benchmark_modal.scss";
import { GroundTruthFilesDropdown } from "./GroundTruthFilesDropdown/assets/src/components/views/samples/SamplesView/BenchmarkModal/GroundTruthFilesDropdown";

interface BenchmarkModalProps {
  open: boolean;
  onConfirm: ({
    fullGroundTruthFilePath,
    samplesToBenchmark,
  }: {
    samplesToBenchmark: Entry[];
    fullGroundTruthFilePath: string;
  }) => void;
  onClose: () => void;
  selectedObjects: Entry[];
  workflow: WorkflowType;
}

export const BenchmarkModal = ({
  open,
  onConfirm,
  onClose,
  selectedObjects,
  workflow,
}: BenchmarkModalProps) => {
  const [selectedGroundTruthFileOption, setSelectedGroundTruthFileOption] =
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    useState<{ id: number; name: string }>(null);
  const [s3BucketPath, setS3BucketPath] = useState<string>("");

  const onGroundTruthFileSelection = ({
    groundTruthFileOption,
    s3BucketPath,
  }) => {
    setSelectedGroundTruthFileOption(groundTruthFileOption);
    setS3BucketPath(s3BucketPath);
  };

  const fullGroundTruthFilePath = selectedGroundTruthFileOption
    ? `${s3BucketPath}${selectedGroundTruthFileOption?.name}`
    : null;
  const samplesToBenchmark = take(2, selectedObjects);
  return (
    <Dialog open={open} onClose={onClose} sdsSize="m">
      <DialogTitle
        title="Benchmark Samples"
        subtitle={`Workflow benchmarked: ${workflow}`}
      />
      <DialogContent>
        <h3 className={cs.project}>
          Project to store benchmark: <b>CZID Benchmarks</b>
        </h3>
        <GroundTruthFilesDropdown
          onGroundTruthFileSelection={onGroundTruthFileSelection}
          selectedGroundTruthFileOption={selectedGroundTruthFileOption}
        />
        <BenchmarkSamplesTable
          // Only allow a maximum of 2 samples to be selected
          selectedObjects={samplesToBenchmark}
        />
      </DialogContent>
      <DialogActions>
        <PrimaryButton
          sdsStyle="rounded"
          text="Kickoff Benchmark"
          onClick={() => {
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            onConfirm({ fullGroundTruthFilePath, samplesToBenchmark });
            onClose();
          }}
        />
        <SecondaryButton
          sdsStyle="rounded"
          text="Cancel"
          onClick={() => onClose()}
        />
      </DialogActions>
    </Dialog>
  );
};
