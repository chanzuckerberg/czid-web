import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";

import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import {
  ANNOTATION_HIT,
  ANNOTATION_NOT_A_HIT,
  ANNOTATION_INCONCLUSIVE,
  ANNOTATION_NONE,
} from "~/components/views/SampleView/constants";
import {
  IconAnnotationCheck,
  IconAnnotationCross,
  IconAnnotationOutline,
  IconAnnotationQuestion,
} from "~ui/icons";
import BasicPopup from "../../BasicPopup";

import cs from "./annotation_label.scss";

const AnnotationLabel = ({
  className,
  type,
  isSmall = false,
  hideTooltip = false,
  ...props
}) => {
  const IconAnnotation = {
    [ANNOTATION_HIT]: IconAnnotationCheck,
    [ANNOTATION_NOT_A_HIT]: IconAnnotationCross,
    [ANNOTATION_INCONCLUSIVE]: IconAnnotationQuestion,
    [ANNOTATION_NONE]: IconAnnotationOutline,
  }[type];
  const description = !isSmall
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
      }
    >
      <IconAnnotation
        className={cx(
          className,
          cs.annotationIcon,
          isSmall ? cs.annotationIconSmall : cs.annotationIconLarge,
        )}
      />
    </span>
  );

  return hideTooltip ? (
    label
  ) : (
    <BasicPopup
      className={isSmall ? cs.annotationPreviewPopup : cs.annotationPopup}
      trigger={label}
      content={description}
      basic={false}
      inverted={!isSmall} // Only invert color for large labels, which let the user set annotations
      position="top center"
    />
  );
};

AnnotationLabel.propTypes = {
  className: PropTypes.string,
  type: PropTypes.oneOf([
    ANNOTATION_HIT,
    ANNOTATION_NOT_A_HIT,
    ANNOTATION_INCONCLUSIVE,
    ANNOTATION_NONE,
  ]),
  isSmall: PropTypes.bool,
  hideTooltip: PropTypes.bool,
  onClick: PropTypes.func,
};

export default AnnotationLabel;
