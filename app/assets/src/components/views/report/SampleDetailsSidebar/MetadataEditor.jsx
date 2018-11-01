import React from "react";
import Input from "~/components/ui/controls/Input";
import Dropdown from "~/components/ui/controls/dropdowns/Dropdown";
import cs from "./sample_details_sidebar.scss";
import { isArray } from "lodash";
import PropTypes from "prop-types";

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
          className="idseq-ui threshold inner-dropdown"
          placeholder="Metric"
          fluid
          floating
          scrolling
          options={options}
          onChange={val => {
            onMetadataChange(metadataType.key, val);
            onMetadataSave(metadataType.key);
          }}
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
  metadata: PropTypes.shape({
    collection_location: PropTypes.string
  }),
  metadataTypes: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      dataType: PropTypes.oneOf(["string", "number"]),
      name: PropTypes.string
    })
  ),
  onMetadataChange: PropTypes.func.isRequired,
  onMetadataSave: PropTypes.func.isRequired
};

export default MetadataEditor;
