import cx from "classnames";
import React from "react";
import { ANALYTICS_EVENT_NAMES, useTrackEvent } from "~/api/analytics";
import cs from "~/components/views/SampleUploadFlow/components/ReviewStep/review_step.scss";
import { Project } from "~/interface/shared";
import { UploadStepType } from "~/interface/upload";

interface ReviewHeaderType {
  areLinksEnabled: boolean;
  onLinkClick(link: string): any;
  project: Project;
  uploadType: any;
}

const ReviewHeader = ({
  areLinksEnabled,
  onLinkClick,
  project,
  uploadType,
}: ReviewHeaderType) => {
  const trackEvent = useTrackEvent();
  return (
    <div className={cs.reviewHeader}>
      <span className={cs.text}>Analysis Type Info</span>
      <div className={cx(cs.links, areLinksEnabled && cs.enabled)}>
        <div
          className={cs.link}
          onClick={() => {
            onLinkClick(UploadStepType.SampleStep);
            trackEvent(
              ANALYTICS_EVENT_NAMES.REVIEW_STEP_EDIT_ANALYSIS_TYPE_LINK_CLICKED,
              {
                projectId: project.id,
                projectName: project.name,
                uploadType,
              },
            );
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
