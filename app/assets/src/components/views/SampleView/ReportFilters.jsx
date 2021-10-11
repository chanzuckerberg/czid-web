import {
  filter,
  flatten,
  forEach,
  getOr,
  map,
  transform,
  values,
} from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";

import { ANALYTICS_EVENT_NAMES, logAnalyticsEvent } from "~/api/analytics";
import ThresholdFilterTag from "~/components/common/ThresholdFilterTag";
import BackgroundModelFilter from "~/components/views/report/filters/BackgroundModelFilter";
import CategoryFilter from "~/components/views/report/filters/CategoryFilter";
import MetricPicker from "~/components/views/report/filters/MetricPicker";
import NameTypeFilter from "~/components/views/report/filters/NameTypeFilter";
import SpecificityFilter from "~/components/views/report/filters/SpecificityFilter";
import FilterTag from "~ui/controls/FilterTag";
import SearchBox from "~ui/controls/SearchBox";
import ThresholdFilterDropdown from "~ui/controls/dropdowns/ThresholdFilterDropdown";

import { CATEGORIES, THRESHOLDS, TREE_METRICS } from "./constants";
import cs from "./report_filters.scss";

const ReportFilters = ({
  backgrounds,
  onFilterChanged,
  onFilterRemoved,
  otherBackgrounds,
  ownedBackgrounds,
  sampleId,
  selected,
  view,
  enableMassNormalizedBackgrounds,
  shouldDisableFilters,
  snapshotShareId,
}) => {
  const handleFilterChange = ({ key, value }) => {
    logAnalyticsEvent("SampleView_filter_changed", {
      key,
      value,
    });
    onFilterChanged({ key, value });
  };

  const handleRemoveFilter = ({ key, subpath, value }) => {
    logAnalyticsEvent("SampleView_filter_removed", {
      key,
      subpath,
      value,
    });
    onFilterRemoved({ key, subpath, value });
  };

  const renderFilterTag = ({ key, label, subpath, value, idx }) => {
    label = label || value;
    return (
      <FilterTag
        className={cs.filterTag}
        key={`${label}_filter_tag_${idx}`}
        text={label}
        onClose={() =>
          handleRemoveFilter({
            key,
            subpath,
            value,
          })
        }
      />
    );
  };

  const renderThresholdFilterTag = ({ threshold, idx }) => (
    <ThresholdFilterTag
      className={cs.filterTag}
      key={`threshold_filter_tag_${idx}`}
      threshold={threshold}
      onClose={() =>
        handleRemoveFilter({
          key: "thresholds",
          value: threshold,
        })
      }
    />
  );

  const renderCategoryFilterTags = () => {
    return flatten(
      map("name", CATEGORIES).map((category, i) => {
        const categoryTags = [];
        if (
          getOr([], ["categories", "categories"], selected).includes(category)
        ) {
          categoryTags.push(
            renderFilterTag({
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
              renderFilterTag({
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

  const sharedFilterProps = { disabled: shouldDisableFilters };
  // Only show aggregate score metric as a selectable option if the user has a background selected.
  // The aggregate score is computed by having background model applied.
  const treeMetrics = !selected.background
    ? filter(metric => metric.value !== "aggregatescore", TREE_METRICS)
    : TREE_METRICS;

  return (
    <>
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
                sampleId,
              }}
              onResultSelect={(_, { result }) => {
                return handleFilterChange({
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
              handleFilterChange({
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
            onClick={() =>
              logAnalyticsEvent(
                ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_BACKGROUND_MODEL_FILTER_CLICKED
              )
            }
            categorizeBackgrounds
            ownedBackgrounds={ownedBackgrounds}
            otherBackgrounds={otherBackgrounds}
            value={selected.background}
            onChange={value =>
              handleFilterChange({
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
              handleFilterChange({
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
              handleFilterChange({
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
              handleFilterChange({
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
              options={treeMetrics}
              value={selected.metric || treeMetrics[0].value}
              onChange={value =>
                handleFilterChange({
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
          renderFilterTag({
            key: "taxon",
            label: selected.taxon.name,
            value: selected.taxon,
          })}
        {selected.thresholds.map((threshold, i) =>
          renderThresholdFilterTag({ threshold, idx: i })
        )}
        {renderCategoryFilterTags()}
      </div>
    </>
  );
};

ReportFilters.propTypes = {
  backgrounds: PropTypes.array,
  onFilterChanged: PropTypes.func,
  onFilterRemoved: PropTypes.func,
  otherBackgrounds: PropTypes.array,
  ownedBackgrounds: PropTypes.array,
  sampleId: PropTypes.number,
  selected: PropTypes.object,
  view: PropTypes.oneOf(["tree", "table"]),
  enableMassNormalizedBackgrounds: PropTypes.bool,
  shouldDisableFilters: PropTypes.bool,
  snapshotShareId: PropTypes.string,
};

export default ReportFilters;
