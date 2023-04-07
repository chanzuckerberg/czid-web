import cx from "classnames";
import { Icon } from "czifui";
import React from "react";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import {
  ANNOTATION_HIT,
  ANNOTATION_INCONCLUSIVE,
  ANNOTATION_NONE,
  ANNOTATION_NOT_A_HIT,
} from "~/components/views/SampleView/constants";
import BasicPopup from "../../BasicPopup";
import cs from "./annotation_label.scss";

const AnnotationLabel = ({
  type,
  isStatic = false,
  hideTooltip = false,
  ...props
}: AnnotationLabelProps) => {
  const icon = {
    [ANNOTATION_HIT]: "flagCheck",
    [ANNOTATION_NOT_A_HIT]: "flagXmark",
    [ANNOTATION_INCONCLUSIVE]: "flagQuestionmark",
    [ANNOTATION_NONE]: "flagOutline",
  }[type];
  const description = !isStatic
    ? "Annotate"
    : {
        [ANNOTATION_HIT]: "Contains species marked as hit.",
        [ANNOTATION_NOT_A_HIT]: "Contains species marked as not a hit.",
        [ANNOTATION_INCONCLUSIVE]: "Contains species marked as inconclusive.",
      }[type];
  const label = (
    <span
      {...props}
      onMouseEnter={() =>
        trackEvent(ANALYTICS_EVENT_NAMES.ANNOTATION_LABEL_HOVERED)
      }>
      <Icon
        className={cx(cs[icon], isStatic ? cs.staticFlag : cs.interactiveFlag)}
        // @ts-expect-error Type 'string' is not assignable to type 'keyof IconNameToSizes'
        sdsIcon={icon}
        sdsSize={isStatic ? "xs" : "s"}
        sdsType={isStatic ? "static" : "interactive"}
      />
    </span>
  );

  return hideTooltip ? (
    label
  ) : (
    <BasicPopup
      className={isStatic ? cs.annotationPreviewPopup : cs.annotationPopup}
      trigger={label}
      content={description}
      basic={false}
      inverted={!isStatic} // Only invert color for large labels, which let the user set annotations
      position="top center"
    />
  );
};

interface AnnotationLabelProps {
  className?: string;
  type: "hit" | "not_a_hit" | "inconclusive" | "none";
  isStatic?: boolean;
  hideTooltip?: boolean;
  onClick?: $TSFixMeFunction;
}

export default AnnotationLabel;
