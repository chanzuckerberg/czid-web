import { Icon, Menu, MenuItem, Tooltip } from "@czi-sds/components";
import { PopoverProps } from "@mui/material";
import cx from "classnames";
import React, { useContext, useState } from "react";
import { UserContext } from "~/components/common/UserContext";
import { BENCHMARKING_FEATURE } from "~/components/utils/features";
import { BenchmarkSamplesMenuItem } from "./BenchmarkSamplesMenuItem";
import cs from "./samples_view.scss";
import ToolbarButtonIcon from "./ToolbarButtonIcon";

interface BulkSamplesActionsMenuProps {
  noObjectsSelected: boolean;
  handleBulkKickoffAmr: () => void;
  handleClickBenchmark: () => void;
  handleClickPhyloTree: () => void;
}

const BulkSamplesActionsMenu = ({
  noObjectsSelected,
  handleBulkKickoffAmr,
  handleClickPhyloTree,
  handleClickBenchmark,
}: BulkSamplesActionsMenuProps) => {
  const { admin, allowedFeatures = [] } = useContext(UserContext) || {};
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
        onClick={() => {
          closeActionsMenu();
          handleClickPhyloTree();
        }}
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

  const hasAccessToBenchmark =
    admin && allowedFeatures.includes(BENCHMARKING_FEATURE);

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
        {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2774 */}
        {handleBulkKickoffAmr && renderBulkKickoffAmr()}
        {hasAccessToBenchmark && (
          <BenchmarkSamplesMenuItem
            disabled={noObjectsSelected}
            onClick={() => {
              closeActionsMenu();
              handleClickBenchmark();
            }}
          />
        )}
      </Menu>
    </>
  );
};

export default BulkSamplesActionsMenu;
