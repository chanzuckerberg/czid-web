import { Popover } from "@mui/material";
import { InputDropdown } from "czifui";
import React, { useState } from "react";

import cs from "./popover_minimal_button.scss";

interface PopoverMinimalButtonPropsType {
  label: string;
  content: JSX.Element;
  disabled: boolean;
  details?: string;
}

export const PopoverMinimalButton = ({
  label,
  content,
  disabled,
  details,
}: PopoverMinimalButtonPropsType) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <InputDropdown
        onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
          setAnchorEl(event.currentTarget)
        }
        sdsStage="default"
        sdsStyle="minimal"
        label={label}
        disabled={disabled}
        details={details}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        className={cs.popover}
      >
        {content}
      </Popover>
    </>
  );
};
