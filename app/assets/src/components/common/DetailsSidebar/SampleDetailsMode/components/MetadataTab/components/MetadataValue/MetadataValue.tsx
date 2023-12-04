import React from "react";
import cs from "~/components/common/DetailsSidebar/SampleDetailsMode/sample_details_mode.scss";

interface MetadataValueProps {
  value: string | { name: string } | null | undefined;
}

export const MetadataValue = ({ value }: MetadataValueProps) => {
  return value === undefined || value === null || value === "" ? (
    <div className={cs.emptyValue}>--</div>
  ) : (
    <div className={cs.metadataValue}>
      {/* If we want to display an object (e.g. location object), provide a 'name' field */}
      {typeof value === "object" && value.name !== undefined
        ? value.name
        : value}
    </div>
  );
};
