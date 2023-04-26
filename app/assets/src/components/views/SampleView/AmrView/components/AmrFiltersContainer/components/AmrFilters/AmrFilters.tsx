import React from "react";
import ThresholdFilterSDS from "~/components/common/filters/ThresholdFilterSDS";
import cs from "./amr_filters.scss";
// import { DrugClassFilter } from "./DrugClassFilter";

export const AmrFilters = () => {
  return (
    <div className={cs.filters}>
      <h1 className={cs.sectionTitle}>Filters</h1>
      <ThresholdFilterSDS
        selectedThresholds={[]}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line
        onApply={console.error("onApply not implemented yet")}
        disabled={false}
        metricOptions={[
          { text: "# of Contigs", value: "contigs" },
          { text: "Contig Coverage Breadth", value: "contigCoverageBreadth" },
          { text: "# of Reads", value: "reads" },
          { text: "Read Coverage Breadth", value: "readCoverageBreadth" },
          { text: "Read Coverage Depth", value: "readCoverageDepth" },
        ]}
      />
      {/*
        <DrugClassFilter
          drugClassOptions={[
            these options should populate with the drug classes in the sample
          ]}
          onDrugClassChange={val => console.log(val)}
          disabled={false}
        />
      */}
    </div>
  );
};
