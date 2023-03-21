import { isEqual } from "lodash/fp";
import React from "react";

import { trackEvent } from "~/api/analytics";
// import ThresholdFilterTag from "~/components/common/ThresholdFilterTag";
import { Divider } from "~/components/layout";
import { SelectedOptions, Subcategories } from "~/interface/shared";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
// import FilterTag from "~ui/controls/FilterTag";
import Slider from "~ui/controls/Slider";

import PopoverMinimalButton from "../../../../ui/controls/PopoverMinimalButton";
import SamplesHeatmapBackgroundDropdown from "./SamplesHeatmapBackgroundDropdown";
import SamplesHeatmapCategoryDropdown from "./SamplesHeatmapCategoryDropdown/";
import SamplesHeatmapThresholdDropdown from "./SamplesHeatmapThresholdDropdown";
import SamplesHeatmapViewOptionsDropdown from "./SamplesHeatmapViewOptionsDropdown";
import { optionsToSDSFormat } from "./samplesHeatmapFilterHelpers";
import cs from "./samples_heatmap_filters.scss";

export interface SDSFormattedOption {
  name: string;
  text?: string;
  value?: number | string;
}

export interface TextValueString {
  text?: string;
  value?: string;
}

export interface TextValueNumber {
  text?: string;
  value?: number;
}

export interface OptionsType {
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
}

export interface SamplesHeatmapFiltersPropsType {
  options?: OptionsType;
  selectedOptions?: SelectedOptions;
  onSelectedOptionsChange: $TSFixMeFunction;
  loading?: boolean;
  data?: Record<string, number[][]>;
  filteredTaxaCount?: number;
  totalTaxaCount?: number;
  prefilterConstants?: { topN: $TSFixMe; minReads: $TSFixMe };
  enableMassNormalizedBackgrounds?: boolean;
}

const SamplesHeatmapFilters = ({
  data,
  enableMassNormalizedBackgrounds,
  loading,
  options,
  selectedOptions,
  onSelectedOptionsChange,
}: SamplesHeatmapFiltersPropsType) => {
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

  const onTaxonLevelChange = (taxonLevel: SDSFormattedOption) => {
    const value = taxonLevel.value;
    if (selectedOptions.species === value) {
      return;
    }

    onSelectedOptionsChange({ species: value });
    trackEvent("SamplesHeatmapControls_taxon-level-select_changed", {
      value,
    });
  };

  const renderTaxonLevelSelect = () => {
    const isPreset = selectedOptions.presets.includes("species");
    const disabled = loading || !data || isPreset;

    const taxonLevelSelect = (
      <SamplesHeatmapViewOptionsDropdown
        disabled={disabled}
        label="Taxon Level"
        onChange={onTaxonLevelChange}
        options={optionsToSDSFormat(options.taxonLevels)}
        selectedOptions={selectedOptions}
        selectedOptionsKey="species"
      />
    );

    if (isPreset) {
      return renderPresetTooltip({ component: taxonLevelSelect });
    } else {
      return taxonLevelSelect;
    }
  };

  const onMetricChange = (metric: SDSFormattedOption) => {
    const value = metric.value;
    if (value === selectedOptions.metric) {
      return;
    }

    onSelectedOptionsChange({ metric: value });
    trackEvent("SamplesHeatmapControls_metric-select_changed", {
      value,
    });
  };

  const renderMetricSelect = () => {
    return (
      <SamplesHeatmapViewOptionsDropdown
        disabled={loading || !data}
        label="Metric"
        onChange={onMetricChange}
        options={optionsToSDSFormat(options.metrics)}
        selectedOptions={selectedOptions}
        selectedOptionsKey="metric"
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
      <SamplesHeatmapBackgroundDropdown
        allBackgrounds={options.backgrounds}
        disabled={disabled}
        enableMassNormalizedBackgrounds={enableMassNormalizedBackgrounds}
        onChange={onBackgroundChange}
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
      <SamplesHeatmapThresholdDropdown
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

  const renderCategoryFilter = () => {
    const isPreset =
      selectedOptions.presets.includes("categories") ||
      selectedOptions.presets.includes("subcategories");

    const categorySelect = (
      <SamplesHeatmapCategoryDropdown
        selectedOptions={selectedOptions}
        disabled={isPreset || !data}
        onSelectedOptionsChange={onSelectedOptionsChange}
        options={options}
      />
    );

    if (isPreset) {
      return renderPresetTooltip({ component: categorySelect });
    } else {
      return categorySelect;
    }
  };

  const onSpecificityChange = (specificity: SDSFormattedOption) => {
    const value = specificity.value;
    if (value === selectedOptions.readSpecificity) {
      return;
    }

    onSelectedOptionsChange({ readSpecificity: value });
    trackEvent("SamplesHeatmapControls_specificity-filter_changed", {
      readSpecificity: value,
    });
  };

  const renderSpecificityFilter = () => {
    const isPreset = selectedOptions.presets.includes("readSpecificity");
    const disabled = loading || !data || isPreset;

    const readSpecificitySelect = (
      <SamplesHeatmapViewOptionsDropdown
        disabled={disabled}
        label="Read Specificity"
        onChange={onSpecificityChange}
        options={optionsToSDSFormat(options.specificityOptions)}
        selectedOptions={selectedOptions}
        selectedOptionsKey="readSpecificity"
      />
    );

    if (isPreset) {
      return renderPresetTooltip({ component: readSpecificitySelect });
    } else {
      return readSpecificitySelect;
    }
  };

  const onSortSamplesChange = (selectedSortType: SDSFormattedOption) => {
    const value = selectedSortType.value;
    if (value === selectedOptions.sampleSortType) {
      return;
    }

    onSelectedOptionsChange({ sampleSortType: value });
    trackEvent("SamplesHeatmapControls_sort-samples-select_changed", {
      sampleSortType: value,
    });
  };

  const renderSortSamplesSelect = () => {
    return (
      <SamplesHeatmapViewOptionsDropdown
        disabled={loading || !data}
        label="Sort Samples"
        onChange={onSortSamplesChange}
        options={optionsToSDSFormat(options.sampleSortTypeOptions)}
        selectedOptions={selectedOptions}
        selectedOptionsKey="sampleSortType"
      />
    );
  };

  const onSortTaxaChange = (selectedSortType: SDSFormattedOption) => {
    const value = selectedSortType.value;
    if (value === selectedOptions.taxaSortType) {
      return;
    }

    onSelectedOptionsChange({ taxaSortType: value });
    trackEvent("SamplesHeatmapControls_sort-taxa-select_changed", {
      taxaSortType: value,
    });
  };

  const renderSortTaxaSelect = () => {
    return (
      <SamplesHeatmapViewOptionsDropdown
        disabled={loading || !data}
        label="Sort Taxa"
        onChange={onSortTaxaChange}
        options={optionsToSDSFormat(options.taxaSortTypeOptions)}
        selectedOptions={selectedOptions}
        selectedOptionsKey="taxaSortType"
      />
    );
  };

  const onDataScaleChange = (scaleIdx: SDSFormattedOption) => {
    const value = scaleIdx.value;
    if (value === selectedOptions.dataScaleIdx) {
      return;
    }

    onSelectedOptionsChange({ dataScaleIdx: value });
    trackEvent("SamplesHeatmapControls_data-scale-select_changed", {
      dataScaleIdx: value,
    });
  };

  const renderScaleSelect = () => {
    const formatScaleOptions = (option: [string, string], idx: number) => {
      return { name: option[0], value: idx };
    };
    const scaleOptions = options.scales.map(formatScaleOptions);

    return (
      <SamplesHeatmapViewOptionsDropdown
        disabled={loading || !data}
        label="Scale"
        onChange={onDataScaleChange}
        options={scaleOptions}
        selectedOptions={selectedOptions}
        selectedOptionsKey="dataScaleIdx"
        customValueToNameFunction={(value: number, options) =>
          options[value].name
        }
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
      <PopoverMinimalButton
        disabled={loading || !data}
        label="Taxa per Sample"
        details={selectedOptions.taxonsPerSample.toString()}
        content={
          <div className={cs.taxaPerSampleSlider}>
            <Slider
              disabled={loading || !data}
              max={options.taxonsPerSample.max}
              min={options.taxonsPerSample.min}
              onAfterChange={onTaxonsPerSampleEnd}
              value={selectedOptions.taxonsPerSample}
            />
          </div>
        }
      />
    );
  };

  // TODO - smb: will add tags back in in the next PR

  // const renderFilterTags = () => {
  //   let filterTags: $TSFixMe = [];
  //   const { presets } = selectedOptions;

  //   if (selectedOptions.thresholdFilters) {
  //     filterTags = filterTags.concat(
  //       selectedOptions.thresholdFilters.map((threshold, i) => {
  //         if (presets.includes("thresholdFilters")) {
  //           return renderPresetTooltip({
  //             // @ts-expect-errors Type '{ threshold: ThresholdConditions; }' is missing the following properties from type
  //             component: <ThresholdFilterTag threshold={threshold} />,
  //             className: `${cs.filterTag}`,
  //             key: `threshold_filter_tag_${i}`,
  //           });
  //         } else {
  //           return (
  //             <ThresholdFilterTag
  //               className={cs.filterTag}
  //               disabled={loading || !data}
  //               key={`threshold_filter_tag_${i}`}
  //               threshold={threshold}
  //               onClose={() => {
  //                 handleRemoveThresholdFilter(threshold);
  //                 trackEvent(
  //                   "SamplesHeatmapControls_threshold-filter_removed",
  //                   {
  //                     value: threshold.value,
  //                     operator: threshold.operator,
  //                     metric: threshold.metric,
  //                   },
  //                 );
  //               }}
  //             />
  //           );
  //         }
  //       }),
  //     );
  //   }

  //   if (selectedOptions.categories) {
  //     filterTags = filterTags.concat(
  //       selectedOptions.categories.map((category, i) => {
  //         if (presets.includes("categories")) {
  //           return renderPresetTooltip({
  //             component: <FilterTag text={category} />,
  //             className: cs.filterTag,
  //             key: `category_filter_tag_${i}`,
  //           });
  //         } else {
  //           return (
  //             <FilterTag
  //               className={cs.filterTag}
  //               key={`category_filter_tag_${i}`}
  //               text={category}
  //               disabled={loading || !data}
  //               onClose={() => {
  //                 handleRemoveCategory(category);
  //                 trackEvent(
  //                   "SamplesHeatmapControl_categories-filter_removed",
  //                   {
  //                     category,
  //                   },
  //                 );
  //               }}
  //             />
  //           );
  //         }
  //       }),
  //     );
  //   }

  //   if (selectedOptions.subcategories) {
  //     const subcategoryList = flatten(values(selectedOptions.subcategories));
  //     filterTags = filterTags.concat(
  //       subcategoryList.map((subcat, i) => {
  //         if (presets.includes("subcategories")) {
  //           return renderPresetTooltip({
  //             component: <FilterTag text={subcat} />,
  //             className: cs.filterTag,
  //             key: `subcat_filter_tag_${i}`,
  //           });
  //         } else {
  //           return (
  //             <FilterTag
  //               className={cs.filterTag}
  //               key={`subcat_filter_tag_${i}`}
  //               text={subcat}
  //               disabled={loading || !data}
  //               onClose={() => {
  //                 handleRemoveSubcategory(subcat);
  //                 trackEvent(
  //                   "SamplesHeatmapControl_categories-filter_removed",
  //                   {
  //                     subcat,
  //                   },
  //                 );
  //               }}
  //             />
  //           );
  //         }
  //       }),
  //     );
  //   }

  //   return filterTags;
  // };

  return (
    <div className={cs.panelContentsContainer}>
      <div className={cs.topFilterSection}>
        <span className={cs.sectionTitle}>Filters</span>
        <div className={cs.filterControl}>{renderCategoryFilter()}</div>

        <div className={cs.filterControl}>{renderThresholdFilterSelect()}</div>
        {/* Contents stay the same; no new component */}
        <div className={cs.filterControl}>{renderBackgroundSelect()}</div>
        <div className={cs.filterControl}>{renderTaxonsPerSampleSlider()}</div>
      </div>
      <Divider />
      <div className={cs.lowerFilterSection}>
        <span className={cs.sectionTitle}>View Options</span>
        <div className={cs.filterControl}>{renderTaxonLevelSelect()}</div>
        <div className={cs.filterControl}>{renderMetricSelect()}</div>
        <div className={cs.filterControl}>{renderSortSamplesSelect()}</div>
        <div className={cs.filterControl}>{renderSortTaxaSelect()}</div>
        <div className={cs.filterControl}>{renderScaleSelect()}</div>
        <div className={cs.filterControl}>{renderSpecificityFilter()}</div>
      </div>
    </div>
  );
};

export { SamplesHeatmapFilters };
