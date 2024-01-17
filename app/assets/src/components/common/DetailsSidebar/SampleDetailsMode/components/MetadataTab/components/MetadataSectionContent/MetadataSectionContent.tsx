import React, { useEffect, useState } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";
import FieldList from "~/components/common/DetailsSidebar/FieldList";
import { SAMPLE_ADDITIONAL_INFO } from "~/components/common/DetailsSidebar/SampleDetailsMode/constants";
import cs from "~/components/common/DetailsSidebar/SampleDetailsMode/sample_details_mode.scss";
import { AdditionalInfo } from "~/components/common/DetailsSidebar/SampleDetailsMode/types";
import MetadataInput from "~/components/common/Metadata/MetadataInput";
import Input from "~/components/ui/controls/Input";
import { processMetadata } from "~/components/utils/metadata";
import { WorkflowLabelType, WORKFLOW_TABS } from "~/components/utils/workflows";
import {
  CreateMutable,
  Metadata,
  MetadataTypes,
  RawMetadata,
  SampleType,
} from "~/interface/shared";
import { Section, SectionEditingLookup } from "../../MetadataTab";
import { MetadataTypeValue } from "../MetadataTypeValue";
import { MetadataValue } from "../MetadataValue";
import { MetadataSectionContentFragment$key } from "./__generated__/MetadataSectionContentFragment.graphql";
interface MetadataSectionContentProps {
  additionalInfo: AdditionalInfo | null;
  currentWorkflowTab: WorkflowLabelType;
  metadataErrors?: { [key: string]: string };
  metadataTypes: MetadataTypes;
  nameLocal: string;
  onMetadataChange: (key: string, value: any, shouldSave?: boolean) => void;
  onMetadataSave: (key: string, metadataLocal: Metadata) => Promise<void>;
  sampleTypes: SampleType[];
  section: Section;
  sectionEditing: SectionEditingLookup;
  setNameLocal: (name: string) => void;
  snapshotShareId?: string;
  metadataTabFragmentKey: MetadataSectionContentFragment$key;
  savePending?: boolean;
}

export const MetadataSectionContentFragment = graphql`
  fragment MetadataSectionContentFragment on SampleMetadata {
    metadata {
      location_id
      raw_value
      key
      number_validated_value
      metadata_field_id
      sample_id
      string_validated_value
      updated_at
      id
      date_validated_value
      location_validated_value {
        ... on query_SampleMetadata_metadata_items_location_validated_value_oneOf_0 {
          name
        }
        ... on query_SampleMetadata_metadata_items_location_validated_value_oneOf_1 {
          name
          id
        }
      }
      created_at
      base_type
    }
  }
`;

export const MetadataSectionContent = ({
  additionalInfo,
  currentWorkflowTab,
  metadataErrors,
  metadataTypes,
  onMetadataChange,
  onMetadataSave,
  nameLocal,
  sampleTypes,
  section,
  sectionEditing,
  setNameLocal,
  snapshotShareId,
  metadataTabFragmentKey,
}: MetadataSectionContentProps) => {
  const data = useFragment<CreateMutable<MetadataSectionContentFragment$key>>(
    MetadataSectionContentFragment,
    metadataTabFragmentKey,
  );
  const metadata: Metadata | null = processMetadata({
    metadata: data?.metadata as unknown as RawMetadata[] | null,
    flatten: true,
  });
  const [metadataLocal, setMetadataLocal] = useState(metadata);
  useEffect(() => {
    // for each key in metadataErrors
    metadataErrors &&
      Object.keys(metadataErrors).forEach(key => {
        // if key is in metadata
        if (
          key in metadata &&
          metadataErrors[key] &&
          metadataLocal[key] !== metadata[key]
        ) {
          setMetadataLocal({
            ...metadataLocal,
            [key]: metadata[key],
          });
        }
      });
  }, [metadata, metadataErrors, metadataLocal]);

  const validKeys = section.keys.filter(key =>
    Object.keys(metadataTypes).includes(key),
  );

  const isSectionEditing = sectionEditing[section.name];

  const onMetadataChangeWrapper = (
    key: string,
    value: any,
    shouldSave?: boolean,
  ) => {
    if (key === "name") {
      setNameLocal(value);
    } else {
      const newMetadata = { ...metadataLocal, [key]: value };
      setMetadataLocal(newMetadata);
    }
    onMetadataChange(key, value, shouldSave);
  };
  const metadataFields: {
    label: string;
    value: React.ReactNode;
  }[] = [];

  const projectLink = snapshotShareId
    ? `/pub/${snapshotShareId}`
    : `/home?project_id=${additionalInfo?.project_id}`;

  // Special Sample Info fields.
  // TODO: Consider refactoring so SAMPLE_ADDITIONAL_INFO doesn't have to be special.
  if (section.name === "Sample Info" && !isSectionEditing) {
    SAMPLE_ADDITIONAL_INFO.forEach(info => {
      metadataFields.push({
        label: info.name,
        value:
          info.key === "project_name" ? (
            <a className={cs.projectLink} href={projectLink}>
              {additionalInfo?.[info.key]}
            </a>
          ) : (
            <MetadataValue
              value={
                info.key === "name" ? nameLocal : additionalInfo?.[info.key]
              }
            />
          ),
      });
    });
  }

  // Sample name is a special case. It is not a MetadataField.
  // When editing, we need to show an input for Sample Name.
  if (section.name === "Sample Info" && isSectionEditing) {
    metadataFields.push({
      label: "Sample Name",
      value: (
        <Input
          onChange={val => onMetadataChangeWrapper("name", val)}
          onBlur={() => onMetadataSave("name", { name: nameLocal })}
          value={nameLocal}
          type="text"
          className={cs.sampleNameInput}
        />
      ),
    });
  }
  validKeys.forEach(key => {
    // We're temporarily hiding the "Library Prep" and "Sequencer" metadata fields for long-read-mngs samples
    // TODO: Add long-read-mngs sequencer options and re-enable this metadata field
    const hideMetadataField =
      currentWorkflowTab === WORKFLOW_TABS.LONG_READ_MNGS &&
      ["Library Prep", "Sequencer"].includes(metadataTypes[key].name);
    if (!hideMetadataField) {
      metadataFields.push({
        label: metadataTypes[key].name,
        value: isSectionEditing ? (
          <div className={cs.inputWrapper}>
            <MetadataInput
              className={cs.metadataInput}
              value={metadataLocal[key]}
              metadataType={metadataTypes[key]}
              onChange={onMetadataChangeWrapper}
              onSave={key => onMetadataSave(key, metadataLocal)}
              isHuman={additionalInfo?.host_genome_taxa_category === "human"}
              sampleTypes={sampleTypes}
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
              taxaCategory={additionalInfo?.host_genome_taxa_category}
            />
            {metadataErrors && metadataErrors[key] && (
              <div className={cs.error}>{metadataErrors[key]}</div>
            )}
          </div>
        ) : (
          <MetadataTypeValue
            additionalInfo={additionalInfo}
            metadata={metadataLocal}
            metadataType={metadataTypes[key]}
          />
        ),
      });
    }
  });

  return <FieldList fields={metadataFields} className={cs.metadataFields} />;
};
