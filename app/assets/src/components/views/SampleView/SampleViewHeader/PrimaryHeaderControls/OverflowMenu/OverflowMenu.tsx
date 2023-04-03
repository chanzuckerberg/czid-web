import { cx } from "@emotion/css";
import { PopoverProps } from "@mui/material";
import { Menu, MenuItem, Icon, Button, Tooltip } from "czifui";
import React, { useContext, useState } from "react";

import { UserContext } from "~/components/common/UserContext";
import {
  WORKFLOW_VALUES,
  getShorthandFromWorkflow,
} from "~/components/utils/workflows";
import { BulkDeleteModal } from "~/components/views/samples/SamplesView/BulkDeleteModal";
import cs from "./overflow_menu.scss";

export const OverflowMenu = ({
  className,
  workflow,
  deleteId,
  onDeleteRunSuccess,
  redirectOnSuccess,
  runFinalized,
  userOwnsRun,
}: {
  className: string;
  workflow: WORKFLOW_VALUES;
  deleteId: number;
  onDeleteRunSuccess: () => void;
  redirectOnSuccess?: boolean;
  runFinalized: boolean;
  userOwnsRun: boolean;
}) => {
  const { admin: userIsAdmin } = useContext(UserContext) || {};
  const [menuAnchorEl, setMenuAnchorEl] = useState<PopoverProps["anchorEl"]>(
    null,
  );
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const openActionsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const closeActionsMenu = () => {
    setMenuAnchorEl(null);
  };

  const deleteDisabled = !(userIsAdmin || userOwnsRun) || !runFinalized;

  const renderDeleteRunMenuItem = () => {
    let deleteRunMenuItem = (
      <MenuItem
        disabled={deleteDisabled}
        onClick={() => {
          closeActionsMenu();
          setIsBulkDeleteModalOpen(true);
        }}
      >
        <div className={cx(cs.dropdownItem, deleteDisabled && cs.iconDisabled)}>
          <Icon
            sdsIcon="trashCan"
            sdsSize="xs"
            sdsType="static"
            className={cs.icon}
          />
          <span>{`Delete ${getShorthandFromWorkflow(workflow)} Run`}</span>
        </div>
      </MenuItem>
    );
    if (deleteDisabled) {
      const tooltipText =
        userIsAdmin || userOwnsRun
          ? !runFinalized && "You can only delete runs that are completed."
          : "Only the user that initiated the run can perform this action.";

      deleteRunMenuItem = (
        <Tooltip arrow placement="top" title={tooltipText}>
          <span>{deleteRunMenuItem}</span>
        </Tooltip>
      );
    }
    return deleteRunMenuItem;
  };

  return (
    <>
      <Button
        className={cx(cs.helpButton, className)}
        sdsType="secondary"
        sdsStyle="rounded"
        startIcon={
          <Icon sdsIcon="dotsHorizontal" sdsSize="l" sdsType="button" />
        }
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
        {renderDeleteRunMenuItem()}
      </Menu>
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        selectedIds={[deleteId]}
        workflow={workflow}
        onSuccess={onDeleteRunSuccess}
        redirectOnSuccess={redirectOnSuccess}
      />
    </>
  );
};
