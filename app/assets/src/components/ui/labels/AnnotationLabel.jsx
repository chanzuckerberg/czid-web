import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";

import { ANALYTICS_EVENT_NAMES, logAnalyticsEvent } from "~/api/analytics";
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

const AnnotationLabel = ({ type, isSmall = false }) => {
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
      onMouseEnter={() =>
        logAnalyticsEvent(ANALYTICS_EVENT_NAMES.ANNOTATION_LABEL_HOVERED)
      }
    >
      <IconAnnotation
        className={cx(
          cs.annotationIcon,
          isSmall ? cs.annotationIconSmall : cs.annotationIconLarge,
        )}
      />
    </span>
  );

  return (
    <BasicPopup
      className={!isSmall && cs.annotationPopup}
      trigger={label}
      content={description}
      basic={false}
      inverted={!isSmall} // Only invert color for large labels, which let the user set annotations
      position="top center"
    />
  );
};

AnnotationLabel.propTypes = {
  type: PropTypes.oneOf([
    ANNOTATION_HIT,
    ANNOTATION_NOT_A_HIT,
    ANNOTATION_INCONCLUSIVE,
    ANNOTATION_NONE,
  ]),
  isSmall: PropTypes.bool,
};

export default AnnotationLabel;
