import { Icon, Menu, MenuItem, Tooltip } from "@czi-sds/components";
import { PopoverProps } from "@mui/material";
import cx from "classnames";
import React, { useState } from "react";
import { withAnalytics } from "~/api/analytics";
import cs from "./samples_view.scss";
import ToolbarButtonIcon from "./ToolbarButtonIcon";

interface BulkSamplesActionsMenuProps {
  noObjectsSelected: boolean;
  handleBulkKickoffAmr: () => void;
  handleClickPhyloTree: () => void;
}

const BulkSamplesActionsMenu = ({
  noObjectsSelected,
  handleBulkKickoffAmr,
  handleClickPhyloTree,
}: BulkSamplesActionsMenuProps) => {
  const [menuAnchorEl, setMenuAnchorEl] =
    useState<PopoverProps["anchorEl"]>(null);

  const openActionsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const closeActionsMenu = () => {
    setMenuAnchorEl(null);
  };

  const renderBulkKickoffAmr = () => {
    let bulkKickoffAmrMenuItem = (
      <MenuItem
        className={cs.dropdownItem}
        disabled={noObjectsSelected}
        onClick={() => {
          closeActionsMenu();
          handleBulkKickoffAmr();
        }}
      >
        <div className={cs.itemWrapper}>
          <div
            className={cx(
              cs.bulkActionsIcon,
              noObjectsSelected && cs.iconDisabled,
            )}
          >
            <Icon sdsIcon={"bacteria"} sdsSize="xs" sdsType="static" />
          </div>
          {"Run Antimicrobial Resistance Pipeline"}
        </div>
      </MenuItem>
    );

    if (noObjectsSelected) {
      bulkKickoffAmrMenuItem = (
        <Tooltip
          arrow
          placement="top"
          title={"Select at least 1 mNGS run to perform this action."}
        >
          <span>{bulkKickoffAmrMenuItem}</span>
        </Tooltip>
      );
    }

    return bulkKickoffAmrMenuItem;
  };

  const renderKickoffPhyloTree = () => {
    return (
      <MenuItem
        onClick={withAnalytics(() => {
          closeActionsMenu();
          handleClickPhyloTree();
        }, "SamplesView_phylo-tree-modal-open_clicked")}
      >
        <div data-testid="create-phylogenetic-tree" className={cs.itemWrapper}>
          <div className={cs.bulkActionsIcon}>
            <Icon sdsIcon={"treeHorizontal"} sdsSize="xs" sdsType="static" />
          </div>
          {"Create Phylogenetic Tree"}
        </div>
      </MenuItem>
    );
  };

  return (
    <>
      <ToolbarButtonIcon
        testId="dots-horizontal"
        className={cs.action}
        icon="dotsHorizontal"
        popupText={"More Actions"}
        popupSubtitle={noObjectsSelected ? "Select at least 1 sample" : ""}
        disabled={noObjectsSelected}
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
        {renderKickoffPhyloTree()}
        {handleBulkKickoffAmr && renderBulkKickoffAmr()}
      </Menu>
    </>
  );
};

export default BulkSamplesActionsMenu;
