import React from "react";

import { ANALYTICS_EVENT_NAMES, logAnalyticsEvent } from "~/api/analytics";
import { IconTempSmall } from "~ui/icons";
import BasicPopup from "../../BasicPopup";

import cs from "./annotation_label.scss";

const AnnotationLabel = () => {
  let label = (
    <span
      onMouseEnter={() =>
        logAnalyticsEvent(ANALYTICS_EVENT_NAMES.ANNOTATION_LABEL_HOVERED)
      }
    >
      <IconTempSmall className={cs.annotationIcon} />
    </span>
  );

  return (
    <BasicPopup
      trigger={label}
      content="Annotate"
      basic={false}
      position="top center"
    />
  );
};

export default AnnotationLabel;
