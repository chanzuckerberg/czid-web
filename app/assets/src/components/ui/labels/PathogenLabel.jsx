import PropTypes from "prop-types";
import React, { useContext } from "react";

import { ANALYTICS_EVENT_NAMES, logAnalyticsEvent } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { PATHOGEN_LABEL_V0_FEATURE } from "~/components/utils/features";
import BasicPopup from "../../BasicPopup";
import Label from "./Label";

import cs from "./pathogen_label.scss";

const NIAID_URL =
  "https://www.niaid.nih.gov/research/emerging-infectious-diseases-pathogens";
const BASE_LABEL = "NIAID priority";

export const CATEGORIES = {
  categoryA: {
    text: BASE_LABEL + " | a",
    color: "red",
    tooltip: "NIAID pathogen priority list | category A",
    url: NIAID_URL,
  },
  categoryB: {
    text: BASE_LABEL + " | b",
    color: "orange",
    tooltip: "NIAID pathogen priority list | category B",
    url: NIAID_URL,
  },
  categoryC: {
    text: BASE_LABEL + " | c",
    color: "yellow",
    tooltip: "NIAID pathogen priority list | category C",
    url: NIAID_URL,
  },
};

const PathogenLabel = ({ type }) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};

  if (
    !CATEGORIES.hasOwnProperty(type) &&
    !allowedFeatures.includes(PATHOGEN_LABEL_V0_FEATURE)
  ) {
    return null;
  }
  let label = allowedFeatures.includes(PATHOGEN_LABEL_V0_FEATURE) ? (
    <span>
      <Label
        text="Known Pathogen"
        color="red"
        size="medium"
        className={cs.newPathogenLabel}
      />
    </span>
  ) : (
    <a href={CATEGORIES[type]["url"]} target="_blank" rel="noopener noreferrer">
      <Label
        text={CATEGORIES[type]["text"]}
        color={CATEGORIES[type]["color"]}
        size="medium"
        className={cs.pathogenLabel}
      />
    </a>
  );
  return allowedFeatures.includes(PATHOGEN_LABEL_V0_FEATURE) ? (
    <BasicPopup
      trigger={React.cloneElement(label, {
        onMouseEnter: () =>
          logAnalyticsEvent(ANALYTICS_EVENT_NAMES.PATHOGEN_LABEL_HOVERED),
      })}
      content={
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
      }
      basic={false}
      hoverable={true}
      inverted={false}
      position="top center"
    />
  ) : (
    <BasicPopup
      trigger={label}
      content={CATEGORIES[type]["tooltip"]}
      basic={false}
    />
  );
};

PathogenLabel.propTypes = {
  type: PropTypes.string,
};

export default PathogenLabel;
