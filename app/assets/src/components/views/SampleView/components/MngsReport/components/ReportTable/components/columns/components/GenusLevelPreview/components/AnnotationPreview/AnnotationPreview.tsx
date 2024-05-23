import React from "react";
import AnnotationLabel from "~/components/ui/labels/AnnotationLabel";
import {
  ANNOTATION_HIT,
  ANNOTATION_INCONCLUSIVE,
  ANNOTATION_NOT_A_HIT,
} from "~/components/views/SampleView/utils";
import cs from "./annotation_preview.scss";

interface AnnotationPreviewProps {
  tag2Count?: object;
}

export const AnnotationPreview = ({ tag2Count }: AnnotationPreviewProps) => {
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
  const hitCount = tag2Count[ANNOTATION_HIT];
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
  const notAHitCount = tag2Count[ANNOTATION_NOT_A_HIT];
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
