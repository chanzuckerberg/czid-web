import { Popover } from "@mui/material";
import { InputDropdown } from "czifui";
import React from "react";

import cs from "./popover_minimal_button.scss";

interface PopoverMinimalButtonPropsType {
  label: string;
  content: JSX.Element;
  disabled: boolean;
  details?: string;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

export const PopoverMinimalButton = ({
  label,
  content,
  disabled,
  details,
  open,
  setOpen,
}: PopoverMinimalButtonPropsType) => {
  if (setOpen === undefined || open === undefined) {
    [open, setOpen] = React.useState<boolean>(false);
  }

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null,
  );

  return (
    <div>
      <InputDropdown
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          setAnchorEl(event.currentTarget);
          setOpen(!open);
        }}
        sdsStage="default"
        sdsStyle="minimal"
        label={label}
        disabled={disabled}
        details={details}
      />
      <Popover
        open={open && Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => {
          setOpen(false);
          setAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        className={cs.popover}
      >
        {content}
      </Popover>
    </div>
  );
};
