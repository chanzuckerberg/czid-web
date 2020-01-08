import React from "react";
import PropTypes from "prop-types";
import { isArray } from "lodash/fp";
import cx from "classnames";

import { SampleTypeType } from "~/components/utils/propTypes";
import Input from "~ui/controls/Input";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import GeoSearchInputBox, {
  processLocationSelection,
  getLocationWarning,
} from "~ui/controls/GeoSearchInputBox";
import SampleTypeSearchBox from "~ui/controls/SampleTypeSearchBox";
import AlertIcon from "~ui/icons/AlertIcon";

import cs from "./metadata_input.scss";

class MetadataInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // Small warning below the input. Only used for Locations currently.
      warning: props.warning,
      // This stores the value that the current warning is associated with.
      warnedValue: props.value,
    };
  }

  static getDerivedStateFromProps(props, state) {
    const newState = {};

    if (props.warning !== state.prevPropsWarning) {
      newState.warning = props.warning;
      newState.prevPropsWarning = props.warning;
      newState.warnedValue = props.value;
    }
    // If the currently passed value is not equal to the value we have a warning about,
    // calculate the warning for this value.
    else if (props.value !== state.warnedValue) {
      newState.warnedValue = props.value;

      // warnings passed in as props take precedence.
      if (!props.warning) {
        newState.warning = getLocationWarning(props.value);
      }
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
      isHuman,
      isInsect,
      sampleTypes,
    } = this.props;
    const { warning } = this.state;

    if (metadataType.key === "sample_type") {
      return (
        <SampleTypeSearchBox
          className={className}
          value={value}
          onResultSelect={({ result }) => {
            // Result can be plain text or a match. We treat them the same.
            onChange(metadataType.key, result.name);
          }}
          isHuman={isHuman}
          isInsect={isInsect}
          sampleTypes={sampleTypes}
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
            // .warning reference in old .idseq-ui.input file
            inputClassName={cx(warning && value && "warning")}
            // Calls save on selection
            onResultSelect={({ result: selection }) => {
              const { result, warning } = processLocationSelection(
                selection,
                isHuman
              );
              // Set warnedValue, so that a LOCATION_PRIVACY_WARNING warning isn't overwritten when the result propagates back down
              // as this.props.value.
              // When the result comes back down, we won't be able to detect whether LOCATION_PRIVACY_WARNING applies,
              // since we've modified the location object here in processLocationSelection.
              this.setState({ warning, warnedValue: result });
              onChange(metadataType.key, result, true);
            }}
            value={value}
          />
          {warning &&
            value && (
              <div className={cs.warning}>
                <div className={cs.icon}>
                  <AlertIcon />
                </div>
                <div>{warning}</div>
              </div>
            )}
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
  isInsect: PropTypes.bool,
  warning: PropTypes.string,
  sampleTypes: PropTypes.arrayOf(SampleTypeType).isRequired,
};

export default MetadataInput;
