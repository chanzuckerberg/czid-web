import { cx } from "@emotion/css";
import { PopoverProps } from "@mui/material";
import { Menu, MenuItem, Icon, Button } from "czifui";
import React, { useState } from "react";

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
  editable,
  deletable,
}: {
  className: string;
  workflow: WORKFLOW_VALUES;
  deleteId: number;
  onDeleteRunSuccess: () => void;
  editable: boolean;
  deletable: boolean;
}) => {
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
        <MenuItem
          disabled={!(editable && deletable)}
          onClick={() => {
            closeActionsMenu();
            setIsBulkDeleteModalOpen(true);
          }}
        >
          <div
            className={cx(
              cs.dropdownItem,
              !(editable && deletable) && cs.iconDisabled,
            )}
          >
            <Icon
              sdsIcon="trashCan"
              sdsSize="xs"
              sdsType="static"
              className={cs.icon}
            />
            <span>{`Delete ${getShorthandFromWorkflow(workflow)} Run`}</span>
          </div>
        </MenuItem>
      </Menu>
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        selectedIds={[deleteId]}
        workflow={workflow}
        onSuccess={onDeleteRunSuccess}
      />
    </>
  );
};
