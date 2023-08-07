import React from "react";
import StringHelper from "~/helpers/StringHelper";
import { DescriptionLabel } from "../../GeneDetailsMode";
import cs from "./property_list.scss";

interface PropertyListProps {
  array: DescriptionLabel[];
}

const PropertyList = ({ array }: PropertyListProps) => {
  return (
    <>
      {array.map((property, index) => {
        const { label, description } = property;

        return (
          <div key={label} className={index > 0 && cs.property}>
            <span className={cs.geneFamilyName}>
              {StringHelper.capitalizeFirstLetter(label + ": ")}
            </span>
            {description}
          </div>
        );
      })}
    </>
  );
};

export default PropertyList;
