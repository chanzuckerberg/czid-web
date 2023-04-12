import cx from "classnames";
import React, { useState } from "react";
import { trackEvent } from "~/api/analytics";
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
    setMetadata(metadata);
    setIssues(issues);
    setWasManual(wasManual);
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
      setIssues(result.issues);
      setNewHostGenomes(result.newHostGenomes);

      if (metadata && !(result.issues && result.issues.errors.length > 0)) {
        onUploadMetadata({
          metadata,
          issues: result.issues,
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
    trackEvent("UploadMetadataStep_continue-button_clicked", {
      wasManual: wasManual,
      errors: result ? result.issues.errors.length : issues.errors.length,
      warnings: result ? result.issues.warnings.length : issues.warnings.length,
      samples: samples.length,
      projectId: project.id,
      projectName: project.name,
    });
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
              onClick={() =>
                trackEvent("UploadMetadataStep_cancel-button_clicked", {
                  projectId: project.id,
                  projectName: project.name,
                })
              }
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default UploadMetadataStep;
