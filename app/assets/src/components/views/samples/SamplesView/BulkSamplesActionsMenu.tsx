import { PopoverProps } from "@mui/material";
import cx from "classnames";
import { Icon, Menu, MenuItem, Tooltip } from "czifui";
import React, { useContext, useState } from "react";
import { withAnalytics } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import {
  AMR_V1_FEATURE,
  BULK_DELETION_FEATURE,
} from "~/components/utils/features";

import ToolbarButtonIcon from "./ToolbarButtonIcon";
import cs from "./samples_view.scss";

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
  const [menuAnchorEl, setMenuAnchorEl] = useState<PopoverProps["anchorEl"]>(
    null,
  );
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};

  const hasBulkDeletion = allowedFeatures.includes(BULK_DELETION_FEATURE);
  const hasAmr = allowedFeatures.includes(AMR_V1_FEATURE);

  const disableMenu = !hasBulkDeletion && noObjectsSelected;

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
          {hasBulkDeletion && (
            <div
              className={cx(
                cs.bulkActionsIcon,
                noObjectsSelected && cs.iconDisabled,
              )}
            >
              <Icon sdsIcon={"bacteria"} sdsSize="xs" sdsType="static" />
            </div>
          )}
          <span>{"Run Antimicrobial Resistance Pipeline (Beta)"}</span>
        </div>
      </MenuItem>
    );

    if (noObjectsSelected && hasBulkDeletion) {
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
        <div className={cs.itemWrapper}>
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
        className={cs.action}
        icon="dotsHorizontal"
        popupText={
          hasBulkDeletion
            ? "More Actions"
            : "Run Antimicrobial Resistance Pipeline (Beta)"
        }
        popupSubtitle={disableMenu ? "Select at least 1 sample" : ""}
        disabled={disableMenu}
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
        {hasBulkDeletion && renderKickoffPhyloTree()}
        {hasAmr && renderBulkKickoffAmr()}
      </Menu>
    </>
  );
};

export default BulkSamplesActionsMenu;
