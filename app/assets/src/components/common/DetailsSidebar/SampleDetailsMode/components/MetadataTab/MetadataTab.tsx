import { mapValues } from "lodash/fp";
import React, { useMemo, useState } from "react";
import { graphql, useFragment } from "react-relay";
import { WorkflowLabelType } from "~/components/utils/workflows";
import { Metadata, MetadataTypes, SampleType } from "~/interface/shared";
import MetadataSection from "../../MetadataSection";
import { processAdditionalInfo } from "../../utils";
import { MetadataSectionContent } from "./components/MetadataSectionContent";
import { MetadataSectionContentFragment$key } from "./components/MetadataSectionContent/__generated__/MetadataSectionContentFragment.graphql";
import { MetadataTabMetadataFragment$key } from "./__generated__/MetadataTabMetadataFragment.graphql";

export const MetadataTabMetadataFragment = graphql`
  fragment MetadataTabMetadataFragment on SampleMetadata {
    additional_info {
      name @required(action: LOG)
      editable
      project_id @required(action: LOG)
      project_name @required(action: LOG)
      host_genome_taxa_category
      host_genome_name
      upload_date
    }
  }
`;

interface MetadataTabProps {
  currentWorkflowTab: WorkflowLabelType;
  metadataErrors?: { [key: string]: string | null };
  metadataTabFragmentKey: unknown;
  metadataTypes: MetadataTypes;
  nameLocal: string;
  onMetadataChange: (key: string, value: any, shouldSave?: boolean) => void;
  onMetadataSave: (key: string, metadata: Metadata) => Promise<void>;
  savePending?: boolean;
  sampleTypes: SampleType[];
  setNameLocal: (name: string) => void;
  snapshotShareId?: string;
  sampleId?: number | string;
}
export interface Section {
  name: string;
  keys: string[];
}
export type SectionEditingLookup = {
  [key: Section["name"]]: boolean;
};

export const MetadataTab = ({
  currentWorkflowTab,
  metadataErrors,
  metadataTabFragmentKey,
  metadataTypes,
  nameLocal,
  onMetadataChange,
  onMetadataSave,
  sampleTypes,
  sampleId,
  savePending,
  setNameLocal,
  snapshotShareId,
}: MetadataTabProps) => {
  const data = useFragment(
    MetadataTabMetadataFragment,
    metadataTabFragmentKey as MetadataTabMetadataFragment$key,
  );
  const additionalInfo = processAdditionalInfo(data?.additional_info);
  const getMetadataSections = () => {
    // Group the MetadataFields by group name
    // Include Sample Info by default so that special cases in SAMPLE_ADDITIONAL_INFO always show
    const nameToFields = { "Sample Info": [] };
    Object.values(metadataTypes).forEach(field => {
      if (field.group === null) return;
      const name = field.group + " Info";
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
            metadataErrors={metadataErrors}
            metadataTypes={metadataTypes}
            onMetadataChange={onMetadataChange}
            onMetadataSave={onMetadataSave}
            nameLocal={nameLocal}
            sampleTypes={sampleTypes}
            section={section}
            sectionEditing={sectionEditing}
            setNameLocal={setNameLocal}
            snapshotShareId={snapshotShareId}
            metadataTabFragmentKey={
              metadataTabFragmentKey as MetadataSectionContentFragment$key
            }
            sampleId={sampleId}
          />
        </MetadataSection>
      ))}
    </div>
  );
};
