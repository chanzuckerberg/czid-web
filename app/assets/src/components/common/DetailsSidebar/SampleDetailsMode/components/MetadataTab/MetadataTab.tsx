import { mapValues } from "lodash/fp";
import React, { useMemo, useState } from "react";
import { WorkflowLabelType } from "~/components/utils/workflows";
import { Metadata, MetadataTypes, SampleType } from "~/interface/shared";
import MetadataSection from "../../MetadataSection";
import { AdditionalInfo } from "../../types";
import { MetadataSectionContent } from "./components/MetadataSectionContent";

interface MetadataTabProps {
  metadata: Metadata;
  metadataTypes: MetadataTypes;
  onMetadataChange: (key: string, value: any, shouldSave?: boolean) => void;
  onMetadataSave: (key: string) => Promise<void>;
  savePending?: boolean;
  additionalInfo: AdditionalInfo | null;
  metadataErrors?: { [key: string]: string };
  sampleTypes: SampleType[];
  snapshotShareId?: string;
  currentWorkflowTab: WorkflowLabelType;
}
export interface Section {
  name: string;
  keys: string[];
}
export type SectionEditingLookup = {
  [key: Section["name"]]: boolean;
};

export const MetadataTab = ({
  metadataTypes,
  metadata,
  onMetadataChange,
  onMetadataSave,
  metadataErrors,
  additionalInfo,
  sampleTypes,
  snapshotShareId,
  currentWorkflowTab,
  savePending,
}: MetadataTabProps) => {
  const getMetadataSections = () => {
    // Group the MetadataFields by group name
    // Include Sample Info by default so that special cases in SAMPLE_ADDITIONAL_INFO always show
    const nameToFields = { "Sample Info": [] };
    Object.values(metadataTypes).forEach(field => {
      const name =
        field.group === null ? "Custom Metadata" : field.group + " Info";
      if (name in nameToFields) {
        nameToFields[name].push(field.key);
      } else {
        nameToFields[name] = [field.key];
      }
    });

    // Format as [{name: "Sample Info", keys: ["sample_type"]}, {name: "Host Info", keys: ["age"]}]
    return Object.entries(nameToFields).map(entry => {
      return {
        name: entry[0],
        keys: entry[1].sort(),
      };
    });
  };

  const sections = useMemo(getMetadataSections, [metadataTypes]);
  const [isSectionOpen, setIsSectionOpen] = useState({
    [sections[0].name]: true,
  });
  const [sectionEditing, setSectionEditing] = useState<SectionEditingLookup>(
    {},
  );

  const toggleSection = (section: Section) => {
    const toggleValue = !isSectionOpen[section.name];
    setIsSectionOpen({
      ...isSectionOpen,
      [section.name]: toggleValue,
    });
    setSectionEditing({ ...sectionEditing, [section.name]: false });
  };

  const toggleSectionEdit = (section: Section) => {
    const toggleValue = !sectionEditing[section.name];
    // Only one section can be edited at a time.
    setSectionEditing({
      ...mapValues(sectionEditing, () => false),
      [section.name]: toggleValue,
    });
    // The section being edited should be opened.
    setIsSectionOpen({ ...isSectionOpen, [section.name]: true });
  };

  return (
    <div>
      {sections.map(section => (
        <MetadataSection
          key={section.name}
          editable={additionalInfo?.editable}
          toggleable
          onToggle={() => toggleSection(section)}
          open={isSectionOpen[section.name]}
          onEditToggle={() => toggleSectionEdit(section)}
          editing={sectionEditing[section.name]}
          title={section.name}
          savePending={savePending}
        >
          <MetadataSectionContent
            additionalInfo={additionalInfo}
            currentWorkflowTab={currentWorkflowTab}
            metadata={metadata}
            metadataErrors={metadataErrors}
            metadataTypes={metadataTypes}
            onMetadataChange={onMetadataChange}
            onMetadataSave={onMetadataSave}
            sampleTypes={sampleTypes}
            section={section}
            sectionEditing={sectionEditing}
            snapshotShareId={snapshotShareId}
          />
        </MetadataSection>
      ))}
    </div>
  );
};
