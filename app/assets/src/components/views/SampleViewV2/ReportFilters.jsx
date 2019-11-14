import React from "react";

import BackgroundModelFilter from "~/components/views/report/filters/BackgroundModelFilter";
import CategoryFilter from "~/components/views/report/filters/CategoryFilter";
import MetricPicker from "~/components/views/report/filters/MetricPicker";
import MinContigSizeFilter from "~/components/views/report/filters/MinContigSizeFilter";
import NameTypeFilter from "~/components/views/report/filters/NameTypeFilter";
import SearchBox from "~ui/controls/SearchBox";
import SpecificityFilter from "~/components/views/report/filters/SpecificityFilter";
import ThresholdFilterDropdown from "~ui/controls/dropdowns/ThresholdFilterDropdown";
import { logAnalyticsEvent } from "~/api/analytics";
import { getBackgrounds } from "~/api";

import cs from "./report_filters.scss";

class ReportFilters extends React.Component {
  constructor(props) {
    super(props);

    this.allThresholds = [
      { text: "Score", value: "NT_aggregatescore" },
      { text: "NT Z Score", value: "NT_zscore" },
      { text: "NT rPM", value: "NT_rpm" },
      { text: "NT r (total reads)", value: "NT_r" },
      { text: "NT contigs", value: "NT_contigs" },
      { text: "NT contig reads", value: "NT_contigreads" },
      { text: "NT %id", value: "NT_percentidentity" },
      { text: "NT L (alignment length in bp)", value: "NT_alignmentlength" },
      { text: "NT log(1/e)", value: "NT_neglogevalue" },
      { text: "NR Z Score", value: "NR_zscore" },
      { text: "NR rPM", value: "NR_rpm" },
      { text: "NR r (total reads)", value: "NR_r" },
      { text: "NR contigs", value: "NR_contigs" },
      { text: "NR contig reads", value: "NR_contigreads" },
      { text: "NR %id", value: "NR_percentidentity" },
      { text: "NR L (alignment length in bp)", value: "NR_alignmentlength" },
      { text: "NR log(1/e)", value: "NR_neglogevalue" },
    ];

    this.treeMetrics = [
      { text: "Aggregate Score", value: "aggregatescore" },
      { text: "NT r (total reads)", value: "nt_r" },
      { text: "NT rPM", value: "nt_rpm" },
      { text: "NR r (total reads)", value: "nr_r" },
      { text: "NR rPM", value: "nr_rpm" },
    ];
  }

  componendDidMount = () => {
    this.fetchOptions();
  };

  fetchOptions = async () => {
    const [backgrounds, categories] = await Promise.all([
      getBackgrounds(),
      getCategories(),
    ]);
  };

  handleFilterChange = ({ key, value }) => {
    // TODO(tiago): save to local storage
    localStorage.setItem(key, value);
    logAnalyticsEvent("SampleView_filter_changed", {
      key,
      value,
    });
    this.onFilterChange({ key, value });
  };

  render = () => {
    return (
      <div className={cs.filterList}>
        <div className={cs.filterListElement}>
          <SearchBox
            rounded
            levelLabel
            serverSearchAction="choose_taxon"
            serverSearchActionArgs={{
              // TODO (gdingle): change backend to support filter by sampleId
              args: "species,genus",
              project_id: parent.projectId,
            }}
            onResultSelect={parent.searchSelectedTaxon}
            placeholder="Taxon name"
          />
        </div>
        <div className={cs.filterListElement}>
          <NameTypeFilter
            value={parent.props.nameType}
            onChange={parent.handleNameTypeChange}
          />
        </div>
        {/* from server */}
        <div className={cs.filterListElement}>
          <BackgroundModelFilter
            allBackgrounds={parent.all_backgrounds}
            value={parent.state.backgroundData.id}
            onChange={parent.handleBackgroundModelChange}
          />
        </div>
        {/* from server */}
        <div className={cs.filterListElement}>
          <CategoryFilter
            parent={parent}
            allCategories={parent.all_categories}
            categoryParentChild={parent.categoryParentChild}
            categoryChildParent={parent.categoryChildParent}
            selectedCategories={parent.state.includedCategories}
            selectedSubcategories={parent.state.includedSubcategories}
            onChange={parent.handleIncludedCategoriesChange}
          />
        </div>
        <div className={cs.filterListElement}>
          <ThresholdFilterDropdown
            options={{
              targets: parent.allThresholds,
              operators: [">=", "<="],
            }}
            thresholds={parent.state.activeThresholds}
            onApply={parent.handleThresholdFiltersChange}
          />
        </div>
        <div className={cs.filterListElement}>
          <SpecificityFilter
            value={parent.state.readSpecificity}
            onChange={parent.handleSpecificityChange}
          />
        </div>
        {this.props.view == "tree" && (
          <div className={cs.filterListElement}>
            <MetricPicker
              options={parent.treeMetrics}
              value={parent.state.treeMetric}
              onChange={parent.handleTreeMetricChange}
            />
          </div>
        )}
        {this.props.view == "table" && (
          <div className={cs.filterListElement}>
            <MinContigSizeFilter
              value={parent.state.minContigSize}
              onChange={parent.handleMinContigSizeChange}
            />
          </div>
        )}
      </div>
    );
  };
}

export default ReportFilters;
