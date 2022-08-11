import { set, mapValues } from "lodash/fp";
import React from "react";

import { trackEvent } from "~/api/analytics";
import FieldList from "~/components/common/DetailsSidebar/FieldList";
import MetadataInput from "~/components/common/Metadata/MetadataInput";
import Input from "~/components/ui/controls/Input";

import { BooleanNums } from "~/interface/shared";
import { Metadata, returnHipaaCompliantMetadata } from "~utils/metadata";
import MetadataSection from "./MetadataSection";
import { AdditionalInfo } from "./SampleDetailsMode";
import { SAMPLE_ADDITIONAL_INFO } from "./constants";
import cs from "./sample_details_mode.scss";

export type MetadataTypes = {
  [key: string]: MetadataType;
};

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
}

interface MetadataTabState {
  sectionOpen?: {
    [key: Section["name"]]: boolean;
  };
  sectionEditing?: {
    [key: Section["name"]]: boolean;
  };
  sections?: Section[];
}

interface Section {
  name: string;
  keys: string[];
}

interface SampleType {
  created_at: string;
  group: string;
  human_only: false;
  id: number;
  insect_only: false;
  name: string;
  updated_at: string;
}

export interface MetadataType {
  dataType: string;
  default_for_new_host_genome: 0;
  description: string | null;
  examples: { [key: number]: string[] } | null;
  group: string | null;
  host_genome_ids: number[];
  isBoolean: boolean;
  is_required: BooleanNums;
  key: string;
  name: string;
  options: string[] | null;
}

class MetadataTab extends React.Component<MetadataTabProps, MetadataTabState> {
  constructor(props: MetadataTabProps) {
    super(props);

    const sections = this.getMetadataSections();
    this.state = {
      sectionOpen: {
        // Open the first section by default.
        [sections[0].name]: true,
      },
      sectionEditing: {},
      sections,
    };
  }

  getMetadataSections = () => {
    // Group the MetadataFields by group name
    // Include Sample Info by default so that special cases in SAMPLE_ADDITIONAL_INFO always show
    const nameToFields = { "Sample Info": [] };
    Object.values(this.props.metadataTypes).forEach(field => {
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

  toggleSection = (section: Section) => {
    const { sectionOpen, sectionEditing } = this.state;
    const newValue = !sectionOpen[section.name];
    const newState: MetadataTabState = {
      sectionOpen: set(section.name, newValue, sectionOpen),
    };

    // If we are closing a section, stop editing it.
    if (sectionOpen[section.name]) {
      newState.sectionEditing = set(section.name, false, sectionEditing);
    }

    this.setState(newState);
    trackEvent("MetadataTab_section_toggled", {
      section: section.name,
      sectionOpen: newValue,
      ...this.props.additionalInfo,
    });
  };

  toggleSectionEdit = (section: Section) => {
    const { sectionEditing, sectionOpen } = this.state;
    const newValue = !sectionEditing[section.name];
    const newState: MetadataTabState = {
      sectionEditing: set(section.name, newValue, sectionEditing),
    };

    if (!sectionEditing[section.name]) {
      // Only one section can be edited at a time.
      newState.sectionEditing = mapValues(sectionEditing, () => false);
      newState.sectionEditing[section.name] = true;
      // The edited section should be opened.
      newState.sectionOpen = set(section.name, true, sectionOpen);
    }
    this.setState(newState);
    trackEvent("MetadataTab_section-edit_toggled", {
      section: section.name,
      sectionEditing: newValue,
      ...this.props.additionalInfo,
    });
  };

  renderInput = (metadataType: MetadataType) => {
    const {
      metadata,
      onMetadataChange,
      onMetadataSave,
      metadataErrors,
      additionalInfo,
      sampleTypes,
    } = this.props;
    return (
      <div className={cs.inputWrapper}>
        <MetadataInput
          className={cs.metadataInput}
          value={metadata[metadataType.key]}
          metadataType={metadataType}
          onChange={onMetadataChange}
          onSave={onMetadataSave}
          isHuman={additionalInfo.host_genome_taxa_category === "human"}
          isInsect={additionalInfo.host_genome_taxa_category === "insect"}
          sampleTypes={sampleTypes}
        />
        {metadataErrors[metadataType.key] && (
          <div className={cs.error}>{metadataErrors[metadataType.key]}</div>
        )}
      </div>
    );
  };

  static renderMetadataValue = (val: string | { name: string }) => {
    return val === undefined || val === null || val === "" ? (
      <div className={cs.emptyValue}>--</div>
    ) : (
      <div className={cs.metadataValue}>
        {/* If we want to display an object (e.g. location object), provide a 'name' field */}
        {typeof val === "object" && val.name !== undefined ? val.name : val}
      </div>
    );
  };

  renderMetadataType = (metadataType: MetadataType) => {
    const { metadata, additionalInfo } = this.props;
    let metadataValue = metadata[metadataType.key];

    const isHuman = additionalInfo.host_genome_taxa_category === "human";
    if (isHuman) {
      metadataValue = returnHipaaCompliantMetadata(
        metadataType.key,
        metadataValue,
      );
    }

    return MetadataTab.renderMetadataValue(metadataValue);
  };

  renderMetadataSectionContent = (section: Section) => {
    const {
      metadataTypes,
      additionalInfo,
      onMetadataChange,
      onMetadataSave,
      snapshotShareId,
    } = this.props;
    const { sectionEditing } = this.state;

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
              MetadataTab.renderMetadataValue(additionalInfo[info.key])
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
      metadataFields.push({
        label: metadataTypes[key].name,
        value: isSectionEditing
          ? this.renderInput(metadataTypes[key])
          : this.renderMetadataType(metadataTypes[key]),
      });
    });

    return <FieldList fields={metadataFields} className={cs.metadataFields} />;
  };

  render() {
    return (
      <div>
        {this.state.sections.map(section => (
          <MetadataSection
            key={section.name}
            editable={this.props.additionalInfo.editable}
            toggleable
            onToggle={() => this.toggleSection(section)}
            open={this.state.sectionOpen[section.name]}
            onEditToggle={() => this.toggleSectionEdit(section)}
            editing={this.state.sectionEditing[section.name]}
            title={section.name}
            savePending={this.props.savePending}
          >
            {this.renderMetadataSectionContent(section)}
          </MetadataSection>
        ))}
      </div>
    );
  }
}

export default MetadataTab;
