import cx from "classnames";
import React, { useState } from "react";
import { validateManualMetadataForNewSamples } from "~/api/metadata";
import MetadataUpload from "~/components/common/Metadata/MetadataUpload";
import {
  Issues,
  MetadataUploadProps,
} from "~/components/common/Metadata/types";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import SecondaryButton from "~/components/ui/controls/buttons/SecondaryButton";
import Instructions from "~/components/views/samples/MetadataUploadModal/Instructions";
import { HostGenome, MetadataBasic } from "~/interface/shared/";
import cs from "./sample_upload_flow.scss";

export interface UploadMetadataStepProps
  extends Pick<
    MetadataUploadProps,
    "samples" | "project" | "visible" | "onDirty" | "workflows"
  > {
  onUploadMetadata: $TSFixMeFunction;
}

const UploadMetadataStep = ({
  samples,
  project,
  visible,
  onDirty,
  workflows,
  onUploadMetadata,
}: UploadMetadataStepProps) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [continueDisabled, setContinueDisabled] = useState(true);
  const [metadata, setMetadata] = useState(null);
  const [issues, setIssues] = useState(null);
  const [wasManual, setWasManual] = useState(false);
  const [newHostGenomes, setNewHostGenomes] = useState([]);

  const handleMetadataChange = ({
    metadata,
    issues,
    wasManual,
    newHostGenomes,
  }: {
    metadata?: MetadataBasic;
    issues?: Issues;
    wasManual?: boolean;
    newHostGenomes?: HostGenome[];
  }) => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    setMetadata(metadata);
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    setIssues(issues);
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    setWasManual(wasManual);
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    newHostGenomes && setNewHostGenomes(newHostGenomes);

    const metadataValid = metadata && !(issues && issues.errors.length > 0);
    setContinueDisabled(!metadataValid);
  };

  const handleContinue = async () => {
    // If manual input, validate when user presses Continue.
    let result = null;
    if (wasManual) {
      setIssues(null);

      result = await validateManualMetadataForNewSamples(samples, metadata);
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      setIssues(result.issues);
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      setNewHostGenomes(result.newHostGenomes);

      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      if (metadata && !(result.issues && result.issues.errors.length > 0)) {
        onUploadMetadata({
          metadata,
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
          issues: result.issues,
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
          newHostGenomes: result.newHostGenomes,
        });
      }
    } else {
      onUploadMetadata({
        metadata,
        issues,
        newHostGenomes,
      });
    }
  };

  return (
    <div className={cs.uploadMetadataStep}>
      <div className={cx(cs.uploadInstructions, !showInstructions && cs.hide)}>
        <Instructions onClose={() => setShowInstructions(false)} />
      </div>
      <div
        className={cx(
          cs.uploadFlowStep,
          showInstructions && cs.hide,
          visible && cs.visible,
        )}
      >
        <div className={cs.flexContent}>
          {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769 */}
          <MetadataUpload
            onShowCSVInstructions={() => setShowInstructions(true)}
            samples={samples}
            project={project}
            onMetadataChange={handleMetadataChange}
            samplesAreNew
            issues={wasManual ? issues : null}
            visible={visible}
            onDirty={onDirty}
            metadata={metadata}
            workflows={workflows}
          />
        </div>
        <div className={cs.controls}>
          <PrimaryButton
            text="Continue"
            onClick={handleContinue}
            disabled={continueDisabled}
            className={cs.continueButton}
          />
          <a href="/home">
            <SecondaryButton
              text="Cancel"
              // this is broken, but alldoami found it while working on something unrelated
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              onClick={() => {}}
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default UploadMetadataStep;
