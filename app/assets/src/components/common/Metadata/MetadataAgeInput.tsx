import cx from "classnames";
import React, { KeyboardEvent, useEffect, useState } from "react";
import { MetadataValue } from "~/interface/shared";
import Input from "~ui/controls/Input";
import { IconAlertSmall } from "~ui/icons";
import { FIELDS_THAT_HAVE_MAX_INPUT } from "./constants";
import cs from "./metadata_age_input.scss";
import { MetadataInputProps } from "./types";

// Description: This is a MetadataInput component for the "Host Age" field and is only surfaced when the sample host is human.
// This component enforces a max value to ensure that users enter HIPAA-complaint host ages.
// User-entered ages above the max will be stored as maxAge + 1 in the backend (see ensureDefinedValue)
// and will be displayed as "≥ {maxAge}" on the frontend (see returnHipaaCompliantMetadata).
//  - Note: The MetadataAgeInput is a numerical input box. To display the string "≥ {max value}",
//    the input box is zeroed out and "≥ {maxAge}" is shown as the placeholder value.
//    For this reason, there are custom react hooks that handle user interactions (ie. up/down input box arrows,
//    backspace/delete key) while input box is zeroed and displays the "≥ {max value}" placeholder.
// A warning message is surfaced when the user changes the host age to a value which exceeds the max.

interface MetadataAgeInputProps
  extends Pick<
    MetadataInputProps,
    "className" | "value" | "metadataType" | "onChange" | "onSave"
  > {
  ensureDefinedValue: ({
    key,
    value,
    type,
    taxaCategory,
  }: {
    key: string;
    value: MetadataValue;
    type: MetadataInputProps["metadataType"]["dataType"];
    taxaCategory: string;
  }) => MetadataValue;
}

const MetadataAgeInput = ({
  className,
  value,
  metadataType,
  onChange,
  onSave,
  ensureDefinedValue,
}: MetadataAgeInputProps) => {
  const maxAge = FIELDS_THAT_HAVE_MAX_INPUT[metadataType.key];
  const [safeHumanAge, setSafeHumanAge] = useState(value);
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
        onChange(metadataType.key, (maxAge - 1).toString());
      } else if (safeHumanAge === 1) {
        // User pressed up arrow or scrolled to increment age
        setSafeHumanAge(maxAge + 1);
        onChange(metadataType.key, (maxAge + 1).toString());
      }
    }
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    setHipaaWarning(safeHumanAge >= maxAge);
  }, [safeHumanAge]);

  const handleKeyDown = (keyEvent: KeyboardEvent<HTMLInputElement>) => {
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
          hipaaWarning && ageChanged && "warning",
        )}
        onChange={(val: MetadataValue) => {
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
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(e)}
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

export default MetadataAgeInput;
