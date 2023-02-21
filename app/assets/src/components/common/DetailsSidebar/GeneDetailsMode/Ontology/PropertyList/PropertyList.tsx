import React from "react";
import StringHelper from "~/helpers/StringHelper";
import { DescriptionLabel } from "../../GeneDetailsMode";

interface PropertyListProps {
  array: DescriptionLabel[];
}

const PropertyList = ({ array }: PropertyListProps) => {
  return (
    <>
      {array.map(property => {
        const { label, description } = property;

        return (
          <div key={label}>
            <em>{StringHelper.capitalizeFirstLetter(label)}</em>
            {description}
          </div>
        );
      })}
    </>
  );
};

export default PropertyList;
