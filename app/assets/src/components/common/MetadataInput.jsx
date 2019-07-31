import React from "react";
import PropTypes from "prop-types";
import { compact, get, isArray } from "lodash/fp";

import Input from "~/components/ui/controls/Input";
import Dropdown from "~/components/ui/controls/dropdowns/Dropdown";
import GeoSearchInputBox from "../ui/controls/GeoSearchInputBox";

import cs from "./metadata_input.scss";

export const LOCATION_PRIVACY_WARNING =
  "Changed to county/district level for personal privacy.";
export const LOCATION_UNRESOLVED_WARNING =
  "Unresolved plain text location, not shown on maps.";

// For human samples, drop the city part of the name and show a warning.
// Note that the backend will redo the geosearch for confirmation, so don't
// modify geo_level here.
// TODO(jsheu): Consider moving the warnings to the backend and generalizing.
export const processLocationSelection = (result, isHuman) => {
  let warning = "";
  if (isHuman && get("geo_level", result) === "city") {
    result.name = compact([
      result.subdivision_name,
      result.state_name,
      result.country_name,
    ]).join(", ");
    warning = LOCATION_PRIVACY_WARNING;
  } else if (!result.geo_level) {
    warning = LOCATION_UNRESOLVED_WARNING;
  }
  return { result, warning };
};

class MetadataInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // Small warning below the input. Only used for Locations currently.
      warning: props.warning,
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.warning !== state.prevPropsWarning) {
      return {
        warning: props.warning,
        prevPropsWarning: props.warning,
      };
    }
    return null;
  }

  render() {
    const {
      value,
      onChange,
      onSave,
      metadataType,
      className,
      isHuman,
    } = this.props;
    const { warning } = this.state;

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
              const { result: newResult, warning } = processLocationSelection(
                result,
                isHuman
              );
              onChange(metadataType.key, newResult, true);
              this.setState({ warning });
            }}
            value={value}
          />
          {warning && <span className={cs.warning}>{warning}</span>}
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

MetadataInput.defaultProps = {
  warning: "",
};

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
  warning: PropTypes.string,
};

export default MetadataInput;
