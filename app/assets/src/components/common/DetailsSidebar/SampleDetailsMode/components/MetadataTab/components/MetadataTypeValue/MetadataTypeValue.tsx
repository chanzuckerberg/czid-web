import React from "react";
import { AdditionalInfo } from "~/components/common/DetailsSidebar/SampleDetailsMode/types";
import { returnHipaaCompliantMetadata } from "~/components/utils/metadata";
import { Metadata, MetadataType } from "~/interface/shared";
import { MetadataValue } from "../MetadataValue";

interface MetadataTypeValueProps {
  metadata: Metadata;
  metadataType: MetadataType;
  additionalInfo: AdditionalInfo | null;
}

export const MetadataTypeValue = ({
  additionalInfo,
  metadata,
  metadataType,
}: MetadataTypeValueProps) => {
  let metadataValue = metadata[metadataType.key];

  const isHuman = additionalInfo?.host_genome_taxa_category === "human";
  if (isHuman && typeof metadataValue === "string") {
    metadataValue = returnHipaaCompliantMetadata(
      metadataType.key,
      metadataValue,
    );
  }

  return <MetadataValue value={metadataValue} />;
};
