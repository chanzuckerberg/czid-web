import cx from "classnames";
import { isUndefined, isNaN, isNull, isArray, max, min } from "lodash/fp";
import React from "react";

import SampleTypeSearchBox from "~/components/common/SampleTypeSearchBox";
import { UserContext } from "~/components/common/UserContext";
import PropTypes from "~/components/utils/propTypes";
import GeoSearchInputBox, {
  processLocationSelection,
  getLocationWarning,
} from "~ui/controls/GeoSearchInputBox";
import Input from "~ui/controls/Input";
import Toggle from "~ui/controls/Toggle";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import { IconAlertSmall } from "~ui/icons";
import MetadataAgeInput from "./MetadataAgeInput";
import {
  FIELDS_THAT_HAVE_MAX_INPUT,
  FIELDS_THAT_SHOULD_NOT_HAVE_NEGATIVE_INPUT,
} from "./constants";

import cs from "./metadata_input.scss";

// If value is undefined or null, an empty string should be displayed.
// However, if the MetadataInput is re-used for different samples, and the second sample has no value
// a particular metadata field, undefined will be passed to the MetadataInput for that field
// and the first sample's metadata value will contain to be shown.
// To avoid this, we explicitly pass in the empty string whenever the field is undefined or null.
const ensureDefinedValue = ({ key = "", value, type, taxaCategory }) => {
  let safeValue = isUndefined(value) || isNull(value) ? "" : value;

  if (
    FIELDS_THAT_SHOULD_NOT_HAVE_NEGATIVE_INPUT.has(key) &&
    type === "number" &&
    safeValue
  ) {
    const parsedValue = Number.parseInt(value);
    if (!isNaN(parsedValue)) {
      // Do not let the user select values less than 0
      safeValue = max([parsedValue, 0]);
    }

    // Numbers that exceed maxValue will be stored as maxValue + 1
    if (key in FIELDS_THAT_HAVE_MAX_INPUT && taxaCategory === "human") {
      const maxValue = FIELDS_THAT_HAVE_MAX_INPUT[key];
      safeValue = min([safeValue, maxValue + 1]);
    }
  }
  return safeValue;
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
    const newState = {};

    // warnings passed in as props take precedence.
    if (props.warning) {
      newState.warning = props.warning;
    } else if (props.metadataType.dataType === "location") {
      newState.warning = getLocationWarning(props.value);
    }

    return newState;
  }

  render() {
    const {
      value,
      onChange,
      onSave,
      metadataType,
      className,
      taxaCategory,
      sampleTypes,
      isHuman,
    } = this.props;
    const { warning } = this.state;

    if (metadataType.key === "sample_type") {
      return (
        <SampleTypeSearchBox
          className={className}
          value={value}
          onResultSelect={({ result }) => {
            // Result can be plain text or a match. We treat them the same.
            onChange(metadataType.key, result.name || result, true);
          }}
          taxaCategory={taxaCategory}
          sampleTypes={sampleTypes}
        />
      );
    } else if (metadataType.isBoolean) {
      const onLabel = metadataType.options[0];
      const offLabel = metadataType.options[1];
      return (
        <Toggle
          initialChecked={value === onLabel}
          onLabel={onLabel}
          offLabel={offLabel}
          onChange={label => onChange(metadataType.key, label, true)}
          className={className}
        />
      );
    } else if (isArray(metadataType.options)) {
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
          value={ensureDefinedValue({
            key: metadataType.key,
            value,
            type: metadataType.dataType,
            taxaCategory,
          })}
          placeholder={taxaCategory === "human" ? "YYYY-MM" : "YYYY-MM-DD"}
          type="text"
        />
      );
    } else if (metadataType.dataType === "location") {
      return (
        <>
          <GeoSearchInputBox
            className={className}
            // .warning reference in old .idseq-ui.input file
            inputClassName={cx(warning && value && "warning")}
            // Calls save on selection
            onResultSelect={({ result: selection }) => {
              const result = processLocationSelection(
                selection,
                taxaCategory === "human"
              );
              onChange(metadataType.key, result, true);
            }}
            value={value}
          />
          {warning && value && (
            <div className={cs.warning}>
              <div className={cs.icon}>
                <IconAlertSmall type="warning" />
              </div>
              <div>{warning}</div>
            </div>
          )}
        </>
      );
    } else if (
      metadataType.key === "host_age" &&
      (isHuman || taxaCategory === "human")
    ) {
      return (
        <MetadataAgeInput
          className={className}
          value={ensureDefinedValue({
            key: metadataType.key,
            value,
            type: metadataType.dataType,
            taxaCategory,
          })}
          metadataType={metadataType}
          onChange={onChange}
          onSave={onSave}
          ensureDefinedValue={ensureDefinedValue}
        />
      );
    } else {
      return (
        <Input
          className={className}
          onChange={val => onChange(metadataType.key, val)}
          onBlur={() => onSave && onSave(metadataType.key)}
          value={ensureDefinedValue({
            key: metadataType.key,
            value,
            type: metadataType.dataType,
            taxaCategory,
          })}
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
    isBoolean: PropTypes.bool,
  }),
  // Third optional parameter signals to the parent whether to immediately save. false means "wait for onSave to fire".
  // This is useful for the text input, where the parent wants to save onBlur, not onChange.
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func,
  withinModal: PropTypes.bool,
  taxaCategory: PropTypes.string,
  isHuman: PropTypes.bool,
  warning: PropTypes.string,
  sampleTypes: PropTypes.arrayOf(PropTypes.SampleTypeProps).isRequired,
};

MetadataInput.contextType = UserContext;

export default MetadataInput;
