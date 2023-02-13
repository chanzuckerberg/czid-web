import cx from "classnames";
import React from "react";
import { CheckboxProps, Radio } from "semantic-ui-react";

import cs from "./toggle.scss";

interface ToggleProps {
  className?: string;
  onChange?: (label: string) => void;
  // Use isChecked when using custom logic to determine whether or not to toggle in the parent component
  isChecked?: boolean;
  onLabel: string;
  offLabel: string;
  initialChecked: boolean;
}

/**
 * Extension of semantic-ui radio toggle that shows on/off labels. The current
 * label is sent to the onChange handler. The current state can be overriden
 * by passing in new props.
 */

const Toggle = ({
  onLabel = "On",
  offLabel = "Off",
  onChange,
  isChecked,
  initialChecked = false,
  className,
}: ToggleProps) => {
  const [internalChecked, setInternalChecked] = React.useState(initialChecked);
  const [prevChecked, setPrevChecked] = React.useState(initialChecked);

  // For "apply all" to work, it needs to override local state
  if (prevChecked !== initialChecked) {
    setPrevChecked(initialChecked);
    setInternalChecked(initialChecked);
  }

  const handleChange = (_: unknown, inputProps: CheckboxProps) => {
    const checked = isChecked ?? inputProps.checked;
    setInternalChecked(checked);
    onChange && onChange(checked ? onLabel : offLabel);
  };
  return (
    <Radio
      toggle
      checked={isChecked ?? internalChecked}
      label={internalChecked ? onLabel : offLabel}
      onChange={handleChange}
      className={cx(className, cs.toggle)}
    />
  );
};

export default Toggle;
