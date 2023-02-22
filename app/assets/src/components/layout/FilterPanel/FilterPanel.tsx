import Drawer, { DrawerProps } from "@mui/material/Drawer";
import { styled } from "@mui/material/styles";
import { defaultTheme } from "czifui";
import React from "react";

interface FilterPanelPropsType {
  hideFilters: boolean;
  content: React.ReactNode;
  customHeaderHeight?: number;
}

// TODO - smb - move this component to czifui and replace this with an instance so we don't have any `styled()` components in the app
const StyledFilterPanel = styled(Drawer)<DrawerProps>(() => ({
  flexShrink: 0,
  position: "relative",
  zIndex: 2,
  "& .MuiDrawer-paper": {
    minWidth: "240px",
    boxSizing: "border-box",
    padding: "14px", // TODO - smb - make this sds-l
  },
  borderRight: `2px solid ${defaultTheme.palette.grey[300]}`,
}));

export const FilterPanel = ({
  hideFilters,
  content,
  customHeaderHeight,
}: FilterPanelPropsType) => {
  const headerHeight = customHeaderHeight || 120;

  return (
    <StyledFilterPanel anchor="left" open={!hideFilters} variant="persistent">
      {/* Top gutter so as to not overlap header. Inline styles so we can use props. */}
      <div style={{ height: headerHeight }} />
      {content}
    </StyledFilterPanel>
  );
};

export default FilterPanel;
