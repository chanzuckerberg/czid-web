import React from "react";
import PropTypes from "prop-types";
import { isArray } from "lodash";

import Input from "~/components/ui/controls/Input";
import Dropdown from "~/components/ui/controls/dropdowns/Dropdown";
import GeoSearchInputBox from "../ui/controls/GeoSearchInputBox";

class MetadataInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      locationWarning: "",
    };
  }

  handleLocationSelect = result => {
    if (result.geo_level && result.geo_level === "city") {
      console.log(result);
      console.log("This will be saved at the county level");
      const match = result.name.match(/,\s(.*)/);
      if (match && match.length >= 2) result.name = match[1];

      result.name = result.name
        .split(", ")
        .shift()
        .join(", ");
      this.setState({
        locationWarning: "Changed to county/district for privacy",
      });
    }
    return result;
  };

  render() {
    const {
      value,
      onChange,
      onSave,
      metadataType,
      className,
      isHuman,
    } = this.props;
    const { locationWarning } = this.state;

    if (isArray(metadataType.options)) {
      const options = metadataType.options.map(option => ({
        text: option,
        value: option,
      }));
      return (
        <Dropdown
          fluid
          floating
          options={options}
          onChange={val => onChange(metadataType.key, val, true)}
          value={value}
          className={className}
          usePortal
          withinModal={this.props.withinModal}
        />
      );
    } else if (metadataType.dataType === "date") {
      return (
        <Input
          className={className}
          onChange={val => onChange(metadataType.key, val)}
          onBlur={() => onSave && onSave(metadataType.key)}
          value={value}
          placeholder={isHuman ? "YYYY-MM" : "YYYY-MM-DD"}
          type="text"
        />
      );
    } else if (metadataType.dataType === "location") {
      return (
        <React.Fragment>
          <GeoSearchInputBox
            className={className}
            // Calls save on selection
            onResultSelect={({ result }) => {
              result = this.handleLocationSelect(result);
              onChange(metadataType.key, result, true);
            }}
            value={value}
          />
          {locationWarning}
        </React.Fragment>
      );
    } else {
      return (
        <Input
          className={className}
          onChange={val => onChange(metadataType.key, val)}
          onBlur={() => onSave && onSave(metadataType.key)}
          value={value}
          type={metadataType.dataType === "number" ? "number" : "text"}
        />
      );
    }
  }
}

MetadataInput.propTypes = {
  className: PropTypes.string,
  value: PropTypes.any,
  metadataType: PropTypes.shape({
    key: PropTypes.string,
    dataType: PropTypes.oneOf(["number", "string", "date", "location"]),
    options: PropTypes.arrayOf(PropTypes.string),
  }),
  // Third optional parameter signals to the parent whether to immediately save. false means "wait for onSave to fire".
  // This is useful for the text input, where the parent wants to save onBlur, not onChange.
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func,
  withinModal: PropTypes.bool,
  isHuman: PropTypes.bool,
};

export default MetadataInput;
