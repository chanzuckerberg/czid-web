import { Icon } from "czifui";
import React, { useContext } from "react";
import { Popup } from "semantic-ui-react";
import { trackEvent } from "~/api/analytics";
import ThresholdFilterSDS from "~/components/common/filters/ThresholdFilterSDS";
import { UserContext } from "~/components/common/UserContext";
import { Divider } from "~/components/layout";
import Link from "~/components/ui/controls/Link";
import { HEATMAP_PATHOGEN_FLAGGING_FEATURE } from "~/components/utils/features";
import { SelectedOptions, Subcategories } from "~/interface/shared";
import SamplesHeatmapBackgroundDropdown from "./components/SamplesHeatmapBackgroundDropdown";
import SamplesHeatmapCategoryDropdown from "./components/SamplesHeatmapCategoryDropdown";
import SamplesHeatmapPresetTooltip from "./components/SamplesHeatmapPresetTooltip";
import SamplesHeatmapTaxonSlider from "./components/SamplesHeatmapTaxonSlider";
import SamplesHeatmapTaxonTagCheckbox from "./components/SamplesHeatmapTaxonTagCheckbox";
import SamplesHeatmapViewOptionsDropdown from "./components/SamplesHeatmapViewOptionsDropdown";
import cs from "./samples_heatmap_filters.scss";
import { optionsToSDSFormat } from "./samplesHeatmapFilterUtils";

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
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};

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
      return <SamplesHeatmapPresetTooltip component={taxonLevelSelect} />;
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
      return <SamplesHeatmapPresetTooltip component={backgroundSelect} />;
    } else {
      return backgroundSelect;
    }
  };

  const onThresholdFilterApply = (thresholdFilters: $TSFixMe) => {
    onSelectedOptionsChange({ thresholdFilters });
    trackEvent("SamplesHeatmapControls_threshold-filter-select_applied", {
      filters: thresholdFilters.length,
    });
  };

  const renderThresholdFilterSelect = () => {
    const isPreset = selectedOptions.presets.includes("thresholdFilters");
    const disabled = loading || !data || isPreset;

    const thresholdSelect = (
      <>
        <ThresholdFilterSDS
          isDisabled={disabled}
          // @ts-expect-error Type 'TextValueString' is not assignable to type 'MetricOption'. Property 'text' is optional in type 'TextValueString' but required in type 'MetricOption'.ts(2322)
          metricOptions={options.thresholdFilters.targets}
          selectedThresholds={selectedOptions["thresholdFilters"]}
          onApply={onThresholdFilterApply}
        />
      </>
    );

    if (isPreset) {
      return <SamplesHeatmapPresetTooltip component={thresholdSelect} />;
    } else {
      return thresholdSelect;
    }
  };

  const renderCategoryFilter = () => {
    const isPreset =
      selectedOptions.presets.includes("categories") ||
      selectedOptions.presets.includes("subcategories");

    const disabled = loading || !data || isPreset;

    const categorySelect = (
      <SamplesHeatmapCategoryDropdown
        selectedOptions={selectedOptions}
        disabled={disabled}
        onSelectedOptionsChange={onSelectedOptionsChange}
        options={options}
      />
    );

    if (isPreset) {
      return <SamplesHeatmapPresetTooltip component={categorySelect} />;
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
      return <SamplesHeatmapPresetTooltip component={readSpecificitySelect} />;
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
      <SamplesHeatmapTaxonSlider
        isDisabled={loading || !data}
        max={options.taxonsPerSample.max}
        min={options.taxonsPerSample.min}
        onChangeCommitted={onTaxonsPerSampleEnd}
        value={selectedOptions.taxonsPerSample}
      />
    );
  };

  return (
    <div className={cs.panelContentsContainer}>
      <div className={cs.topFilterSection}>
        <div className={cs.sectionTitle}>
          Filters
          <Popup
            content={
              "Affects the underlying data that is shown in the heatmap."
            }
            position="top right"
            trigger={
              <span>
                <Icon
                  sdsIcon="infoCircle"
                  sdsSize="xs"
                  sdsType="static"
                  color="gray"
                  shade={500}
                  className={cs.infoIcon}
                />
              </span>
            }
          />
        </div>
        <div className={cs.categoryDropdownContainer}>
          {renderCategoryFilter()}
        </div>

        <div className={cs.thresholdDropdownContainer}>
          {renderThresholdFilterSelect()}
        </div>
        {/* Contents stay the same; no new component */}
        <div className={cs.backgroundDropdownContainer}>
          {renderBackgroundSelect()}
        </div>
        <div className={cs.taxonSliderContainer}>
          {renderTaxonsPerSampleSlider()}
        </div>
        <div className={cs.viewOptionsDropdownContainer}>
          {renderSpecificityFilter()}
        </div>
        {allowedFeatures.includes(HEATMAP_PATHOGEN_FLAGGING_FEATURE) && (
          <div className={cs.taxonTagsContainer}>
            <span className={cs.filterTitle}>Pathogen Tags</span>
            <SamplesHeatmapTaxonTagCheckbox
              label={"Known Pathogens"}
              value={"known_pathogens"}
              selectedOptions={selectedOptions}
              onSelectedOptionsChange={onSelectedOptionsChange}
              showInfoIcon={true}
              infoIconTooltipContent={
                <span>
                  Organism with known human pathogenicity. See the{" "}
                  <Link external href="https://czid.org/pathogen_list">
                    full list
                  </Link>{" "}
                  of pathogens.
                </span>
              }
              disabled={loading || !data}
            />
          </div>
        )}
      </div>
      <Divider />
      <div className={cs.lowerFilterSection}>
        <div className={cs.sectionTitle}>
          View Options
          <Popup
            content={"Affects how data is presented in the heatmap."}
            position="top right"
            trigger={
              <span>
                <Icon
                  sdsIcon="infoCircle"
                  sdsSize="xs"
                  sdsType="static"
                  color="gray"
                  shade={500}
                  className={cs.infoIcon}
                />
              </span>
            }
          />
        </div>
        <div className={cs.viewOptionsDropdownContainer}>
          {renderTaxonLevelSelect()}
        </div>
        <div className={cs.viewOptionsDropdownContainer}>
          {renderMetricSelect()}
        </div>
        <div className={cs.viewOptionsDropdownContainer}>
          {renderSortSamplesSelect()}
        </div>
        <div className={cs.viewOptionsDropdownContainer}>
          {renderSortTaxaSelect()}
        </div>
        <div className={cs.viewOptionsDropdownContainer}>
          {renderScaleSelect()}
        </div>
      </div>
    </div>
  );
};

export { SamplesHeatmapFilters };
