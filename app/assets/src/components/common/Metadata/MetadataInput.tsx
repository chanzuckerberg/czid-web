import cx from "classnames";
import { isUndefined, isNaN, isNull, isArray, max, min } from "lodash/fp";
import React, { useState } from "react";

import SampleTypeSearchBox from "~/components/common/SampleTypeSearchBox";
import { UserContext } from "~/components/common/UserContext";
import GeoSearchInputBox, {
  processLocationSelection,
  getLocationWarning,
} from "~ui/controls/GeoSearchInputBox";
import Input from "~ui/controls/Input";
import Toggle from "~ui/controls/Toggle";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import { IconAlertSmall } from "~ui/icons";
import { MetadataType } from "../DetailsSidebar/SampleDetailsMode/MetadataTab";
import MetadataAgeInput from "./MetadataAgeInput";
import {
  FIELDS_THAT_HAVE_MAX_INPUT,
  FIELDS_THAT_SHOULD_NOT_HAVE_NEGATIVE_INPUT,
} from "./constants";

import cs from "./metadata_input.scss";

export interface MetadataInputProps {
  className: string;
  value: string | number | undefined;
  metadataType: Pick<
    MetadataType,
    "dataType" | "key" | "options" | "isBoolean"
  >;
  // Third optional parameter signals to the parent whether to immediately save. false means "wait for onSave to fire".
  // This is useful for the text input, where the parent wants to save onBlur, not onChange.
  onChange: (key: string, value: any, shouldSave?: boolean) => void;
  onSave: (key: string) => Promise<void>;
  isHuman: boolean;
  sampleTypes: SampleTypeProps[];
  warning?: string;
  withinModal?: boolean;
  taxaCategory?: string;
}

interface SampleTypeProps {
  name: string;
  group: string;
  insect_only: boolean;
  human_only: boolean;
}

// If value is undefined or null, an empty string should be displayed.
// However, if the MetadataInput is re-used for different samples, and the second sample has no value
// a particular metadata field, undefined will be passed to the MetadataInput for that field
// and the first sample's metadata value will contain to be shown.
// To avoid this, we explicitly pass in the empty string whenever the field is undefined or null.
const ensureDefinedValue = ({
  key = "",
  value,
  type,
  taxaCategory,
}: {
  key: string;
  value: string;
  type: MetadataInputProps["metadataType"]["dataType"];
  taxaCategory: string;
}): string => {
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

const MetadataInput = ({
  value,
  onChange,
  onSave,
  metadataType,
  className,
  taxaCategory,
  sampleTypes,
  isHuman,
  withinModal,
  warning = "",
}: MetadataInputProps) => {
  const [checkedWarning, setCheckedWarning] = useState("");
  const [prevWarning, setPrevWarning] = useState<string | null>(null);

  // Give priority to warnings coming in through props
  if (warning !== prevWarning) {
    if (warning) {
      setCheckedWarning(warning);
    } else if (metadataType.dataType === "location") {
      setCheckedWarning(getLocationWarning(value));
    }
    setPrevWarning(warning);
  }

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
        onChange={(label) => onChange(metadataType.key, label, true)}
        className={className}
      />
    );
  } else if (isArray(metadataType.options)) {
    const options = metadataType.options.map((option) => ({
      text: option,
      value: option,
    }));
    return (
      <Dropdown
        fluid
        floating
        options={options}
        onChange={(val) => onChange(metadataType.key, val, true)}
        value={value}
        className={className}
        usePortal
        withinModal={withinModal}
      />
    );
  } else if (metadataType.dataType === "date") {
    return (
      <Input
        className={className}
        onChange={(val) => onChange(metadataType.key, val)}
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
              taxaCategory === "human",
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
            <div>{checkedWarning}</div>
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
        onChange={(val) => onChange(metadataType.key, val)}
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
};

MetadataInput.contextType = UserContext;

export default MetadataInput;
