import React from "react";
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
        <ExternalLink href={"/pathogen_list"}>full list</ExternalLink>
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
        >
          here.
        </ExternalLink>
      </>
    ),
  },
  divergent: {
    text: "Divergent Virus",
    code: "divergent",
    color: "purple",
    dimmedColor: "dimPurple",
    tooltip: (
      <>
        {"Divergent virus. See documentation "}
        <ExternalLink
          href={
            "https://docs.google.com/document/d/1bhG7tEVBN8IFrRddw4CiCw0tZLMf8NPzxi1ZghcsvvM/edit?usp=sharing"
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
    <span data-testid="pathogen-label">
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
      trigger={React.cloneElement(label)}
      content={CATEGORIES[type]["tooltip"]}
      basic={false}
      hoverable={true}
      inverted={false}
      position="top center"
    />
  );
};

export default PathogenLabel;
