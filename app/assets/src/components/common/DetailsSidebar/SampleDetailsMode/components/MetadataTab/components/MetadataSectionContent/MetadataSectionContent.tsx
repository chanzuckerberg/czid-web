import React from "react";
import FieldList from "~/components/common/DetailsSidebar/FieldList";
import { SAMPLE_ADDITIONAL_INFO } from "~/components/common/DetailsSidebar/SampleDetailsMode/constants";
import cs from "~/components/common/DetailsSidebar/SampleDetailsMode/sample_details_mode.scss";
import { AdditionalInfo } from "~/components/common/DetailsSidebar/SampleDetailsMode/types";
import MetadataInput from "~/components/common/Metadata/MetadataInput";
import Input from "~/components/ui/controls/Input";
import { WorkflowLabelType, WORKFLOW_TABS } from "~/components/utils/workflows";
import {
  Metadata,
  MetadataType,
  MetadataTypes,
  SampleType,
} from "~/interface/shared";
import { Section, SectionEditingLookup } from "../../MetadataTab";
import { MetadataTypeValue } from "../MetadataTypeValue";
import { MetadataValue } from "../MetadataValue";

interface MetadataSectionContentProps {
  additionalInfo: AdditionalInfo | null;
  currentWorkflowTab: WorkflowLabelType;
  metadata: Metadata;
  metadataErrors?: { [key: string]: string };
  metadataTypes: MetadataTypes;
  onMetadataChange: (key: string, value: any, shouldSave?: boolean) => void;
  onMetadataSave: (key: string) => Promise<void>;
  sampleTypes: SampleType[];
  section: Section;
  sectionEditing: SectionEditingLookup;
  snapshotShareId?: string;
}

export const MetadataSectionContent = ({
  additionalInfo,
  currentWorkflowTab,
  metadata,
  metadataErrors,
  metadataTypes,
  onMetadataChange,
  onMetadataSave,
  sampleTypes,
  section,
  sectionEditing,
  snapshotShareId,
}: MetadataSectionContentProps) => {
  const validKeys = section.keys.filter(key =>
    Object.keys(metadataTypes).includes(key),
  );

  const isSectionEditing = sectionEditing[section.name];

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
            <MetadataValue value={additionalInfo?.[info.key]} />
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
          onChange={val => onMetadataChange("name", val)}
          onBlur={() => onMetadataSave("name")}
          value={additionalInfo?.name}
          type="text"
          className={cs.sampleNameInput}
        />
      ),
    });
  }

  // TODO: (ehoops) Move this to the return statement
  const renderInput = (metadataType: MetadataType) => {
    return (
      <div className={cs.inputWrapper}>
        <MetadataInput
          className={cs.metadataInput}
          value={metadata[metadataType.key]}
          metadataType={metadataType}
          onChange={onMetadataChange}
          onSave={onMetadataSave}
          isHuman={additionalInfo?.host_genome_taxa_category === "human"}
          sampleTypes={sampleTypes}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          taxaCategory={additionalInfo?.host_genome_taxa_category}
        />
        {metadataErrors && metadataErrors[metadataType.key] && (
          <div className={cs.error}>{metadataErrors[metadataType.key]}</div>
        )}
      </div>
    );
  };

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
          renderInput(metadataTypes[key])
        ) : (
          <MetadataTypeValue
            additionalInfo={additionalInfo}
            metadata={metadata}
            metadataType={metadataTypes[key]}
          />
        ),
      });
    }
  });

  return <FieldList fields={metadataFields} className={cs.metadataFields} />;
};
