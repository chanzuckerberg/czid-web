import { Button, Icon, Menu, MenuItem, Tooltip } from "@czi-sds/components";
import { cx } from "@emotion/css";
import { PopoverProps } from "@mui/material";
import React, { useContext, useState } from "react";
import { UserContext } from "~/components/common/UserContext";
import { WorkflowLabelType } from "~/components/utils/workflows";
import { BulkDeleteModal } from "~/components/views/samples/SamplesView/BulkDeleteModal";
import cs from "./overflow_menu.scss";

interface OverflowMenuProps {
  readyToDelete: boolean;
  className: string;
  deleteId: number;
  onDeleteRunSuccess: () => void;
  redirectOnSuccess?: boolean;
  runFinalized: boolean;
  sampleUserId: number;
  bulkDeleteObjects: (selectedIds: number[]) => Promise<any>;
  validateUserCanDeleteObjects: (selectedIds: number[]) => Promise<any>;
  workflowShorthand: string;
  workflowLabel: WorkflowLabelType;
  isShortReadMngs: boolean;
}

export const OverflowMenu = ({
  readyToDelete,
  className,
  deleteId,
  onDeleteRunSuccess,
  redirectOnSuccess,
  runFinalized,
  sampleUserId,
  bulkDeleteObjects,
  validateUserCanDeleteObjects,
  workflowShorthand,
  workflowLabel,
  isShortReadMngs,
}: OverflowMenuProps) => {
  if (!readyToDelete) return null;
  const [menuAnchorEl, setMenuAnchorEl] =
    useState<PopoverProps["anchorEl"]>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const openActionsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const closeActionsMenu = () => {
    setMenuAnchorEl(null);
  };

  const { userId } = useContext(UserContext) || {};
  const userOwnsRun = userId === sampleUserId;
  const deleteDisabled = !(userOwnsRun && runFinalized);

  const renderDeleteRunMenuItem = () => {
    let deleteRunMenuItem = (
      <MenuItem
        disabled={deleteDisabled}
        onClick={() => {
          closeActionsMenu();
          setIsBulkDeleteModalOpen(true);
        }}
        data-testid="delete-run-menuitem"
      >
        <div className={cx(cs.dropdownItem, deleteDisabled && cs.iconDisabled)}>
          <Icon
            sdsIcon="trashCan"
            sdsSize="xs"
            sdsType="static"
            className={cs.icon}
          />
          <span>{`Delete ${workflowShorthand} Run`}</span>
        </div>
      </MenuItem>
    );
    if (deleteDisabled) {
      const tooltipText = userOwnsRun
        ? !runFinalized && "You can only delete runs that are completed."
        : "Only the user that initiated the run can perform this action.";

      deleteRunMenuItem = (
        <Tooltip
          arrow
          placement="top"
          title={tooltipText}
          data-testid="delete-disabled-tooltip"
        >
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
        data-testid="overflow-btn"
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
        onSuccess={onDeleteRunSuccess}
        redirectOnSuccess={redirectOnSuccess}
        bulkDeleteObjects={bulkDeleteObjects}
        validateUserCanDeleteObjects={validateUserCanDeleteObjects}
        workflowLabel={workflowLabel}
        isShortReadMngs={isShortReadMngs}
      />
    </>
  );
};
