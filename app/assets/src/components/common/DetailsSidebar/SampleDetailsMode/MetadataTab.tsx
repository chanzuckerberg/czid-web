import { mapValues } from "lodash/fp";
import React, { useMemo, useState } from "react";
import FieldList from "~/components/common/DetailsSidebar/FieldList";
import MetadataInput from "~/components/common/Metadata/MetadataInput";
import Input from "~/components/ui/controls/Input";
import { WorkflowLabelType, WORKFLOW_TABS } from "~/components/utils/workflows";
import {
  Metadata,
  MetadataType,
  MetadataTypes,
  SampleType,
} from "~/interface/shared";
import { returnHipaaCompliantMetadata } from "~utils/metadata";
import { SAMPLE_ADDITIONAL_INFO } from "./constants";
import MetadataSection from "./MetadataSection";
import cs from "./sample_details_mode.scss";
import { AdditionalInfo } from "./SampleDetailsMode";

interface MetadataTabProps {
  metadata: Metadata;
  metadataTypes: MetadataTypes;
  onMetadataChange: (key: string, value: any, shouldSave?: boolean) => void;
  onMetadataSave: (key: string) => Promise<void>;
  savePending?: boolean;
  additionalInfo: AdditionalInfo;
  metadataErrors?: { [key: string]: string };
  sampleTypes: SampleType[];
  snapshotShareId?: string;
  currentWorkflowTab: WorkflowLabelType;
}
interface Section {
  name: string;
  keys: string[];
}
type SectionEditingLookup = {
  [key: Section["name"]]: boolean;
};

const MetadataTab = ({
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

  const renderInput = (metadataType: MetadataType) => {
    return (
      <div className={cs.inputWrapper}>
        <MetadataInput
          className={cs.metadataInput}
          value={metadata[metadataType.key]}
          metadataType={metadataType}
          onChange={onMetadataChange}
          onSave={onMetadataSave}
          isHuman={additionalInfo.host_genome_taxa_category === "human"}
          sampleTypes={sampleTypes}
          taxaCategory={additionalInfo.host_genome_taxa_category}
        />
        {metadataErrors[metadataType.key] && (
          <div className={cs.error}>{metadataErrors[metadataType.key]}</div>
        )}
      </div>
    );
  };

  const renderMetadataValue = (val: string | { name: string }) => {
    return val === undefined || val === null || val === "" ? (
      <div className={cs.emptyValue}>--</div>
    ) : (
      <div className={cs.metadataValue}>
        {/* If we want to display an object (e.g. location object), provide a 'name' field */}
        {typeof val === "object" && val.name !== undefined ? val.name : val}
      </div>
    );
  };

  const renderMetadataType = (metadataType: MetadataType) => {
    let metadataValue = metadata[metadataType.key];

    const isHuman = additionalInfo.host_genome_taxa_category === "human";
    if (isHuman && typeof metadataValue === "string") {
      metadataValue = returnHipaaCompliantMetadata(
        metadataType.key,
        metadataValue,
      );
    }

    return renderMetadataValue(metadataValue);
  };

  const renderMetadataSectionContent = (section: Section) => {
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
      : `/home?project_id=${additionalInfo.project_id}`;

    // Special Sample Info fields.
    // TODO: Consider refactoring so SAMPLE_ADDITIONAL_INFO doesn't have to be special.
    if (section.name === "Sample Info" && !isSectionEditing) {
      SAMPLE_ADDITIONAL_INFO.forEach(info => {
        metadataFields.push({
          label: info.name,
          value:
            info.key === "project_name" ? (
              <a className={cs.projectLink} href={projectLink}>
                {additionalInfo[info.key]}
              </a>
            ) : (
              renderMetadataValue(additionalInfo[info.key])
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
            value={additionalInfo.name}
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
          value: isSectionEditing
            ? renderInput(metadataTypes[key])
            : renderMetadataType(metadataTypes[key]),
        });
      }
    });

    return <FieldList fields={metadataFields} className={cs.metadataFields} />;
  };

  return (
    <div>
      {sections.map(section => (
        <MetadataSection
          key={section.name}
          editable={additionalInfo.editable}
          toggleable
          onToggle={() => toggleSection(section)}
          open={isSectionOpen[section.name]}
          onEditToggle={() => toggleSectionEdit(section)}
          editing={sectionEditing[section.name]}
          title={section.name}
          savePending={savePending}
        >
          {renderMetadataSectionContent(section)}
        </MetadataSection>
      ))}
    </div>
  );
};

export default MetadataTab;
