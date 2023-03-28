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
  closeOnBlur?: boolean;
}

export const PopoverMinimalButton = ({
  label,
  content,
  disabled,
  details,
  open,
  setOpen,
  closeOnBlur = true,
}: PopoverMinimalButtonPropsType) => {
  if (setOpen === undefined || open === undefined) {
    [open, setOpen] = React.useState<boolean>(false);
  }

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null,
  );

  const onClose = (_event, reason) => {
    // sometimes we want to keep the popover to stay open when a user clicks outside of it or presses escape (e.g., in order to force them to choose either the 'cancel' or 'apply' button if that's part of the `content`).
    const shouldClose =
      closeOnBlur || !["backdropClick", "escapeKeyDown"].includes(reason);

    if (shouldClose) {
      setOpen(false);
      setAnchorEl(null);
    }
  };

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
        onClose={(_event, reason) => {
          onClose(_event, reason);
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
