import cx from "classnames";
import React, { useEffect, useState } from "react";

import PropTypes from "~/components/utils/propTypes";
import Input from "~ui/controls/Input";
import { IconAlertSmall } from "~ui/icons";
import { FIELDS_THAT_HAVE_MAX_INPUT } from "./constants";

import cs from "./metadata_age_input.scss";

const MetadataAgeInput = ({
  className,
  value,
  metadataType,
  onChange,
  onSave,
  ensureDefinedValue,
}) => {
  const maxAge = FIELDS_THAT_HAVE_MAX_INPUT[metadataType.key];
  const [safeHumanAge, setSafeHumanAge] = useState(value);
  const [hipaaWarning, setHipaaWarning] = useState(value >= maxAge);
  const [ageChanged, setAgeChanged] = useState(false);

  useEffect(() => {
    setSafeHumanAge(value);
  }, [value]);

  useEffect(() => {
    if (hipaaWarning) {
      if (safeHumanAge === 0) {
        // User pressed down arrow or scrolled to decrement age
        setSafeHumanAge(maxAge - 1);
      } else if (safeHumanAge === 1) {
        // User pressed up arrow or scrolled to increment age
        setSafeHumanAge(maxAge + 1);
      }
    }
    setHipaaWarning(safeHumanAge >= maxAge);
  }, [safeHumanAge]);

  const handleKeyDown = keyEvent => {
    if (
      hipaaWarning &&
      (keyEvent.key === "Backspace" || keyEvent.key === "Delete")
    ) {
      setSafeHumanAge("");
    }
  };

  return (
    <>
      <Input
        className={cx(
          className,
          cs.darkPlaceholder,
          hipaaWarning && ageChanged && "warning"
        )}
        onChange={val => {
          const definedVal = ensureDefinedValue({
            key: metadataType.key,
            value: val,
            type: metadataType.dataType,
            taxaCategory: "human",
          });
          setAgeChanged(true);
          setSafeHumanAge(definedVal);
          onChange(metadataType.key, definedVal.toString());
        }}
        onKeyDown={e => handleKeyDown(e)}
        onBlur={() => onSave && onSave(metadataType.key)}
        value={hipaaWarning ? "" : safeHumanAge}
        type={"number"}
        placeholder={hipaaWarning ? "≥ " + maxAge : ""}
      />
      {hipaaWarning && ageChanged && (
        <div className={cs.warning}>
          <div className={cs.icon}>
            <IconAlertSmall type="warning" />
          </div>
          <div>Changed to ≥ {maxAge} for HIPAA.</div>
        </div>
      )}
    </>
  );
};

MetadataAgeInput.propTypes = {
  className: PropTypes.string,
  value: PropTypes.any,
  metadataType: PropTypes.shape({
    key: PropTypes.string,
    dataType: PropTypes.oneOf(["number", "string", "date", "location"]),
    options: PropTypes.arrayOf(PropTypes.string),
    isBoolean: PropTypes.bool,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func,
  ensureDefinedValue: PropTypes.func.isRequired,
};

export default MetadataAgeInput;
