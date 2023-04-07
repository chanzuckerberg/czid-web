import React from "react";
import AnnotationLabel from "~/components/ui/labels/AnnotationLabel";
import {
  ANNOTATION_HIT,
  ANNOTATION_INCONCLUSIVE,
  ANNOTATION_NOT_A_HIT,
} from "~/components/views/SampleView/constants";
import cs from "./annotation_preview.scss";

interface AnnotationPreviewProps {
  tag2Count?: object;
}

const AnnotationPreview = ({ tag2Count }: AnnotationPreviewProps) => {
  const hitCount = tag2Count[ANNOTATION_HIT];
  const notAHitCount = tag2Count[ANNOTATION_NOT_A_HIT];
  const inconclusiveCount = tag2Count[ANNOTATION_INCONCLUSIVE];

  return (
    <span className={cs.previewContainer}>
      {hitCount > 0 && (
        <span className={cs.tagContainer}>
          <AnnotationLabel type={ANNOTATION_HIT} isStatic={true} />
          <span className={cs.count}>{hitCount}</span>
        </span>
      )}
      {notAHitCount > 0 && (
        <span className={cs.tagContainer}>
          <AnnotationLabel type={ANNOTATION_NOT_A_HIT} isStatic={true} />
          <span className={cs.count}>{notAHitCount}</span>
        </span>
      )}
      {inconclusiveCount > 0 && (
        <span className={cs.tagContainer}>
          <AnnotationLabel type={ANNOTATION_INCONCLUSIVE} isStatic={true} />
          <span className={cs.count}>{inconclusiveCount}</span>
        </span>
      )}
    </span>
  );
};

export default AnnotationPreview;
