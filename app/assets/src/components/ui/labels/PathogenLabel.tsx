import React from "react";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import BasicPopup from "../../BasicPopup";
import Label from "./Label";

import cs from "./pathogen_label.scss";

export const CATEGORIES = {
  knownPathogen: {
    text: "Known Pathogen",
    code: "knownPathogen",
    color: "red",
    dimmedColor: "dimRed",
    tooltip: (
      <>
        {"Organism with known human pathogenicity. See the "}
        <ExternalLink
          href={"/pathogen_list"}
          analyticsEventName={
            ANALYTICS_EVENT_NAMES.PATHOGEN_LABEL_PATHOGEN_LIST_LINK_CLICKED
          }
        >
          full list
        </ExternalLink>
        {" of pathogens."}
      </>
    ),
  },
  lcrp: {
    text: "LCRP Pathogen",
    code: "lcrp",
    color: "orange",
    dimmedColor: "dimOrange",
    tooltip: (
      <>
        {
          "Outlier organism with potential human disease significance. See documentation "
        }
        <ExternalLink
          href={
            "https://docs.google.com/document/d/1bhG7tEVBN8IFrRddw4CiCw0tZLMf8NPzxi1ZghcsvvM/edit?usp=sharing"
          }
          analyticsEventName={
            ANALYTICS_EVENT_NAMES.PATHOGEN_LABEL_PATHOGEN_LIST_LINK_CLICKED
          }
        >
          here.
        </ExternalLink>
      </>
    ),
  },
  divergent: {
    text: "Divergent Pathogen",
    code: "divergent",
    color: "purple",
    dimmedColor: "dimPurple",
    tooltip: (
      <>
        {"Divergent pathogen. See documentation "}
        <ExternalLink
          href={
            "https://docs.google.com/document/d/1bhG7tEVBN8IFrRddw4CiCw0tZLMf8NPzxi1ZghcsvvM/edit?usp=sharing"
          }
          analyticsEventName={
            ANALYTICS_EVENT_NAMES.PATHOGEN_LABEL_PATHOGEN_LIST_LINK_CLICKED
          }
        >
          here.
        </ExternalLink>
      </>
    ),
  },
};

interface PathogenLabelProps {
  type: string;
  isDimmed?: boolean;
}

const PathogenLabel = ({ type, isDimmed }: PathogenLabelProps) => {
  const label = (
    <span>
      <Label
        text={CATEGORIES[type]["text"]}
        color={CATEGORIES[type][isDimmed ? "dimmedColor" : "color"]}
        size="medium"
        className={cs.pathogenLabel}
      />
    </span>
  );
  return (
    <BasicPopup
      className={cs.pathogenLabelPopup}
      trigger={React.cloneElement(label, {
        onMouseEnter: () =>
          trackEvent(ANALYTICS_EVENT_NAMES.PATHOGEN_LABEL_HOVERED),
      })}
      content={CATEGORIES[type]["tooltip"]}
      basic={false}
      hoverable={true}
      inverted={false}
      position="top center"
    />
  );
};

export default PathogenLabel;
