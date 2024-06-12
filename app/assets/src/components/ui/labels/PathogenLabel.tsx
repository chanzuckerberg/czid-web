import React from "react";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import BasicPopup from "../../common/BasicPopup";
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
