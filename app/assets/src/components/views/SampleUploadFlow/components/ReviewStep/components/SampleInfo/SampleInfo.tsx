import cx from "classnames";
import React, { useContext } from "react";
import { trackEvent } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import {
  HostGenome,
  MetadataBasic,
  Project,
  SampleFromApi,
} from "~/interface/shared";
import AdminUploadOptions from "./components/AdminUploadOptions/AdminUploadOptions";
import { ReviewTable } from "./components/ReviewTable";
import cs from "./sample_info.scss";

interface SampleInfoType {
  adminOptions: Record<string, string>;
  areLinksEnabled: boolean;
  hostGenomes?: HostGenome[];
  metadata: MetadataBasic;
  onAdminOptionsChanged(opts: Record<string, string>): void;
  onLinkClick(link: string): void;
  project: Project;
  projectMetadataFields: $TSFixMeUnknown;
  samples?: SampleFromApi[];
  uploadType: string;
}

const SampleInfo = ({
  adminOptions,
  areLinksEnabled,
  hostGenomes,
  metadata,
  onAdminOptionsChanged,
  onLinkClick,
  project,
  projectMetadataFields,
  samples,
  uploadType,
}: SampleInfoType) => {
  const { admin } = useContext(UserContext) || {};

  const { id, name } = project;

  return (
    <div className={cs.sectionContainer}>
      <div className={cs.reviewHeader}>
        <span className={cs.text}>Sample Info</span>
        <div className={cx(cs.links, areLinksEnabled && cs.enabled)}>
          <div
            className={cs.link}
            onClick={() => {
              onLinkClick("uploadSamples");
              trackEvent("ReviewStep_edit-samples-link_clicked", {
                projectId: id,
                projectName: name,
                uploadType,
              });
            }}
          >
            Edit Samples
          </div>
          <div className={cs.divider}>|</div>
          <div
            className={cs.link}
            onClick={() => {
              onLinkClick("uploadMetadata");
              trackEvent("ReviewStep_edit-metadata-link_clicked", {
                projectId: id,
                projectName: name,
                uploadType,
              });
            }}
          >
            Edit Metadata
          </div>
        </div>
      </div>
      <div className={cs.tableScrollWrapper}>
        <ReviewTable
          hostGenomes={hostGenomes}
          metadata={metadata}
          projectMetadataFields={projectMetadataFields}
          samples={samples}
          uploadType={uploadType}
        />
      </div>
      {admin && (
        <AdminUploadOptions
          adminOptions={adminOptions}
          onAdminOptionsChanged={onAdminOptionsChanged}
        />
      )}
    </div>
  );
};

export { SampleInfo };
