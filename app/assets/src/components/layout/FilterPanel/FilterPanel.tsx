import Drawer, { DrawerProps } from "@mui/material/Drawer";
import { styled } from "@mui/material/styles";
import { defaultTheme } from "czifui";
import React from "react";

interface FilterPanelPropsType {
  hideFilters: boolean;
  content: React.ReactNode;
  anchorPosition: "left" | "right";
  customHeaderHeight?: number;
  customDrawerWidth?: number;
}

// TODO - smb - move this component to czifui and replace this with an instance so we don't have any `styled()` components in the app
const StyledFilterPanel = styled(Drawer)<DrawerProps>(() => ({
  flexShrink: 0,
  position: "relative",
  zIndex: 2,
  "& .MuiDrawer-paper": {
    boxSizing: "border-box",
    padding: "14px", // TODO - smb - make this sds-l
  },
  "& .MuiDrawer-paperAnchorLeft": {
    borderRight: `1px solid ${defaultTheme.palette.grey[200]}`,
  },
  "& .MuiDrawer-paperAnchorRight": {
    borderLeft: `1px solid ${defaultTheme.palette.grey[200]}`,
  },
}));

export const FilterPanel = ({
  hideFilters,
  content,
  anchorPosition,
  customHeaderHeight,
  customDrawerWidth,
}: FilterPanelPropsType) => {
  const headerHeight = customHeaderHeight || 120;
  const drawerWidth = customDrawerWidth || 240;

  return (
    <StyledFilterPanel
      anchor={anchorPosition}
      open={!hideFilters}
      variant="persistent"
    >
      {/* Padding acts as a top gutter so as to not overlap header. Inline styles so we can use props. */}
      <div style={{ paddingTop: headerHeight, width: drawerWidth }}>
        {content}
      </div>
    </StyledFilterPanel>
  );
};

export default FilterPanel;
