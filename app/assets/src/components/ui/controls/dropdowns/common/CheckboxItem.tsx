import cx from "classnames";
import React from "react";
import { IconCheckSmall } from "~ui/icons";
import BareDropdown from "../BareDropdown";
import cs from "./checkbox_item.scss";

interface CheckboxItemProps {
  boxed?: boolean;
  checked?: boolean;
  label?: string;
  onOptionClick?: $TSFixMeFunction;
  value?: $TSFixMe;
}

const CheckboxItem = ({
  value,
  label,
  checked,
  onOptionClick,
  boxed,
}: CheckboxItemProps) => (
  <BareDropdown.Item
    onClick={(e: $TSFixMe) => {
      e.stopPropagation();
      onOptionClick(value, !checked);
    }}
  >
    <div className={cs.listElement}>
      <div
        data-testid="checked"
        className={cx(
          checked && cs.checked,
          cs.listCheckmark,
          boxed && cs.boxed,
        )}
      >
        <IconCheckSmall className={cs.icon} />
      </div>
      <div
        className={cs.listLabel}
        data-testid={`dropdown-${label.replace(/ /g, "-").toLowerCase()}`}
      >
        {label}
      </div>
    </div>
  </BareDropdown.Item>
);

export default CheckboxItem;
