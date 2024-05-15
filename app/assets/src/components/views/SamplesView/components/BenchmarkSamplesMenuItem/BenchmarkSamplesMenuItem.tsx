import { Icon, MenuItem } from "@czi-sds/components";
import cx from "classnames";
import React from "react";
import cs from "./benchmark_samples_menu_item.scss";

interface BenchmarkSamplesMenuItemProps {
  disabled: boolean;
  onClick: () => void;
}

export const BenchmarkSamplesMenuItem = ({
  disabled,
  onClick,
}: BenchmarkSamplesMenuItemProps) => {
  return (
    <MenuItem onClick={onClick}>
      <div data-testid="benchmark-samples" className={cs.itemWrapper}>
        <div className={cx(cs.bulkActionsIcon, disabled && cs.iconDisabled)}>
          <Icon sdsIcon="circlesOverlap" sdsSize="xs" sdsType="static" />
        </div>
        Benchmark Samples
      </div>
    </MenuItem>
  );
};
