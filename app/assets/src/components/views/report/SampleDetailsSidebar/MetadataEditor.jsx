import React from "react";
import { isArray } from "lodash";
import Input from "~/components/ui/controls/Input";
import Dropdown from "~/components/ui/controls/dropdowns/Dropdown";
import cs from "./sample_details_sidebar.scss";
import PropTypes from "~/components/utils/propTypes";

class MetadataEditor extends React.Component {
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

  render() {
    const { metadataTypes } = this.props;
    return (
      <div>
        {metadataTypes.map(metadataType => (
          <div className={cs.field} key={metadataType.key}>
            <div className={cs.label}>{metadataType.name}</div>
            {this.renderInput(metadataType)}
          </div>
        ))}
      </div>
    );
  }
}

MetadataEditor.propTypes = {
  metadata: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  metadataTypes: PropTypes.arrayOf(PropTypes.MetadataType),
  onMetadataChange: PropTypes.func.isRequired,
  onMetadataSave: PropTypes.func.isRequired
};

export default MetadataEditor;
