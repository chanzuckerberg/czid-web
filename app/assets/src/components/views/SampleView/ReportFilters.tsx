import {
  filter,
  flatten,
  forEach,
  getOr,
  map,
  transform,
  values,
} from "lodash/fp";
import React, { useContext } from "react";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import ThresholdFilterTag from "~/components/common/ThresholdFilterTag";
import { UserContext } from "~/components/common/UserContext";

import { ThresholdConditions } from "~/components/utils/ThresholdMap";
import { ANNOTATION_FILTER_FEATURE } from "~/components/utils/features";
import AnnotationFilter from "~/components/views/report/filters/AnnotationFilter";
import BackgroundModelFilter from "~/components/views/report/filters/BackgroundModelFilter";
import CategoryFilter from "~/components/views/report/filters/CategoryFilter";
import MetricPicker from "~/components/views/report/filters/MetricPicker";
import NameTypeFilter from "~/components/views/report/filters/NameTypeFilter";
import SpecificityFilter from "~/components/views/report/filters/SpecificityFilter";
import { FilterSelections, SampleReportViewMode } from "~/interface/sampleView";
import { Background } from "~/interface/shared/specific";
import FilterTag from "~ui/controls/FilterTag";
import SearchBox from "~ui/controls/SearchBox";
import ThresholdFilterDropdown from "~ui/controls/dropdowns/ThresholdFilterDropdown";

import { CATEGORIES, THRESHOLDS, TREE_METRICS } from "./constants";
import cs from "./report_filters.scss";

interface ReportFiltersProps {
  backgrounds?: Background[];
  loadingReport?: boolean;
  onFilterChanged?: ({
    key,
    subpath,
    value,
  }: {
    key: string;
    subpath?: string;
    value: unknown;
  }) => void;
  onFilterRemoved?: ({
    key,
    subpath,
    value,
  }: {
    key: string;
    subpath?: string;
    value: unknown;
  }) => void;
  otherBackgrounds?: Background[];
  ownedBackgrounds?: Background[];
  sampleId?: number;
  selected?: FilterSelections;
  view?: SampleReportViewMode;
  enableMassNormalizedBackgrounds?: boolean;
  shouldDisableFilters?: boolean;
  showBackgroundFilter: boolean;
  snapshotShareId?: string;
}

const ReportFilters = ({
  backgrounds,
  loadingReport,
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
  showBackgroundFilter,
}: ReportFiltersProps) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};

  const handleFilterChange = ({
    key,
    value,
  }: {
    key: string;
    value: unknown;
  }) => {
    trackEvent("SampleView_filter_changed", {
      key,
      value,
      sampleId,
    });
    onFilterChanged({ key, value });
  };

  const handleRemoveFilter = ({
    key,
    subpath,
    value,
  }: {
    key: string;
    subpath?: string;
    value: unknown;
  }) => {
    trackEvent("SampleView_filter_removed", {
      key,
      subpath,
      value,
      sampleId,
    });
    onFilterRemoved({ key, subpath, value });
  };

  const renderFilterTag = ({
    key,
    label,
    subpath,
    value,
    idx,
  }: {
    key: string;
    label?: string;
    subpath?: string;
    value: string | object;
    idx?: string | number;
  }) => {
    label = label || (typeof value === "string" && value);
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

  const renderThresholdFilterTag = ({
    threshold,
    idx,
  }: {
    threshold: ThresholdConditions;
    idx: number;
  }) => (
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
            }),
          );
        }
        getOr([], ["categories", "subcategories", category], selected).map(
          (subcategory: string, j: number) => {
            categoryTags.push(
              renderFilterTag({
                key: "categories",
                subpath: `subcategories.${category}`,
                value: subcategory,
                idx: `${i}.${j}`,
              }),
            );
          },
        );
        return categoryTags;
      }),
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
              onResultSelect={(
                _: unknown,
                {
                  result,
                }: {
                  result: { taxid: number; level: number; title: string };
                },
              ) => {
                return handleFilterChange({
                  key: "taxa",
                  // TODO: In the future, we may want to allow users to filter by more than one taxon in the sample report page
                  value: [
                    {
                      id: result.taxid,
                      level: result.level,
                      name: result.title,
                    },
                  ],
                });
              }}
              placeholder="Taxon name"
            />
          </div>
        )}
        <div className={cs.filterListElement}>
          <NameTypeFilter
            value={selected.nameType}
            onChange={(value: unknown) =>
              handleFilterChange({
                key: "nameType",
                value,
              })
            }
            {...sharedFilterProps}
          />
        </div>
        {/* from server */}
        {showBackgroundFilter && (
          <div className={cs.filterListElement}>
            <BackgroundModelFilter
              allBackgrounds={backgrounds}
              onClick={() =>
                trackEvent(
                  ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_BACKGROUND_MODEL_FILTER_CLICKED,
                )
              }
              categorizeBackgrounds
              ownedBackgrounds={ownedBackgrounds}
              otherBackgrounds={otherBackgrounds}
              value={selected.background}
              onChange={(value: number) =>
                handleFilterChange({
                  key: "background",
                  value,
                })
              }
              enableMassNormalizedBackgrounds={enableMassNormalizedBackgrounds}
              {...sharedFilterProps}
            />
          </div>
        )}
        {/* from server */}
        <div className={cs.filterListElement}>
          <CategoryFilter
            allCategories={CATEGORIES}
            categoryParentChild={transform((result, category) => {
              // @ts-expect-error working with Lodash types
              if (category.children) {
                // @ts-expect-error working with Lodash types
                result[category.name] = category.children;
              }
            }, {})(CATEGORIES)}
            categoryChildParent={transform((result, category) => {
              forEach(
                // @ts-expect-error working with Lodash types
                subcat => (result[subcat] = category.name),
                // @ts-expect-error working with Lodash types
                category.children || [],
              );
            }, {})(CATEGORIES)}
            disableMarginRight
            selectedCategories={getOr(
              [],
              ["categories", "categories"],
              selected,
            )}
            selectedSubcategories={flatten(
              values(getOr({}, ["categories", "subcategories"], selected)),
            )}
            onChange={(categories: string[], subcategories: string[]) =>
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
            onApply={(value: ThresholdConditions) =>
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
            onChange={(value: string) =>
              handleFilterChange({
                key: "readSpecificity",
                value,
              })
            }
            {...sharedFilterProps}
          />
        </div>
        {view === "table" &&
          allowedFeatures.includes(ANNOTATION_FILTER_FEATURE) && (
            <div className={cs.filterListElement}>
              <AnnotationFilter
                selectedAnnotations={selected.annotations}
                onChange={(value: string) =>
                  handleFilterChange({
                    key: "annotations",
                    value,
                  })
                }
                {...sharedFilterProps}
              />
            </div>
          )}
        {view === "tree" && (
          <div className={cs.filterListElement}>
            <MetricPicker
              options={treeMetrics}
              value={selected.metric || treeMetrics[0].value}
              onChange={(value: string) =>
                handleFilterChange({
                  key: "metric",
                  value,
                })
              }
            />
          </div>
        )}
      </div>
      {!loadingReport && (
        <div className={cs.tagList}>
          {selected.taxa.map(taxon =>
            renderFilterTag({
              key: "taxa",
              label: taxon.name,
              value: taxon,
            }),
          )}
          {selected.thresholds.map((threshold, i) =>
            renderThresholdFilterTag({ threshold, idx: i }),
          )}
          {renderCategoryFilterTags()}
          {selected.annotations.map((annotation, i) =>
            renderFilterTag({
              key: "annotations",
              label: annotation,
              value: annotation,
              idx: i,
            }),
          )}
        </div>
      )}
    </>
  );
};

export default ReportFilters;
