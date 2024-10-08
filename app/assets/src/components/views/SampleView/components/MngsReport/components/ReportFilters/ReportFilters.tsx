import {
  filter,
  flatten,
  forEach,
  get,
  getOr,
  map,
  pull,
  set,
  transform,
  values,
} from "lodash/fp";
import React from "react";
import { ANALYTICS_EVENT_NAMES, useTrackEvent } from "~/api/analytics";
import ThresholdFilterTag from "~/components/common/ThresholdFilterTag";
import { ThresholdConditions } from "~/components/utils/ThresholdMap";
import {
  getWorkflowTypeFromLabel,
  WORKFLOW_TABS,
} from "~/components/utils/workflows";
import {
  CATEGORIES,
  DispatchSelectedOptionsType,
  KEY_SELECTED_OPTIONS_BACKGROUND,
  NONE_BACKGROUND_VALUE,
  THRESHOLDS,
  TREE_METRICS,
} from "~/components/views/SampleView/utils";
import {
  CurrentTabSample,
  FilterSelections,
  SampleReportViewMode,
} from "~/interface/sampleView";
import { Background, ProjectId, SampleId } from "~/interface/shared/specific";
import FilterTag from "~ui/controls/FilterTag";
import SearchBox from "~ui/controls/SearchBox";
import AnnotationFilter from "./components/AnnotationFilter";
import BackgroundModelFilter from "./components/BackgroundModelFilter";
import CategoryFilter from "./components/CategoryFilter";
import FlagFilter from "./components/FlagFilter";
import MetricPicker from "./components/MetricPicker";
import NameTypeFilter from "./components/NameTypeFilter";
import SpecificityFilter from "./components/SpecificityFilter";
import ThresholdFilterDropdown from "./components/ThresholdFilterDropdown/ThresholdFilterDropdown";
import cs from "./report_filters.scss";

interface ReportFiltersProps {
  backgrounds?: Background[];
  currentTab: CurrentTabSample;
  dispatchSelectedOptions: React.Dispatch<DispatchSelectedOptionsType>;
  loadingReport?: boolean;
  otherBackgrounds?: Background[];
  ownedBackgrounds?: Background[];
  sampleId?: SampleId;
  projectId?: ProjectId;
  selected: FilterSelections;
  view?: SampleReportViewMode;
  enableMassNormalizedBackgrounds?: boolean;
  showBackgroundFilter?: boolean;
  snapshotShareId?: string;
}

export const ReportFilters = ({
  backgrounds,
  currentTab,
  dispatchSelectedOptions,
  loadingReport,
  otherBackgrounds,
  ownedBackgrounds,
  sampleId,
  projectId,
  selected,
  view,
  enableMassNormalizedBackgrounds,
  snapshotShareId,
}: ReportFiltersProps) => {
  const trackEvent = useTrackEvent();
  const showBackgroundFilter = currentTab === WORKFLOW_TABS.SHORT_READ_MNGS;
  const handleFilterRemove = ({
    key,
    subpath,
    value,
  }: {
    key: string;
    subpath?: string;
    value: $TSFixMe;
  }) => {
    const newSelectedOptions = { ...selected };
    switch (key) {
      case "taxa":
      case "thresholdsShortReads":
      case "thresholdsLongReads":
      case "annotations":
        newSelectedOptions[key] = pull(value, newSelectedOptions[key]);
        break;
      case "categories":
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        newSelectedOptions.categories = set(
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
          subpath,
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
          pull(value, get(subpath, newSelectedOptions.categories)),
          newSelectedOptions.categories,
        );
        break;
      default:
        return;
    }
    dispatchSelectedOptions({ type: "clear", payload: newSelectedOptions });
  };

  const handleFilterChange = ({
    key,
    value,
  }: {
    key: string;
    value: unknown;
  }) => {
    if (
      key === KEY_SELECTED_OPTIONS_BACKGROUND &&
      value === NONE_BACKGROUND_VALUE
    ) {
      value = null;
    }

    trackEvent(ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_FILTER_CHANGED, {
      key,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
      value,
      sampleId,
    });
    trackEvent(
      ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_FILTER_CHANGED_ALLISON_TESTING,
      {
        key,
        value: JSON.stringify(value),
        sampleId,
      },
    );
    dispatchSelectedOptions({
      type: "optionChanged",
      payload: { key, value },
    });
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
    handleFilterRemove({ key, subpath, value });
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
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
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
          key:
            currentTab === WORKFLOW_TABS.SHORT_READ_MNGS
              ? "thresholdsShortReads"
              : "thresholdsLongReads",
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
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
          getOr([], ["categories", "categories"], selected).includes(category)
        ) {
          categoryTags.push(
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
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
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
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

  // Only show aggregate score metric as a selectable option if the user has a background selected.
  // The aggregate score is computed by having background model applied.
  const treeMetrics = !selected.background
    ? filter(
        metric => metric.value !== "aggregatescore",
        TREE_METRICS[getWorkflowTypeFromLabel(currentTab)],
      )
    : TREE_METRICS[getWorkflowTypeFromLabel(currentTab)];

  // Display reads OR bases metrics based on the sample's workflow
  const selectedTreeMetric =
    currentTab === WORKFLOW_TABS.SHORT_READ_MNGS
      ? selected.metricShortReads
      : selected.metricLongReads;

  const selectedThresholds =
    currentTab === WORKFLOW_TABS.SHORT_READ_MNGS
      ? selected.thresholdsShortReads
      : selected.thresholdsLongReads;

  return (
    <div className={cs.reportFilters}>
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
                projectId,
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
          />
        </div>
        {/* from server */}
        {showBackgroundFilter && (
          <div className={cs.filterListElement} data-testid="background-filter">
            <BackgroundModelFilter
              allBackgrounds={backgrounds}
              // this is broken, but alldoami found it while working on something unrelated
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              onClick={() => {}}
              categorizeBackgrounds
              ownedBackgrounds={ownedBackgrounds}
              otherBackgrounds={otherBackgrounds}
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
              value={selected.background}
              onChange={(value: number) =>
                handleFilterChange({
                  key: "background",
                  value,
                })
              }
              enableMassNormalizedBackgrounds={enableMassNormalizedBackgrounds}
            />
          </div>
        )}
        {/* from server */}
        <div className={cs.filterListElement} data-testid="category-filter">
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
          />
        </div>
        <div className={cs.filterListElement}>
          <ThresholdFilterDropdown
            options={{
              targets: THRESHOLDS[currentTab],
              operators: [">=", "<="],
            }}
            thresholds={selectedThresholds}
            onApply={(value: ThresholdConditions) =>
              handleFilterChange({
                key:
                  currentTab === WORKFLOW_TABS.SHORT_READ_MNGS
                    ? "thresholdsShortReads"
                    : "thresholdsLongReads",
                value,
              })
            }
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
          />
        </div>
        {view === "table" && (
          <div className={cs.filterListElement}>
            <AnnotationFilter
              selectedAnnotations={selected.annotations}
              onChange={(value: string) =>
                handleFilterChange({
                  key: "annotations",
                  value,
                })
              }
            />
          </div>
        )}
        {view === "table" && (
          <div className={cs.filterListElement}>
            <FlagFilter
              selectedFlags={selected.flags}
              onChange={(value: string) =>
                handleFilterChange({
                  key: "flags",
                  value,
                })
              }
            />
          </div>
        )}
        {view === "tree" && (
          <div className={cs.filterListElement}>
            <MetricPicker
              options={treeMetrics}
              value={selectedTreeMetric || treeMetrics[0].value}
              onChange={(value: string) =>
                handleFilterChange({
                  key:
                    currentTab === WORKFLOW_TABS.SHORT_READ_MNGS
                      ? "metricShortReads"
                      : "metricLongReads",
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
          {selectedThresholds.map((threshold, i) =>
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
    </div>
  );
};
