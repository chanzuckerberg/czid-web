import cx from "classnames";
import React, { useContext } from "react";
import { UserContext } from "~/components/common/UserContext";
import {
  HostGenome,
  MetadataBasic,
  Project,
  SampleFromApi,
} from "~/interface/shared";
import { UploadStepType } from "~/interface/upload";
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
  projectMetadataFields: object | null;
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
  projectMetadataFields,
  samples,
  uploadType,
}: SampleInfoType) => {
  const { admin } = useContext(UserContext) || {};

  return (
    <div className={cs.sectionContainer}>
      <div className={cs.reviewHeader}>
        <span className={cs.text}>Sample Info</span>
        <div className={cx(cs.links, areLinksEnabled && cs.enabled)}>
          <div
            className={cs.link}
            onClick={() => {
              onLinkClick(UploadStepType.SampleStep);
            }}
          >
            Edit Samples
          </div>
          <div className={cs.divider}>|</div>
          <div
            className={cs.link}
            onClick={() => {
              onLinkClick(UploadStepType.MetadataStep);
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
