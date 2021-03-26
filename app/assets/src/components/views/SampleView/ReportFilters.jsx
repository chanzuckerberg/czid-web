import React from "react";
import PropTypes from "prop-types";
import { flatten, forEach, getOr, map, transform, values } from "lodash/fp";

import BackgroundModelFilter from "~/components/views/report/filters/BackgroundModelFilter";
import CategoryFilter from "~/components/views/report/filters/CategoryFilter";
import MetricPicker from "~/components/views/report/filters/MetricPicker";
import NameTypeFilter from "~/components/views/report/filters/NameTypeFilter";
import SearchBox from "~ui/controls/SearchBox";
import SpecificityFilter from "~/components/views/report/filters/SpecificityFilter";
import ThresholdFilterDropdown from "~ui/controls/dropdowns/ThresholdFilterDropdown";
import { logAnalyticsEvent } from "~/api/analytics";
import ThresholdFilterTag from "~/components/common/ThresholdFilterTag";
import FilterTag from "~ui/controls/FilterTag";

import { CATEGORIES, THRESHOLDS, TREE_METRICS } from "./constants";
import cs from "./report_filters.scss";

class ReportFilters extends React.Component {
  handleFilterChange = ({ key, value }) => {
    const { onFilterChanged } = this.props;

    logAnalyticsEvent("SampleView_filter_changed", {
      key,
      value,
    });
    onFilterChanged({ key, value });
  };

  handleRemoveFilter = ({ key, subpath, value }) => {
    const { onFilterRemoved } = this.props;
    logAnalyticsEvent("SampleView_filter_removed", {
      key,
      subpath,
      value,
    });
    onFilterRemoved({ key, subpath, value });
  };

  renderFilterTag = ({ key, label, subpath, value, idx }) => {
    label = label || value;
    return (
      <FilterTag
        className={cs.filterTag}
        key={`${label}_filter_tag_${idx}`}
        text={label}
        onClose={() =>
          this.handleRemoveFilter({
            key,
            subpath,
            value,
          })
        }
      />
    );
  };

  renderThresholdFilterTag = ({ threshold, idx }) => {
    return (
      <ThresholdFilterTag
        className={cs.filterTag}
        key={`threshold_filter_tag_${idx}`}
        threshold={threshold}
        onClose={() =>
          this.handleRemoveFilter({
            key: "thresholds",
            value: threshold,
          })
        }
      />
    );
  };

  renderCategoryFilterTags = () => {
    const { selected } = this.props;
    return flatten(
      map("name", CATEGORIES).map((category, i) => {
        const categoryTags = [];
        if (
          getOr([], ["categories", "categories"], selected).includes(category)
        ) {
          categoryTags.push(
            this.renderFilterTag({
              key: "categories",
              subpath: "categories",
              value: category,
              idx: i,
            })
          );
        }
        getOr([], ["categories", "subcategories", category], selected).map(
          (subcategory, j) => {
            categoryTags.push(
              this.renderFilterTag({
                key: "categories",
                subpath: `subcategories.${category}`,
                value: subcategory,
                idx: `${i}.${j}`,
              })
            );
          }
        );
        return categoryTags;
      })
    );
  };

  render = () => {
    const {
      backgrounds,
      enableMassNormalizedBackgrounds,
      sampleId,
      selected,
      selectedInvalidBackground,
      shouldDisableFilters,
      snapshotShareId,
      view,
    } = this.props;

    const sharedFilterProps = { disabled: shouldDisableFilters };

    return (
      <React.Fragment>
        <div className={cs.filterList}>
          {/* TODO(ihan): expose the Taxon search box */}
          {!snapshotShareId && (
            <div className={cs.filterListElement}>
              <SearchBox
                clearOnSelect
                rounded
                levelLabel
                serverSearchAction="choose_taxon"
                serverSearchActionArgs={{
                  // TODO (gdingle): change backend to support filter by sampleId
                  args: "species,genus",
                  sample_id: sampleId,
                }}
                onResultSelect={(_, { result }) => {
                  return this.handleFilterChange({
                    key: "taxon",
                    value: {
                      taxId: result.taxid,
                      taxLevel: result.level,
                      name: result.title,
                    },
                  });
                }}
                placeholder="Taxon name"
              />
            </div>
          )}
          <div className={cs.filterListElement}>
            <NameTypeFilter
              value={selected.nameType}
              onChange={value =>
                this.handleFilterChange({
                  key: "nameType",
                  value,
                })
              }
              {...sharedFilterProps}
            />
          </div>
          {/* from server */}
          <div className={cs.filterListElement}>
            <BackgroundModelFilter
              allBackgrounds={backgrounds}
              erred={selectedInvalidBackground}
              value={selected.background}
              onChange={value =>
                this.handleFilterChange({
                  key: "background",
                  value,
                })
              }
              enableMassNormalizedBackgrounds={enableMassNormalizedBackgrounds}
              {...sharedFilterProps}
            />
          </div>
          {/* from server */}
          <div className={cs.filterListElement}>
            <CategoryFilter
              allCategories={CATEGORIES}
              categoryParentChild={transform((result, category) => {
                if (category.children) {
                  result[category.name] = category.children;
                }
              }, {})(CATEGORIES)}
              categoryChildParent={transform((result, category) => {
                forEach(
                  subcat => (result[subcat] = category.name),
                  category.children || []
                );
              }, {})(CATEGORIES)}
              disableMarginRight
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
              {...sharedFilterProps}
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
              {...sharedFilterProps}
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
              {...sharedFilterProps}
            />
          </div>
          {view === "tree" && (
            <div className={cs.filterListElement}>
              <MetricPicker
                options={TREE_METRICS}
                value={selected.metric || TREE_METRICS[0].value}
                onChange={value =>
                  this.handleFilterChange({
                    key: "metric",
                    value,
                  })
                }
              />
            </div>
          )}
        </div>
        <div className={cs.tagList}>
          {selected.taxon &&
            this.renderFilterTag({
              key: "taxon",
              label: selected.taxon.name,
              value: selected.taxon,
            })}
          {selected.thresholds.map((threshold, i) =>
            this.renderThresholdFilterTag({ threshold, idx: i })
          )}
          {this.renderCategoryFilterTags()}
        </div>
      </React.Fragment>
    );
  };
}

ReportFilters.propTypes = {
  backgrounds: PropTypes.array,
  onFilterChanged: PropTypes.func,
  onFilterRemoved: PropTypes.func,
  sampleId: PropTypes.number,
  selected: PropTypes.object,
  view: PropTypes.oneOf(["tree", "table"]),
  enableMassNormalizedBackgrounds: PropTypes.bool,
  selectedInvalidBackground: PropTypes.bool,
  snapshotShareId: PropTypes.string,
};

export default ReportFilters;
