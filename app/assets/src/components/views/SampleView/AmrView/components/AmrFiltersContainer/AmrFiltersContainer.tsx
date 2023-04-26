import React, { useState } from "react";
import FilterPanel from "~/components/layout/FilterPanel";
import { FilterButtonWithCounter } from "~/components/ui/controls/buttons/FilterButtonWithCounter";
import cs from "./amr_filters_container.scss";
import { AmrFilters } from "./components/AmrFilters";

export const AmrFiltersContainer = () => {
  const [hideFilters, setHideFilters] = useState(true);
  // If filters are hidden, set the width of the FilterPanel to 65px, otherwise set it to 200px
  const drawerWidth = hideFilters ? 65 : 200;

  return (
    <FilterPanel
      // The filter panel should always be present, the only things that should be hidden are the filters themselves.
      hideFilters={false}
      content={
        <div className={cs.filtersContainer}>
          <FilterButtonWithCounter
            filterCounter={0}
            onFilterToggle={() => setHideFilters(!hideFilters)}
            showFilters={!hideFilters}
          />
          <div className={hideFilters && cs.hideFilters}>
            <AmrFilters />
          </div>
        </div>
      }
      anchorPosition="left"
      customDrawerWidth={drawerWidth}
    />
  );
};
