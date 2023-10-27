import cx from "classnames";
import React from "react";
import cs from "~/components/views/SampleUploadFlow/components/ReviewStep/review_step.scss";
import { Project } from "~/interface/shared";
import { UploadStepType } from "~/interface/upload";

interface ReviewHeaderType {
  areLinksEnabled: boolean;
  onLinkClick(link: string): any;
  project: Project;
  uploadType: any;
}

const ReviewHeader = ({ areLinksEnabled, onLinkClick }: ReviewHeaderType) => {
  return (
    <div className={cs.reviewHeader}>
      <span className={cs.text}>Analysis Type Info</span>
      <div className={cx(cs.links, areLinksEnabled && cs.enabled)}>
        <div
          className={cs.link}
          onClick={() => {
            onLinkClick(UploadStepType.SampleStep);
          }}
          data-testid="edit-analysis-type"
        >
          Edit Analysis Type
        </div>
      </div>
    </div>
  );
};

export { ReviewHeader };
