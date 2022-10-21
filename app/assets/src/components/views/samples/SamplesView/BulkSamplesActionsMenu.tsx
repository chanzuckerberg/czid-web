import { PopoverProps } from "@mui/material";
import { Icon, Menu, MenuItem } from "czifui";
import React, { useState } from "react";
import { ANALYTICS_EVENT_NAMES, withAnalytics } from "~/api/analytics";

import ToolbarButtonIcon from "./ToolbarButtonIcon";
import cs from "./samples_view.scss";

interface BulkSamplesActionsMenuProps {
  disabled: boolean;
  handleBulkKickoffAmr: () => void;
}

const BulkSamplesActionsMenu = ({
  disabled,
  handleBulkKickoffAmr,
}: BulkSamplesActionsMenuProps) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<PopoverProps["anchorEl"]>(
    null,
  );

  const openActionsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const closeActionsMenu = () => {
    setMenuAnchorEl(null);
  };

  return (
    <>
      <ToolbarButtonIcon
        className={cs.action}
        icon={
          <Icon sdsIcon="dotsHorizontal" sdsSize="xl" sdsType="iconButton" />
        }
        popupText="Run Antimicrobial Resistance Pipeline (Beta)"
        popupSubtitle={disabled ? "Select at least 1 sample" : ""}
        disabled={disabled}
        onClick={openActionsMenu}
      />
      <Menu
        anchorEl={menuAnchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        keepMounted
        open={Boolean(menuAnchorEl)}
        onClose={closeActionsMenu}
      >
        <MenuItem
          onClick={withAnalytics(() => {
            closeActionsMenu();
            handleBulkKickoffAmr();
          }, ANALYTICS_EVENT_NAMES.SAMPLES_VIEW_BULK_KICKOFF_AMR_WORKFLOW_TRIGGER_CLICKED)}
        >
          Run Antimicrobial Resistance Pipeline (Beta)
        </MenuItem>
      </Menu>
    </>
  );
};

export default BulkSamplesActionsMenu;
