import { Icon } from "czifui";
import {
  pull,
  isEqual,
  min,
  max,
  flatten,
  values,
  omitBy,
  mapValues,
  isEmpty,
} from "lodash/fp";
import React, { useContext } from "react";

import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import ThresholdFilterTag from "~/components/common/ThresholdFilterTag";
import { UserContext } from "~/components/common/UserContext";
import { Divider } from "~/components/layout";
import List from "~/components/ui/List";
import { HEATMAP_ELASTICSEARCH_FEATURE } from "~/components/utils/features";
import BackgroundModelFilter from "~/components/views/report/filters/BackgroundModelFilter";
import SequentialLegendVis from "~/components/visualizations/legends/SequentialLegendVis";
import { SelectedOptions, Subcategories } from "~/interface/shared";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import {
  Dropdown,
  MultipleNestedConfirmDropdown,
  MultipleNestedDropdown,
  ThresholdFilterDropdown,
} from "~ui/controls/dropdowns";
import FilterTag from "~ui/controls/FilterTag";
import Slider from "~ui/controls/Slider";

import cs from "./samples_heatmap_view.scss";

interface TextValueString {
  text?: string;
  value?: string;
}

interface TextValueNumber {
  text?: string;
  value?: number;
}

export interface SamplesHeatmapControlsProps {
  options?: {
    metrics?: TextValueString[];
    categories?: string[];
    subcategories?: Subcategories | Record<string, never>;
    backgrounds?: {
      name?: string;
      value?: number;
    }[];
    taxonLevels?: TextValueNumber[];
    specificityOptions?: TextValueNumber[];
    sampleSortTypeOptions?: TextValueString[];
    taxaSortTypeOptions?: TextValueString[];
    sortTaxaOptions?: TextValueNumber[];
    thresholdFilters?: {
      operators?: string[];
      targets?: TextValueString[];
    };
    scales?: string[][];
    taxonsPerSample?: Record<string, number>;
  };
  selectedOptions?: SelectedOptions;
  onSelectedOptionsChange: $TSFixMeFunction;
  loading?: boolean;
  data?: Record<string, number[][]>;
  filteredTaxaCount?: number;
  totalTaxaCount?: number;
  prefilterConstants?: { topN: $TSFixMe; minReads: $TSFixMe };
  enableMassNormalizedBackgrounds?: boolean;
}

const SamplesHeatmapControls = ({
  data,
  enableMassNormalizedBackgrounds,
  loading,
  options,
  selectedOptions,
  onSelectedOptionsChange,
  filteredTaxaCount,
  totalTaxaCount,
  prefilterConstants,
}: SamplesHeatmapControlsProps) => {
  const { allowedFeatures = [] } = useContext(UserContext) || {};
  const useHeatmapES = allowedFeatures.includes(HEATMAP_ELASTICSEARCH_FEATURE);

  const renderPresetTooltip = ({
    component,
    className,
    key,
  }: {
    component: $TSFixMe;
    className?: string;
    key?: string;
  }) => {
    return (
      <ColumnHeaderTooltip
        key={key}
        // need include a span for the tooltip to appear on hover
        trigger={<span className={className}>{component}</span>}
        content={`Presets cannot be modified. Click "New Presets" to adjust this filter.`}
      />
    );
  };

  const onTaxonLevelChange = (taxonLevel: $TSFixMe) => {
    if (selectedOptions.species === taxonLevel) {
      return;
    }

    onSelectedOptionsChange({ species: taxonLevel });
    trackEvent("SamplesHeatmapControls_taxon-level-select_changed", {
      taxonLevel,
    });
  };

  const renderTaxonLevelSelect = () => {
    const isPreset = selectedOptions.presets.includes("species");
    const disabled = loading || !data || isPreset;

    const taxonLevelSelect = (
      <Dropdown
        fluid
        rounded
        options={options.taxonLevels}
        value={selectedOptions.species}
        onChange={onTaxonLevelChange}
        label="Taxon Level"
        disabled={disabled}
      />
    );

    if (isPreset) {
      return renderPresetTooltip({ component: taxonLevelSelect });
    } else {
      return taxonLevelSelect;
    }
  };

  const onCategoryChange = (categories: $TSFixMe, subcategories: $TSFixMe) => {
    onSelectedOptionsChange({ categories, subcategories });
    trackEvent("SamplesHeatmapControls_category-filter_changed", {
      categories: categories.length,
      subcategories: subcategories.length,
    });
  };

  const renderCategoryFilter = () => {
    const isPreset =
      selectedOptions.presets.includes("categories") ||
      selectedOptions.presets.includes("subcategories");
    const disabled = loading || !data || isPreset;

    const categoryOptions = options.categories.map(category => {
      const option: {
        text: string;
        value: string;
        suboptions?: { text: string; value: string }[];
      } = { text: category, value: category };
      const subcategories = options.subcategories[category];
      if (Array.isArray(subcategories)) {
        option.suboptions = subcategories.map((subcategory: string) => {
          return { text: subcategory, value: subcategory };
        });
      }
      return option;
    });

    const categorySelect =
      // add apply/cancel buttons to the dropdown to allow users to select multiple categories before
      useHeatmapES ? (
        <MultipleNestedConfirmDropdown
          boxed
          fluid
          rounded
          options={categoryOptions}
          onChange={onCategoryChange}
          selectedOptions={selectedOptions.categories}
          selectedSuboptions={selectedOptions.subcategories}
          label="Categories"
          disabled={disabled}
          disableMarginRight
        />
      ) : (
        <MultipleNestedDropdown
          boxed
          fluid
          rounded
          options={categoryOptions}
          onChange={onCategoryChange}
          selectedOptions={selectedOptions.categories}
          selectedSuboptions={selectedOptions.subcategories}
          label="Categories"
          disabled={disabled}
          disableMarginRight
        />
      );

    if (isPreset) {
      return renderPresetTooltip({ component: categorySelect });
    } else {
      return categorySelect;
    }
  };

  const onMetricChange = (metric: $TSFixMe) => {
    if (metric === selectedOptions.metric) {
      return;
    }

    onSelectedOptionsChange({ metric });
    trackEvent("SamplesHeatmapControls_metric-select_changed", {
      metric,
    });
  };

  const renderMetricSelect = () => {
    return (
      <Dropdown
        fluid
        rounded
        options={options.metrics}
        onChange={onMetricChange}
        value={selectedOptions.metric}
        label="Metric"
        disabled={loading || !data}
      />
    );
  };

  const onBackgroundChange = (background: $TSFixMe) => {
    if (background === selectedOptions.background) {
      return;
    }

    onSelectedOptionsChange({ background });
    trackEvent("SamplesHeatmapControls_background-select_changed", {
      background,
    });
  };

  const renderBackgroundSelect = () => {
    const isPreset = selectedOptions.presets.includes("background");
    const disabled = loading || !data || isPreset;

    const backgroundSelect = (
      <BackgroundModelFilter
        // @ts-expect-error Property 'allBackgrounds' does not exist on type
        allBackgrounds={options.backgrounds}
        disabled={disabled}
        enableMassNormalizedBackgrounds={enableMassNormalizedBackgrounds}
        onChange={onBackgroundChange}
        onClick={() =>
          trackEvent(
            ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_CONTROLS_BACKGROUND_MODEL_FILTER_CLICKED,
          )
        }
        value={selectedOptions.background}
      />
    );

    if (isPreset) {
      return renderPresetTooltip({ component: backgroundSelect });
    } else {
      return backgroundSelect;
    }
  };

  const onThresholdFilterApply = (filters: $TSFixMe) => {
    if (isEqual(filters, selectedOptions.thresholdFilters)) {
      return;
    }

    onSelectedOptionsChange({ thresholdFilters: filters });
    trackEvent("SamplesHeatmapControls_threshold-filter-select_applied", {
      filters: filters.length,
    });
  };

  const renderThresholdFilterSelect = () => {
    const isPreset = selectedOptions.presets.includes("thresholdFilters");
    const disabled = loading || !data || isPreset;

    const thresholdSelect = (
      <ThresholdFilterDropdown
        options={options.thresholdFilters}
        thresholds={selectedOptions.thresholdFilters}
        onApply={onThresholdFilterApply}
        disabled={disabled}
        disableMarginRight
      />
    );

    if (isPreset) {
      return renderPresetTooltip({ component: thresholdSelect });
    } else {
      return thresholdSelect;
    }
  };

  const onSpecificityChange = (specificity: $TSFixMe) => {
    if (specificity === selectedOptions.readSpecificity) {
      return;
    }

    onSelectedOptionsChange({ readSpecificity: specificity });
    trackEvent("SamplesHeatmapControls_specificity-filter_changed", {
      readSpecificity: specificity,
    });
  };

  const renderSpecificityFilter = () => {
    const isPreset = selectedOptions.presets.includes("readSpecificity");
    const disabled = loading || !data || isPreset;

    const readSpecificitySelect = (
      <Dropdown
        fluid
        rounded
        options={options.specificityOptions}
        value={selectedOptions.readSpecificity}
        label="Read Specificity"
        onChange={onSpecificityChange}
        disabled={disabled}
      />
    );

    if (isPreset) {
      return renderPresetTooltip({ component: readSpecificitySelect });
    } else {
      return readSpecificitySelect;
    }
  };

  const onSortSamplesChange = (selectedSortType: $TSFixMe) => {
    if (selectedSortType === selectedOptions.sampleSortType) {
      return;
    }

    onSelectedOptionsChange({ sampleSortType: selectedSortType });
    trackEvent("SamplesHeatmapControls_sort-samples-select_changed", {
      sampleSortType: selectedSortType,
    });
  };

  const renderSortSamplesSelect = () => {
    return (
      <Dropdown
        fluid
        rounded
        options={options.sampleSortTypeOptions}
        value={selectedOptions.sampleSortType}
        label="Sort Samples"
        onChange={onSortSamplesChange}
        disabled={loading || !data}
      />
    );
  };

  const onSortTaxaChange = (selectedSortType: $TSFixMe) => {
    if (selectedSortType === selectedOptions.taxaSortType) {
      return;
    }

    onSelectedOptionsChange({ taxaSortType: selectedSortType });
    trackEvent("SamplesHeatmapControls_sort-taxa-select_changed", {
      taxaSortType: selectedSortType,
    });
  };

  const renderSortTaxaSelect = () => {
    return (
      <Dropdown
        fluid
        rounded
        options={options.taxaSortTypeOptions}
        value={selectedOptions.taxaSortType}
        label="Sort Taxa"
        onChange={onSortTaxaChange}
        disabled={loading || !data}
      />
    );
  };

  const onDataScaleChange = (scaleIdx: $TSFixMe) => {
    if (scaleIdx === selectedOptions.dataScaleIdx) {
      return;
    }

    onSelectedOptionsChange({ dataScaleIdx: scaleIdx });
    trackEvent("SamplesHeatmapControls_data-scale-select_changed", {
      dataScaleIdx: scaleIdx,
    });
  };

  const renderScaleSelect = () => {
    const formattedOptions = options.scales.map((scale, index) => ({
      text: scale[0],
      value: index,
    }));

    return (
      <Dropdown
        fluid
        rounded
        value={selectedOptions.dataScaleIdx}
        onChange={onDataScaleChange}
        options={formattedOptions}
        label="Scale"
        disabled={loading || !data}
      />
    );
  };

  const onTaxonsPerSampleEnd = (newValue: $TSFixMe) => {
    onSelectedOptionsChange({ taxonsPerSample: newValue });
    trackEvent("SamplesHeatmapControls_taxons-per-sample-slider_changed", {
      taxonsPerSample: newValue,
    });
  };

  const renderTaxonsPerSampleSlider = () => {
    return (
      <Slider
        disabled={loading || !data}
        label="Taxa per Sample: "
        max={options.taxonsPerSample.max}
        min={options.taxonsPerSample.min}
        onAfterChange={onTaxonsPerSampleEnd}
        value={selectedOptions.taxonsPerSample}
      />
    );
  };

  const renderLegend = () => {
    if (loading || !data || !(data[selectedOptions.metric] || []).length) {
      return;
    }
    const values = data[selectedOptions.metric];
    const scaleIndex = selectedOptions.dataScaleIdx;
    return (
      <SequentialLegendVis
        min={Math.max(0, min(values.map(array => min(array))))}
        max={max(values.map(array => max(array)))}
        scale={options.scales[scaleIndex][1]}
      />
    );
  };

  const handleRemoveThresholdFilter = (threshold: $TSFixMe) => {
    const newFilters = pull(threshold, selectedOptions.thresholdFilters);
    onSelectedOptionsChange({ thresholdFilters: newFilters });
  };

  const handleRemoveCategory = (category: $TSFixMe) => {
    const newCategories = pull(category, selectedOptions.categories);
    onSelectedOptionsChange({ categories: newCategories });
  };

  const handleRemoveSubcategory = (subcat: $TSFixMe) => {
    // For each category => [subcategories], remove subcat from subcategories.
    // Then omit all categories with empty subcategories.
    const newSubcategories = omitBy(
      isEmpty,
      mapValues(pull(subcat), selectedOptions.subcategories),
    );
    onSelectedOptionsChange({ subcategories: newSubcategories });
  };

  const renderFilterTags = () => {
    let filterTags: $TSFixMe = [];
    const { presets } = selectedOptions;

    if (selectedOptions.thresholdFilters) {
      filterTags = filterTags.concat(
        selectedOptions.thresholdFilters.map((threshold, i) => {
          if (presets.includes("thresholdFilters")) {
            return renderPresetTooltip({
              // @ts-expect-errors Type '{ threshold: ThresholdConditions; }' is missing the following properties from type
              component: <ThresholdFilterTag threshold={threshold} />,
              className: `${cs.filterTag}`,
              key: `threshold_filter_tag_${i}`,
            });
          } else {
            return (
              <ThresholdFilterTag
                className={cs.filterTag}
                disabled={loading || !data}
                key={`threshold_filter_tag_${i}`}
                threshold={threshold}
                onClose={() => {
                  handleRemoveThresholdFilter(threshold);
                  trackEvent(
                    "SamplesHeatmapControls_threshold-filter_removed",
                    {
                      value: threshold.value,
                      operator: threshold.operator,
                      metric: threshold.metric,
                    },
                  );
                }}
              />
            );
          }
        }),
      );
    }

    if (selectedOptions.categories) {
      filterTags = filterTags.concat(
        selectedOptions.categories.map((category, i) => {
          if (presets.includes("categories")) {
            return renderPresetTooltip({
              component: <FilterTag text={category} />,
              className: cs.filterTag,
              key: `category_filter_tag_${i}`,
            });
          } else {
            return (
              <FilterTag
                className={cs.filterTag}
                key={`category_filter_tag_${i}`}
                text={category}
                disabled={loading || !data}
                onClose={() => {
                  handleRemoveCategory(category);
                  trackEvent(
                    "SamplesHeatmapControl_categories-filter_removed",
                    {
                      category,
                    },
                  );
                }}
              />
            );
          }
        }),
      );
    }

    if (selectedOptions.subcategories) {
      const subcategoryList = flatten(values(selectedOptions.subcategories));
      filterTags = filterTags.concat(
        subcategoryList.map((subcat, i) => {
          if (presets.includes("subcategories")) {
            return renderPresetTooltip({
              component: <FilterTag text={subcat} />,
              className: cs.filterTag,
              key: `subcat_filter_tag_${i}`,
            });
          } else {
            return (
              <FilterTag
                className={cs.filterTag}
                key={`subcat_filter_tag_${i}`}
                text={subcat}
                disabled={loading || !data}
                onClose={() => {
                  handleRemoveSubcategory(subcat);
                  trackEvent(
                    "SamplesHeatmapControl_categories-filter_removed",
                    {
                      subcat,
                    },
                  );
                }}
              />
            );
          }
        }),
      );
    }

    return filterTags;
  };

  const renderFilterStatsInfo = () => {
    const { topN, minReads } = prefilterConstants;

    const content = (
      <React.Fragment>
        In order to load the heatmap faster, the data included in this heatmap
        was preselected based on the following conditions:
        <List
          listClassName={cs.conditionList}
          listItems={[
            `The top ${topN} unique taxa per sample, based on relative abundance (rPM)`,
            `Only taxa with at least ${minReads} reads`,
          ]}
        />
        You can add taxa under 5 reads using the “Add taxa” button below.
      </React.Fragment>
    );

    return (
      <span className={cs.reportInfoMsg}>
        Showing top {filteredTaxaCount} taxa of {totalTaxaCount} preselected
        taxa.
        <ColumnHeaderTooltip
          trigger={
            <span>
              <Icon
                sdsIcon="infoCircle"
                sdsSize="s"
                sdsType="interactive"
                className={cs.infoIcon}
              />
            </span>
          }
          content={content}
        />
      </span>
    );
  };

  const { thresholdFilters, categories, subcategories } = selectedOptions;
  // Only display the filter tag row if relevant filters are selected,
  // otherwise an empty row will be rendered.
  const displayFilterTags =
    ((thresholdFilters || []).length ||
      (categories || []).length ||
      (subcategories["Viruses"] || []).length) > 0;

  return (
    <div className={cs.menu}>
      <Divider />
      <div className={cs.filterRow}>
        <div className={cs.filterControl}>{renderTaxonLevelSelect()}</div>
        <div className={cs.filterControl}>{renderCategoryFilter()}</div>
        <div className={cs.filterControl}>{renderSortTaxaSelect()}</div>
        <div className={cs.filterControl}>{renderSortSamplesSelect()}</div>
        <div className={cs.filterControl}>{renderMetricSelect()}</div>
        <div className={cs.filterControl}>{renderBackgroundSelect()}</div>
      </div>
      <div className={cs.filterRow}>
        <div className={cs.filterControl}>{renderThresholdFilterSelect()}</div>
        <div className={cs.filterControl}>{renderSpecificityFilter()}</div>
        <div className={cs.filterControl}>{renderScaleSelect()}</div>
        <div className={cs.filterControl}>{renderTaxonsPerSampleSlider()}</div>
        <div className={cs.filterControl}>{renderLegend()}</div>
      </div>
      {displayFilterTags && (
        <div className={cs.filterTagsList}>{renderFilterTags()}</div>
      )}
      {!loading && !useHeatmapES && (
        <div className={cs.statsRow}>{renderFilterStatsInfo()}</div>
      )}
      <Divider />
    </div>
  );
};

export default SamplesHeatmapControls;
