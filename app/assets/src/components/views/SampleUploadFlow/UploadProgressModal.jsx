import { flow, keyBy, mapValues, omit } from "lodash/fp";
import React from "react";

import PropTypes from "~/components/utils/propTypes";
import LocalUploadProgressModal from "./LocalUploadProgressModal";
import RemoteUploadProgressModal from "./RemoteUploadProgressModal";

const UploadProgressModal = ({
  adminOptions,
  clearlabs,
  technology,
  medakaModel,
  metadata,
  onUploadComplete,
  project,
  samples,
  skipSampleProcessing,
  uploadType,
  useStepFunctionPipeline,
  wetlabProtocol,
  workflows,
}) => {
  const processMetadataRows = metadataRows =>
    flow(
      keyBy(row => row.sample_name || row["Sample Name"]),
      mapValues(omit(["sample_name", "Sample Name"])),
    )(metadataRows);

  return (
    <>
      {uploadType === "local" ? (
        <LocalUploadProgressModal
          adminOptions={adminOptions}
          clearlabs={clearlabs}
          technology={technology}
          medakaModel={medakaModel}
          metadata={processMetadataRows(metadata.rows)}
          onUploadComplete={onUploadComplete}
          project={project}
          samples={samples}
          skipSampleProcessing={skipSampleProcessing}
          uploadType={uploadType}
          useStepFunctionPipeline={useStepFunctionPipeline}
          wetlabProtocol={wetlabProtocol}
          workflows={workflows}
        />
      ) : (
        <RemoteUploadProgressModal
          adminOptions={adminOptions}
          clearlabs={clearlabs}
          technology={technology}
          medakaModel={medakaModel}
          metadata={processMetadataRows(metadata.rows)}
          onUploadComplete={onUploadComplete}
          project={project}
          samples={samples}
          skipSampleProcessing={skipSampleProcessing}
          uploadType={uploadType}
          useStepFunctionPipeline={useStepFunctionPipeline}
          wetlabProtocol={wetlabProtocol}
          workflows={workflows}
        />
      )}
    </>
  );
};

UploadProgressModal.propTypes = {
  samples: PropTypes.arrayOf(
    PropTypes.shape({
      host_genome_id: PropTypes.number.isRequired,
      input_file_attributes: PropTypes.shape({
        name: PropTypes.string,
        source: PropTypes.string,
        source_type: PropTypes.string,
        upload_client: PropTypes.string,
      }),
      name: PropTypes.string,
      project_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      status: PropTypes.string,
      // Basespace samples only.
      file_size: PropTypes.number,
      file_type: PropTypes.string,
      basespace_project_name: PropTypes.string,
      files: PropTypes.objectOf(PropTypes.instanceOf(File)),
    }),
  ),
  adminOptions: PropTypes.objectOf(PropTypes.string).isRequired,
  clearlabs: PropTypes.bool,
  medakaModel: PropTypes.string,
  metadata: PropTypes.objectOf(PropTypes.any),
  onUploadComplete: PropTypes.func.isRequired,
  project: PropTypes.Project,
  skipSampleProcessing: PropTypes.bool,
  technology: PropTypes.string,
  uploadType: PropTypes.string.isRequired,
  useStepFunctionPipeline: PropTypes.bool,
  wetlabProtocol: PropTypes.string,
  workflows: PropTypes.instanceOf(Set),
};

export default UploadProgressModal;
