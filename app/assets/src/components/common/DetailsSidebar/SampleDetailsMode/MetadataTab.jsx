import React from "react";
import { mapValues, filter, includes } from "lodash";
// TODO(mark): Refactor all calls to lodash/fp.
import { isObject, set, values } from "lodash/fp";

import PropTypes from "~/components/utils/propTypes";
import Input from "~/components/ui/controls/Input";
import MetadataInput from "~/components/common/MetadataInput";
import { logAnalyticsEvent } from "~/api/analytics";
import FieldList from "~/components/common/DetailsSidebar/FieldList";

import MetadataSection from "./MetadataSection";
import { SAMPLE_ADDITIONAL_INFO } from "./constants";
import cs from "./sample_details_mode.scss";

class MetadataTab extends React.Component {
  constructor(props) {
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
    let nameToFields = { "Sample Info": [] };
    values(this.props.metadataTypes).forEach(field => {
      const name =
        field.group === null ? "Custom Metadata" : field.group + " Info";
      if (nameToFields.hasOwnProperty(name)) {
        nameToFields[name].push(field.key);
      } else {
        nameToFields[name] = [field.key];
      }
    });

    // Format as [{name: "Sample Info", keys: ["sample_type"]}, {name: "Host Info", keys: ["age"]}]
    return Object.entries(nameToFields).map(entry => {
      return { name: entry[0], keys: entry[1].sort() };
    });
  };

  toggleSection = section => {
    const { sectionOpen, sectionEditing } = this.state;
    const newValue = !sectionOpen[section.name];
    const newState = {
      sectionOpen: set(section.name, newValue, sectionOpen),
    };

    // If we are closing a section, stop editing it.
    if (sectionOpen[section.name]) {
      newState.sectionEditing = set(section.name, false, sectionEditing);
    }

    this.setState(newState);
    logAnalyticsEvent("MetadataTab_section_toggled", {
      section: section.name,
      sectionOpen: newValue,
      ...this.props.additionalInfo,
    });
  };

  toggleSectionEdit = section => {
    const { sectionEditing, sectionOpen } = this.state;
    const newValue = !sectionEditing[section.name];
    const newState = {
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
    logAnalyticsEvent("MetadataTab_section-edit_toggled", {
      section: section.name,
      sectionEditing: newValue,
      ...this.props.additionalInfo,
    });
  };

  renderInput = metadataType => {
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

  static renderMetadataValue = val => {
    return val === undefined || val === null || val === "" ? (
      <div className={cs.emptyValue}>--</div>
    ) : (
      <div className={cs.metadataValue}>
        {/* If we want to display an object (e.g. location object), provide a 'name' field */}
        {isObject(val) && val.name !== undefined ? val.name : val}
      </div>
    );
  };

  renderMetadataType = metadataType => {
    const { metadata } = this.props;
    return MetadataTab.renderMetadataValue(metadata[metadataType.key]);
  };

  renderMetadataSectionContent = section => {
    const {
      metadataTypes,
      additionalInfo,
      onMetadataChange,
      onMetadataSave,
    } = this.props;
    const { sectionEditing } = this.state;

    const validKeys = filter(section.keys, key =>
      includes(Object.keys(metadataTypes), key)
    );
    const isSectionEditing = sectionEditing[section.name];

    const metadataFields = [];

    // Special Sample Info fields.
    // TODO: Consider refactoring so SAMPLE_ADDITIONAL_INFO doesn't have to be special.
    if (section.name === "Sample Info" && !isSectionEditing) {
      SAMPLE_ADDITIONAL_INFO.forEach(info => {
        metadataFields.push({
          label: info.name,
          value:
            info.key === "project_name" ? (
              <a
                className={cs.projectLink}
                href={`/home?project_id=${additionalInfo.project_id}`}
              >
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

MetadataTab.propTypes = {
  metadata: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ).isRequired,
  metadataTypes: PropTypes.objectOf(PropTypes.MetadataType).isRequired,
  onMetadataChange: PropTypes.func.isRequired,
  onMetadataSave: PropTypes.func.isRequired,
  savePending: PropTypes.bool,
  additionalInfo: PropTypes.shape({
    name: PropTypes.string.isRequired,
    project_id: PropTypes.number.isRequired,
    project_name: PropTypes.string.isRequired,
    upload_date: PropTypes.string,
    host_genome_name: PropTypes.string,
    editable: PropTypes.bool,
  }).isRequired,
  metadataErrors: PropTypes.objectOf(PropTypes.string),
  sampleTypes: PropTypes.arrayOf(PropTypes.SampleTypeProps).isRequired,
};

export default MetadataTab;
