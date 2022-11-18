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
  // @ts-expect-error 'Item' does not exist on BareDropdown
  <BareDropdown.Item
    onClick={(e: $TSFixMe) => {
      e.stopPropagation();
      onOptionClick(value, !checked);
    }}
  >
    <div className={cs.listElement}>
      <div
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
        data-testid={`dropdown-${label.replaceAll(" ", "-").toLowerCase()}`}
      >
        {label}
      </div>
    </div>
    {/* @ts-expect-error 'Item' does not exist on BareDropdown */}
  </BareDropdown.Item>
);

export default CheckboxItem;
