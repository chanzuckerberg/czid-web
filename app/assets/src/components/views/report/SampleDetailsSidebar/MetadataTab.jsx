import React from "react";
import { mapValues, isArray, filter, includes } from "lodash";
import PropTypes from "~/components/utils/propTypes";
import Input from "~/components/ui/controls/Input";
import Dropdown from "~/components/ui/controls/dropdowns/Dropdown";
import MetadataSection from "./MetadataSection";
import ObjectHelper from "~/helpers/ObjectHelper";
import { METADATA_SECTIONS, SAMPLE_ADDITIONAL_INFO } from "./constants";
import cs from "./sample_details_sidebar.scss";

class MetadataTab extends React.Component {
  state = {
    sectionOpen: {
      // Open the first section by default.
      [METADATA_SECTIONS[0].name]: true
    },
    sectionEditing: {}
  };

  toggleSection = section => {
    const { sectionOpen, sectionEditing } = this.state;
    const newState = {
      sectionOpen: ObjectHelper.set(
        sectionOpen,
        section.name,
        !sectionOpen[section.name]
      )
    };

    // If we are closing a section, stop editing it.
    if (sectionOpen[section.name]) {
      newState.sectionEditing = ObjectHelper.set(
        sectionEditing,
        section.name,
        false
      );
    }

    this.setState(newState);
  };

  toggleSectionEdit = section => {
    const { sectionEditing, sectionOpen } = this.state;
    const newState = {
      sectionEditing: ObjectHelper.set(
        sectionEditing,
        section.name,
        !sectionEditing[section.name]
      )
    };

    if (!sectionEditing[section.name]) {
      // Only one section can be edited at a time.
      newState.sectionEditing = mapValues(sectionEditing, () => false);
      newState.sectionEditing[section.name] = true;
      // The edited section should be opened.
      newState.sectionOpen = ObjectHelper.set(sectionOpen, section.name, true);
    }
    this.setState(newState);
  };

  renderInput = metadataType => {
    const { metadata, onMetadataChange, onMetadataSave } = this.props;

    if (isArray(metadataType.options)) {
      const options = metadataType.options.map(option => ({
        text: option,
        value: option
      }));
      return (
        <Dropdown
          fluid
          floating
          scrolling
          options={options}
          onChange={val => onMetadataChange(metadataType.key, val, true)}
          value={metadata[metadataType.key]}
        />
      );
    }

    return (
      <Input
        onChange={val => onMetadataChange(metadataType.key, val)}
        onBlur={() => onMetadataSave(metadataType.key)}
        value={metadata[metadataType.key]}
        type={metadataType.dataType === "number" ? "number" : "text"}
        className={cs.input}
      />
    );
  };

  renderMetadataValue = metadataType => {
    const { metadata } = this.props;
    const val = metadata[metadataType.key];
    return val === undefined || val === null || val === "" ? (
      <div className={cs.emptyValue}>--</div>
    ) : (
      <div className={cs.metadataValue}>{val}</div>
    );
  };

  renderMetadataSectionContent = section => {
    const {
      metadataTypes,
      additionalInfo,
      onMetadataChange,
      onMetadataSave
    } = this.props;
    const { sectionEditing } = this.state;

    const validKeys = filter(section.keys, key =>
      includes(Object.keys(metadataTypes), key)
    );
    const isSectionEditing = sectionEditing[section.name];
    return (
      <div>
        {/* Special section for Sample Info */}
        {section.name === "Sample Info" &&
          !isSectionEditing &&
          SAMPLE_ADDITIONAL_INFO.map(info => (
            <div className={cs.field} key={info.key}>
              <div className={cs.label}>{info.name}</div>
              {info.key === "project_name" ? (
                <a
                  className={cs.projectLink}
                  href={`/home?project_id=${additionalInfo.project_id}`}
                >
                  {additionalInfo[info.key]}
                </a>
              ) : (
                <div className={cs.metadataValue}>
                  {additionalInfo[info.key]}
                </div>
              )}
            </div>
          ))}
        {/* Sample name is a special case */}
        {section.name === "Sample Info" &&
          isSectionEditing && (
            <div className={cs.field}>
              <div className={cs.label}>Sample Name</div>
              <Input
                onChange={val => onMetadataChange("name", val)}
                onBlur={() => onMetadataSave("name")}
                value={additionalInfo.name}
                type="text"
                className={cs.input}
              />
            </div>
          )}
        {validKeys.map(key => (
          <div className={cs.field} key={metadataTypes[key].key}>
            <div className={cs.label}>{metadataTypes[key].name}</div>
            {isSectionEditing
              ? this.renderInput(metadataTypes[key])
              : this.renderMetadataValue(metadataTypes[key])}
          </div>
        ))}
      </div>
    );
  };

  render() {
    const { metadata } = this.props;

    if (!metadata) {
      return <div className={cs.loadingMsg}>Loading...</div>;
    }

    return (
      <div>
        {METADATA_SECTIONS.map(section => (
          <MetadataSection
            key={section.name}
            editable
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
  ),
  metadataTypes: PropTypes.objectOf(PropTypes.MetadataType),
  onMetadataChange: PropTypes.func.isRequired,
  onMetadataSave: PropTypes.func.isRequired,
  savePending: PropTypes.bool,
  additionalInfo: PropTypes.shape({
    name: PropTypes.string,
    project_name: PropTypes.string,
    upload_date: PropTypes.string,
    host_genome_name: PropTypes.string
  })
};

export default MetadataTab;
