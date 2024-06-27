import { Icon, Tooltip } from "@czi-sds/components";
import React from "react";
import ThresholdFilterSDS from "~/components/common/filters/ThresholdFilterSDS";
import { MenuOptionWithDisabledTooltip } from "~/components/common/MenuOptionWithDisabledTooltip";
import { Divider } from "~/components/layout";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import Link from "~/components/ui/controls/Link";
import { BACKGROUND_MODELS_LINK } from "~/components/utils/documentationLinks";
import { SelectedOptions, Subcategories } from "~/interface/shared";
import { RawBackground } from "../../SamplesHeatmapView";
import { metricIsZscore } from "../../utils";
import SamplesHeatmapBackgroundDropdown from "./components/SamplesHeatmapBackgroundDropdown";
import SamplesHeatmapCategoryDropdown from "./components/SamplesHeatmapCategoryDropdown";
import SamplesHeatmapPresetTooltip from "./components/SamplesHeatmapPresetTooltip";
import SamplesHeatmapTaxonSlider from "./components/SamplesHeatmapTaxonSlider";
import SamplesHeatmapTaxonTagCheckbox from "./components/SamplesHeatmapTaxonTagCheckbox";
import SamplesHeatmapViewOptionsDropdown from "./components/SamplesHeatmapViewOptionsDropdown";
import { optionsToSDSFormat } from "./samplesHeatmapFilterUtils";
import cs from "./samples_heatmap_filters.scss";

export interface SDSFormattedOption {
  name: string;
  text?: string;
  value?: number | string;
  subtext?: string;
  details?: string;
  disabled?: boolean;
}

export interface TextValueString {
  text?: string;
  value: string;
}

export interface TextValueNumber {
  text?: string;
  value?: number;
}

export interface OptionsType {
  metrics?: TextValueString[];
  categories?: string[];
  subcategories?: Subcategories | Record<string, never>;
  backgrounds?: RawBackground[];
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
  const onTaxonLevelChange = (taxonLevel: SDSFormattedOption) => {
    const value = taxonLevel.value;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    if (selectedOptions.species === value) {
      return;
    }

    onSelectedOptionsChange({ species: value });
  };

  const renderTaxonLevelSelect = () => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const isPreset = selectedOptions.presets.includes("species");
    const disabled = loading || !data || isPreset;

    const taxonLevelSelect = (
      <SamplesHeatmapViewOptionsDropdown
        disabled={disabled}
        label="Taxon Level"
        onChange={onTaxonLevelChange}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
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
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    if (value === selectedOptions.metric) {
      return;
    }

    onSelectedOptionsChange({ metric: value });
  };

  const renderMetricSelect = () => {
    const newOptions = options?.metrics?.map((metric: TextValueString) => {
      return {
        ...metric,
        disabled: !selectedOptions?.background && metricIsZscore(metric.value),
      };
    });

    return (
      <SamplesHeatmapViewOptionsDropdown
        disabled={loading || !data}
        label="Metric"
        onChange={onMetricChange}
        options={optionsToSDSFormat(newOptions || [])}
        selectedOptions={selectedOptions}
        selectedOptionsKey="metric"
        renderOption={function Option(
          optionProps: any,
          option: SDSFormattedOption,
        ) {
          return (
            <MenuOptionWithDisabledTooltip
              option={option}
              optionProps={optionProps}
              tooltipDisplay={
                <>
                  To see the Z Score, first choose a background model above.{" "}
                  <ExternalLink href={BACKGROUND_MODELS_LINK}>
                    Learn more.
                  </ExternalLink>
                </>
              }
            />
          );
        }}
      />
    );
  };

  const onBackgroundChange = (background: number) => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    if (background === selectedOptions.background) {
      return;
    }

    onSelectedOptionsChange({ background });
  };

  const renderBackgroundSelect = () => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const isPreset = selectedOptions.presets.includes("background");
    const disabled = loading || !data || isPreset;

    const backgroundSelect = (
      <SamplesHeatmapBackgroundDropdown
        allBackgrounds={options?.backgrounds}
        disabled={disabled}
        enableMassNormalizedBackgrounds={enableMassNormalizedBackgrounds}
        onChange={onBackgroundChange}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
  };

  const renderThresholdFilterSelect = () => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const isPreset = selectedOptions.presets.includes("thresholdFilters");
    const filterDisabled = loading || !data || isPreset;

    const newOptions = options?.thresholdFilters?.targets?.map(
      (metric: TextValueString) => {
        const disabled =
          !selectedOptions?.background && metricIsZscore(metric.value);
        return {
          ...metric,
          disabled: disabled,
        };
      },
    );

    const thresholdSelect = (
      <>
        <ThresholdFilterSDS
          disabled={filterDisabled}
          metricOptions={newOptions || []}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      selectedOptions.presets.includes("categories") ||
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      selectedOptions.presets.includes("subcategories");

    const disabled = loading || !data || isPreset;

    const categorySelect = (
      <SamplesHeatmapCategoryDropdown
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        selectedOptions={selectedOptions}
        disabled={disabled}
        onSelectedOptionsChange={onSelectedOptionsChange}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
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
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    if (value === selectedOptions.readSpecificity) {
      return;
    }

    onSelectedOptionsChange({ readSpecificity: value });
  };

  const renderSpecificityFilter = () => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const isPreset = selectedOptions.presets.includes("readSpecificity");
    const disabled = loading || !data || isPreset;

    const readSpecificitySelect = (
      <SamplesHeatmapViewOptionsDropdown
        disabled={disabled}
        label="Read Specificity"
        onChange={onSpecificityChange}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
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
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    if (value === selectedOptions.sampleSortType) {
      return;
    }

    onSelectedOptionsChange({ sampleSortType: value });
  };

  const renderSortSamplesSelect = () => {
    return (
      <SamplesHeatmapViewOptionsDropdown
        disabled={loading || !data}
        label="Sort Samples"
        onChange={onSortSamplesChange}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        options={optionsToSDSFormat(options.sampleSortTypeOptions)}
        selectedOptions={selectedOptions}
        selectedOptionsKey="sampleSortType"
      />
    );
  };

  const onSortTaxaChange = (selectedSortType: SDSFormattedOption) => {
    const value = selectedSortType.value;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    if (value === selectedOptions.taxaSortType) {
      return;
    }

    onSelectedOptionsChange({ taxaSortType: value });
  };

  const renderSortTaxaSelect = () => {
    return (
      <SamplesHeatmapViewOptionsDropdown
        disabled={loading || !data}
        label="Sort Taxa"
        onChange={onSortTaxaChange}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        options={optionsToSDSFormat(options.taxaSortTypeOptions)}
        selectedOptions={selectedOptions}
        selectedOptionsKey="taxaSortType"
      />
    );
  };

  const onDataScaleChange = (scaleIdx: SDSFormattedOption) => {
    const value = scaleIdx.value;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    if (value === selectedOptions.dataScaleIdx) {
      return;
    }

    onSelectedOptionsChange({ dataScaleIdx: value });
  };

  const renderScaleSelect = () => {
    const formatScaleOptions = (option: [string, string], idx: number) => {
      return { name: option[0], value: idx };
    };
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          options[value].name
        }
      />
    );
  };

  const onTaxonsPerSampleEnd = (newValue: $TSFixMe) => {
    onSelectedOptionsChange({ taxonsPerSample: newValue });
  };

  const renderTaxonsPerSampleSlider = () => {
    return (
      <SamplesHeatmapTaxonSlider
        isDisabled={loading || !data}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        max={options.taxonsPerSample.max}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        min={options.taxonsPerSample.min}
        onChangeCommitted={onTaxonsPerSampleEnd}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        value={selectedOptions.taxonsPerSample}
      />
    );
  };

  return (
    <div className={cs.panelContentsContainer}>
      <div className={cs.topFilterSection}>
        <div className={cs.sectionTitle}>
          Filters
          <Tooltip
            title={"Affects the underlying data that is shown in the heatmap."}
            placement="top-start"
            arrow
          >
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
          </Tooltip>
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
        <div className={cs.taxonTagsContainer}>
          <span className={cs.filterTitle}>Pathogen Tag</span>
          <SamplesHeatmapTaxonTagCheckbox
            label={"Known Pathogens Only"}
            value={"known_pathogens"}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            selectedOptions={selectedOptions}
            onSelectedOptionsChange={onSelectedOptionsChange}
            showInfoIcon={true}
            infoIconTooltipContent={
              <span>
                Organisms with known human pathogenicity based on{" "}
                <Link external href="/pathogen_list">
                  CZ ID&#39;s current pathogen list.
                </Link>{" "}
                <br />
                <br />
                Please cross-reference the literature to verify tagged
                pathogens.
              </span>
            }
            disabled={loading || !data}
          />
        </div>
      </div>
      <Divider />
      <div className={cs.lowerFilterSection}>
        <div className={cs.sectionTitle}>
          View Options
          <Tooltip
            title={"Affects how data is presented in the heatmap."}
            placement="top-start"
            arrow
          >
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
          </Tooltip>
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
