import { defaultTheme } from "@czi-sds/components";
import Drawer, { DrawerProps } from "@mui/material/Drawer";
import { styled } from "@mui/material/styles";
import React from "react";

interface FilterPanelPropsType {
  hideFilters: boolean;
  content: React.ReactNode;
  anchorPosition: "left" | "right";
  customHeaderHeight?: number;
  customDrawerWidth?: number;
}

/*
This filter panel uses 'sticky' positioning. This means that it will behave as if it has
`position: static` and not respect `top` / `left` / `right` / `bottom` positionings.

It will scroll along with the page content until it reaches the top of the viewport,
at which point it will "stick" / dock in place and no longer scroll.
This means it will never scroll out of view, which is really nice for
data visualizations and filters.

IMPORTANT note for this to work properly, you'll need to set a few other css stylings:
1 - no parent elements to this filter panel should have `overflow: hidden` or `overflow: auto`
2 - the shared parent of this filter panel + the main page content should have `display: flex`
3 - the main page content should have `width: 100%` and a `min-width` set
*/

// TODO - once SDS implements the new Panel component, we can use that instead of this custom Drawer
const StyledFilterPanel = styled(Drawer)<DrawerProps>(() => ({
  flexShrink: 0,
  zIndex: 2,
  position: "sticky",
  top: "0px",
  left: "0px",
  right: "0px",
  width: "fit-content",
  height: "100%",
  "& .MuiDrawer-paper": {
    height: "100%",
    position: "sticky",
    top: "0px",
    left: "0px",
    right: "0px",
    width: "fit-content",
    boxSizing: "border-box",
    padding: "14px",
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
  customDrawerWidth,
}: FilterPanelPropsType) => {
  const drawerWidth = customDrawerWidth || 240;

  return (
    <StyledFilterPanel
      anchor={anchorPosition}
      open={!hideFilters}
      variant="persistent"
    >
      <div style={{ width: drawerWidth }}>{content}</div>
    </StyledFilterPanel>
  );
};

export default FilterPanel;
