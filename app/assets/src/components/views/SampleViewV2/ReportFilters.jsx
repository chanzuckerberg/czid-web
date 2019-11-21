import React from "react";
import PropTypes from "prop-types";
import { flatten, forEach, getOr, transform, values } from "lodash/fp";

import BackgroundModelFilter from "~/components/views/report/filters/BackgroundModelFilter";
import CategoryFilter from "~/components/views/report/filters/CategoryFilter";
import MetricPicker from "~/components/views/report/filters/MetricPicker";
import MinContigSizeFilter from "~/components/views/report/filters/MinContigSizeFilter";
import NameTypeFilter from "~/components/views/report/filters/NameTypeFilter";
import SearchBox from "~ui/controls/SearchBox";
import SpecificityFilter from "~/components/views/report/filters/SpecificityFilter";
import ThresholdFilterDropdown from "~ui/controls/dropdowns/ThresholdFilterDropdown";
import { logAnalyticsEvent } from "~/api/analytics";

import { CATEGORIES, THRESHOLDS, TREE_METRICS } from "./constants";
import cs from "./report_filters.scss";

class ReportFilters extends React.Component {
  handleFilterChange = ({ key, value }) => {
    const { onFilterChange } = this.props;

    logAnalyticsEvent("SampleView_filter_changed", {
      key,
      value,
    });
    onFilterChange({ key, value });
  };

  render = () => {
    const { backgrounds, sampleId, selected, view } = this.props;

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
              sample_id: sampleId,
            }}
            onResultSelect={(_, { result }) =>
              this.handleFilterChange({
                key: "taxon",
                value: result.taxid,
              })
            }
            placeholder="Taxon name"
          />
        </div>
        <div className={cs.filterListElement}>
          <NameTypeFilter
            value={selected.nameType}
            onChange={value =>
              this.handleFilterChange({
                key: "nameType",
                value,
              })
            }
          />
        </div>
        {/* from server */}
        <div className={cs.filterListElement}>
          <BackgroundModelFilter
            allBackgrounds={backgrounds}
            value={selected.background}
            onChange={value =>
              this.handleFilterChange({
                key: "background",
                value,
              })
            }
          />
        </div>
        {/* from server */}
        <div className={cs.filterListElement}>
          <CategoryFilter
            allCategories={CATEGORIES}
            categoryParentChild={transform((result, category) => {
              if (category.children) result[category.name] = category.children;
            }, {})(CATEGORIES)}
            categoryChildParent={transform((result, category) => {
              forEach(
                subcat => (result[subcat] = category.name),
                category.children || []
              );
            }, {})(CATEGORIES)}
            selectedCategories={getOr(
              [],
              ["categories", "categories"],
              selected
            )}
            selectedSubcategories={flatten(
              values(getOr({}, ["categories", "subcategories"], selected))
            )}
            onChange={(categories, subcategories) =>
              this.handleFilterChange({
                key: "categories",
                value: {
                  categories,
                  subcategories,
                },
              })
            }
          />
        </div>
        <div className={cs.filterListElement}>
          <ThresholdFilterDropdown
            options={{
              targets: THRESHOLDS,
              operators: [">=", "<="],
            }}
            thresholds={selected.thresholds}
            onApply={value =>
              this.handleFilterChange({
                key: "thresholds",
                value,
              })
            }
          />
        </div>
        <div className={cs.filterListElement}>
          <SpecificityFilter
            value={selected.readSpecificity}
            onChange={value =>
              this.handleFilterChange({
                key: "readSpecificity",
                value,
              })
            }
          />
        </div>
        {view == "tree" && (
          <div className={cs.filterListElement}>
            <MetricPicker
              options={TREE_METRICS}
              value={selected.metric}
              onChange={value =>
                this.handleFilterChange({
                  key: "metric",
                  value,
                })
              }
            />
          </div>
        )}
        {view == "table" && (
          <div className={cs.filterListElement}>
            <MinContigSizeFilter
              value={selected.minContigSize}
              onChange={value =>
                this.handleFilterChange({
                  key: "minContigSize",
                  value,
                })
              }
            />
          </div>
        )}
      </div>
    );
  };
}

ReportFilters.propTypes = {
  backgrounds: PropTypes.array,
  onFilterChange: PropTypes.func,
  sampleId: PropTypes.number,
  selected: PropTypes.object,
  view: PropTypes.oneOf(["tree", "table"]),
};

export default ReportFilters;
