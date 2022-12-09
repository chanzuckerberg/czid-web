import React from "react";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import BasicPopup from "../../BasicPopup";
import Label from "./Label";

import cs from "./pathogen_label.scss";

export const CATEGORIES = {
  knownPathogen: {
    text: "Known Pathogen",
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
    color: "orange",
    dimmedColor: "dimOrange",
    tooltip: (
      <>
        {"TODO create doc describing LCRP algorithm and link it "}
        <ExternalLink
          href={"/pathogen_list"}
          analyticsEventName={
            ANALYTICS_EVENT_NAMES.PATHOGEN_LABEL_PATHOGEN_LIST_LINK_CLICKED
          }
        >
          here
        </ExternalLink>
        {" so users can understand the tag."}
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
