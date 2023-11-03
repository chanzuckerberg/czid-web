import {
  DefaultDropdownMenuOption,
  Dropdown,
  Tooltip,
} from "@czi-sds/components";
import cx from "classnames";
import { find, forEach, isEmpty, isEqual, pick, reject } from "lodash/fp";
import React from "react";
import { trackEventFromClassComponent } from "~/api/analytics";
import {
  BaseMultipleFilter,
  BaseSingleFilter,
  LocationFilter,
  TaxonFilter,
} from "~/components/common/filters";
import { FilterOption } from "~/components/common/filters/BaseMultipleFilter";
import TaxonThresholdFilter from "~/components/common/filters/TaxonThresholdFilter";
import ThresholdFilterTag from "~/components/common/ThresholdFilterTag";
import {
  ANNOTATION_FILTER_FEATURE,
  TAXON_THRESHOLD_FILTERING_FEATURE,
} from "~/components/utils/features";
import ThresholdMap from "~/components/utils/ThresholdMap";
import { WORKFLOWS, WorkflowType } from "~/components/utils/workflows";
import {
  KEY_ANNOTATIONS_SELECTED,
  KEY_TAXON_SELECTED,
  KEY_TAXON_THRESHOLDS_SELECTED,
} from "~/components/views/SampleView/utils";
import { GlobalContext } from "~/globalContext/reducer";
import { SelectedFilters } from "~/interface/discoveryView";
import { ThresholdFilterData } from "~/interface/dropdown";
import FilterTag from "~ui/controls/FilterTag";
import { ANNOTATION_FILTER_OPTIONS, TAB_SAMPLES } from "./constants";
import { DISCOVERY_DOMAIN_SNAPSHOT } from "./discovery_api";
import cs from "./discovery_filters.scss";

interface DiscoveryFiltersProps {
  allowedFeatures?: string[];
  className?: string;
  currentTab?: string;
  domain?: string;
  workflow?: string;
  // Filter options and counters
  host?: FilterOption[];
  location?: $TSFixMeUnknown[];
  locationV2?: {
    count: number;
    parents: string[];
    text: string;
    value: string;
  }[];
  time?: FilterOption[];
  tissue?: FilterOption[];
  visibility?: FilterOption[];
  // Selected values
  annotationsSelected?: DefaultDropdownMenuOption[];
  hostSelected?: number[];
  locationSelected?: string[];
  locationV2Selected?: string[];
  taxonSelected?: {
    id: number;
    level: string;
    name: string;
  }[];
  taxonThresholdsSelected?: ThresholdFilterData[];
  timeSelected?: string;
  tissueSelected?: string[];
  visibilitySelected?: string;
  onFilterChange?: (params: {
    selectedFilters: SelectedFilters;
    onFilterChangeCallback: (filteredSampleCount: number) => void;
  }) => void;
}

interface DiscoveryFiltersState {
  taxonSelected: DiscoveryFiltersProps["taxonSelected"];
  locationSelected: DiscoveryFiltersProps["locationSelected"];
  locationV2Selected?: DiscoveryFiltersProps["locationV2Selected"];
  timeSelected: DiscoveryFiltersProps["timeSelected"];
  visibilitySelected: DiscoveryFiltersProps["visibilitySelected"];
  hostSelected: DiscoveryFiltersProps["hostSelected"];
  tissueSelected: DiscoveryFiltersProps["tissueSelected"];
  taxonThresholdsSelected: DiscoveryFiltersProps["taxonThresholdsSelected"];
  annotationsSelected: DiscoveryFiltersProps["annotationsSelected"];
}

class DiscoveryFilters extends React.Component<
  DiscoveryFiltersProps,
  DiscoveryFiltersState
> {
  configForWorkflow: $TSFixMe;
  constructor(props: DiscoveryFiltersProps) {
    super(props);

    this.state = {
      // taxon is an async dropdown and needs full options (value + label) to be stored
      // (otherwise we would need to load the labels from values)
      taxonSelected: this.props.taxonSelected,
      // for the remaining filters we can store values only
      locationSelected: this.props.locationSelected,
      timeSelected: this.props.timeSelected,
      visibilitySelected: this.props.visibilitySelected,
      hostSelected: this.props.hostSelected,
      tissueSelected: this.props.tissueSelected,
      taxonThresholdsSelected: this.props.taxonThresholdsSelected,
      annotationsSelected: this.props.annotationsSelected || [],
    };

    this.setupWorkflowConfigs();
  }

  static contextType = GlobalContext;

  static getDerivedStateFromProps(props: $TSFixMe, state: $TSFixMe) {
    const newState = state;
    forEach(
      key => {
        if (!state.prev || props[key] !== state.prev[key]) {
          newState.prev = newState.prev || {};
          newState[key] = props[key];
          newState.prev[key] = props[key];
        }
      },
      [
        "hostSelected",
        "locationSelected",
        "locationV2Selected",
        KEY_ANNOTATIONS_SELECTED,
        KEY_TAXON_SELECTED,
        KEY_TAXON_THRESHOLDS_SELECTED,
        "timeSelected",
        "tissueSelected",
        "visibilitySelected",
      ],
    );

    return newState;
  }

  setupWorkflowConfigs = () => {
    this.configForWorkflow = {
      [WorkflowType.AMR]: {
        disableTaxonFilter: true,
        disableTaxonThresholdFilter: true,
        disableAnnotationFilter: true,
        tooltipTitle: WORKFLOWS[WorkflowType.AMR].pluralizedLabel,
      },
      [WorkflowType.BENCHMARK]: {
        disableTaxonFilter: true,
        disableTaxonThresholdFilter: true,
        disableAnnotationFilter: true,
        tooltipTitle: WORKFLOWS[WorkflowType.BENCHMARK].pluralizedLabel,
      },
      [WorkflowType.CONSENSUS_GENOME]: {
        disableTaxonFilter: false,
        disableTaxonThresholdFilter: true,
        disableAnnotationFilter: true,
        tooltipTitle: WORKFLOWS[WorkflowType.CONSENSUS_GENOME].pluralizedLabel,
      },
      [WorkflowType.SHORT_READ_MNGS]: {
        disableTaxonFilter: false,
        disableTaxonThresholdFilter: false,
        disableAnnotationFilter: false,
        tooltipTitle: WORKFLOWS[WorkflowType.SHORT_READ_MNGS].pluralizedLabel,
      },
      [WorkflowType.LONG_READ_MNGS]: {
        disableTaxonFilter: true,
        disableTaxonThresholdFilter: true,
        disableAnnotationFilter: true,
        tooltipTitle: WORKFLOWS[WorkflowType.LONG_READ_MNGS].label + " samples",
      },
    };
  };

  notifyFilterChangeHandler = (
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    callback: (filteredSampleCount: number) => void = null,
  ) => {
    const { onFilterChange } = this.props;
    const selectedFilters = pick(
      [
        "hostSelected",
        "locationSelected",
        "locationV2Selected",
        KEY_TAXON_SELECTED,
        KEY_TAXON_THRESHOLDS_SELECTED,
        KEY_ANNOTATIONS_SELECTED,
        "timeSelected",
        "tissueSelected",
        "visibilitySelected",
      ],
      this.state,
    );

    onFilterChange &&
      onFilterChange({ selectedFilters, onFilterChangeCallback: callback });
  };

  handleTaxonThresholdFilterChange = (taxa: $TSFixMe, thresholds: $TSFixMe) => {
    const { discoveryProjectIds } = this.context;
    const globalAnalyticsContext = {
      projectIds: discoveryProjectIds,
    };
    const taxonFilterStateUpdate = {};

    // check if selected taxa changed
    if (!isEqual(this.state[KEY_TAXON_SELECTED], taxa)) {
      taxonFilterStateUpdate[KEY_TAXON_SELECTED] = taxa;
      trackEventFromClassComponent(
        globalAnalyticsContext,
        `DiscoveryFilters_${KEY_TAXON_SELECTED.toLowerCase()}_changed`,
        {
          selectedKey: taxa,
        },
      );
    }

    // check if selected taxon thresholds were changed
    if (!isEqual(this.state[KEY_TAXON_THRESHOLDS_SELECTED], thresholds)) {
      taxonFilterStateUpdate[KEY_TAXON_THRESHOLDS_SELECTED] = thresholds;
      trackEventFromClassComponent(
        globalAnalyticsContext,
        `DiscoveryFilters_${KEY_TAXON_THRESHOLDS_SELECTED.toLowerCase()}_changed`,
        {
          selectedKey: thresholds,
        },
      );
    }

    this.setState(taxonFilterStateUpdate, this.notifyFilterChangeHandler);
  };

  handleChange(selectedKey: $TSFixMe, selected: $TSFixMe) {
    const { discoveryProjectIds } = this.context;
    const globalAnalyticsContext = {
      projectIds: discoveryProjectIds,
    };
    const newState = [];
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    newState[selectedKey] = selected;
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any[]' is not assignable to para... Remove this comment to see the full error message
    this.setState(newState, this.notifyFilterChangeHandler);
    trackEventFromClassComponent(
      globalAnalyticsContext,
      `DiscoveryFilters_${selectedKey.toLowerCase()}_changed`,
      {
        selectedKey: selected,
      },
    );
  }

  handleRemoveTag = ({ selectedKey, valueToRemove = "" }: $TSFixMe) => {
    let newSelected = null;
    const newState = {};

    if (Array.isArray(this.state[selectedKey])) {
      newSelected = this.state[selectedKey].filter(
        (option: $TSFixMe) =>
          (option.value || option.id || option.name || option) !==
          valueToRemove,
      );

      // If all taxon filters have been removed, remove the threshold filters as well
      if (selectedKey === KEY_TAXON_SELECTED && isEmpty(newSelected)) {
        newState[KEY_TAXON_THRESHOLDS_SELECTED] = [];
      }
    }
    this.handleChange(selectedKey, newSelected);
  };

  renderTags(optionsKey: $TSFixMe) {
    const selectedKey = `${optionsKey}Selected`;
    let selectedOptions = this.state[selectedKey];
    const options = this.props[optionsKey];

    if (!selectedOptions) return;
    if (!Array.isArray(selectedOptions)) selectedOptions = [selectedOptions];

    const tags = selectedOptions
      // create the filter tag
      // Depending on the filter, selected options may be formatted as a hash or a string value
      // Taxon filter options are hashes with { text: string, value: number }
      .map((option: $TSFixMe) =>
        option.text
          ? option
          : find({ value: option }, options) || {
              text: option,
              value: option,
            },
      )
      .map((option: $TSFixMe) => {
        return (
          <FilterTag
            className={cs.filterTag}
            key={option.value}
            text={option.text}
            onClose={() =>
              this.handleRemoveTag({
                selectedKey,
                valueToRemove: option.value,
              })
            }
          />
        );
      });

    return <div className={cs.tags}>{tags}</div>;
  }

  // Annotations filter options are hashes with { name: string }
  // Note: This function can be modified to render tags for any SDS Dropdown-based filter.
  renderAnnotationsFilterTags = () => {
    const selectedOptions = this.state[KEY_ANNOTATIONS_SELECTED];
    if (isEmpty(selectedOptions)) return;

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const tags = selectedOptions.map(option => {
      return (
        <FilterTag
          className={cs.filterTag}
          key={option.name}
          text={option.name}
          onClose={() =>
            this.handleRemoveTag({
              selectedKey: KEY_ANNOTATIONS_SELECTED,
              valueToRemove: option.name,
            })
          }
        />
      );
    });
    return <div className={cs.tags}>{tags}</div>;
  };

  renderTaxonFilterTags = () => {
    const selectedTaxa = this.state[KEY_TAXON_SELECTED];
    const thresholdFilterDisabled =
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
      this.configForWorkflow[this.props.workflow].disableTaxonThresholdFilter;
    if (isEmpty(selectedTaxa)) return;

    return (
      <div className={cs.tags}>
        {!thresholdFilterDisabled && (
          <div className={cs.descriptor}>Has at least one:</div>
        )}
        {selectedTaxa &&
          selectedTaxa.map((selectedTaxon: $TSFixMe) => (
            <FilterTag
              className={cs.filterTag}
              key={`taxon_filter_tag_${selectedTaxon.id}`}
              text={selectedTaxon.name}
              onClose={() =>
                this.handleRemoveTag({
                  selectedKey: KEY_TAXON_SELECTED,
                  valueToRemove: selectedTaxon.id,
                })
              }
            />
          ))}
      </div>
    );
  };

  handleRemoveThresholdFilterTag = (threshold: $TSFixMe) => {
    const filteredThresholds = reject(
      threshold,
      this.state[KEY_TAXON_THRESHOLDS_SELECTED],
    );
    const newState = { [KEY_TAXON_THRESHOLDS_SELECTED]: filteredThresholds };

    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ taxonThresholdsSelected: _.Lod... Remove this comment to see the full error message
    this.setState(newState, this.notifyFilterChangeHandler);
  };

  renderTaxonThresholdFilterTags = () => {
    const selectedThresholds = this.state[KEY_TAXON_THRESHOLDS_SELECTED];
    if (isEmpty(selectedThresholds)) return;

    return (
      <div className={cs.tags}>
        <div className={cs.descriptor}>Meets all:</div>
        {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
        {selectedThresholds.map((threshold, i) => (
          <ThresholdFilterTag
            className={cs.filterTag}
            key={`threshold_filter_tag_${i}`}
            threshold={threshold}
            onClose={() => this.handleRemoveThresholdFilterTag(threshold)}
          />
        ))}
      </div>
    );
  };

  renderAnnotationsFilter = ({ disabled, workflow }: $TSFixMe) => {
    const { annotationsSelected } = this.state;
    const annotationsFilter = (
      <Dropdown
        className={cs.styledMinimal}
        label={
          <div
            data-testid="annotation"
            className={cx(cs.filterLabel, disabled && cs.disabledFilterLabel)}
          >
            Annotation
          </div>
        }
        onChange={selectedValue => {
          // SDS Dropdown component has a bug where onChange is fired even when the value has not changed
          const selectedValueChanged =
            selectedValue !== this.state[KEY_ANNOTATIONS_SELECTED];
          if (selectedValueChanged) {
            this.handleChange(KEY_ANNOTATIONS_SELECTED, selectedValue);
          }
        }}
        value={annotationsSelected || []}
        options={ANNOTATION_FILTER_OPTIONS}
        disabled={disabled}
        multiple
      />
    );

    return disabled
      ? this.renderDisabledFilter(annotationsFilter, workflow)
      : annotationsFilter;
  };

  renderTaxonThresholdFilter = ({
    disabled,
    disableThreshold,
    workflow,
  }: $TSFixMe) => {
    const { domain } = this.props;
    const { taxonSelected, taxonThresholdsSelected } = this.state;

    const taxonThresholdFilter = (
      <TaxonThresholdFilter
        disabled={disabled}
        thresholdFilterEnabled={!disableThreshold}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        domain={domain}
        onFilterApply={(taxa: $TSFixMe, thresholds: $TSFixMe) => {
          const validThresholds = thresholds?.filter(
            ThresholdMap.isThresholdValid,
          );
          this.handleTaxonThresholdFilterChange(taxa, validThresholds);
        }}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        selectedOptions={taxonSelected}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        selectedThresholds={taxonThresholdsSelected}
      />
    );

    return disabled
      ? this.renderDisabledFilter(taxonThresholdFilter, workflow)
      : taxonThresholdFilter;
  };

  renderDisabledFilter = (filter: $TSFixMe, workflow: $TSFixMe) => {
    return (
      <Tooltip
        arrow
        placement="top-start"
        title={`Not available for ${this.configForWorkflow[workflow].tooltipTitle}.`}
        classes={{
          tooltip: cs.disabledTooltip,
        }}
      >
        <span>{filter}</span>
      </Tooltip>
    );
  };

  render() {
    const {
      hostSelected,
      locationV2Selected,
      taxonSelected,
      timeSelected,
      tissueSelected,
      visibilitySelected,
    } = this.state;

    const {
      allowedFeatures,
      className,
      currentTab,
      domain,
      host,
      locationV2,
      time,
      tissue,
      visibility,
      workflow,
    } = this.props;

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const hasTaxonThresholdFilterFeature = allowedFeatures.includes(
      TAXON_THRESHOLD_FILTERING_FEATURE,
    );

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const hasAnnotationsFilter = allowedFeatures.includes(
      ANNOTATION_FILTER_FEATURE,
    );

    // Taxon threshold and annotations filters are not available for some workflows
    const taxonFilterDisabled =
      currentTab === TAB_SAMPLES &&
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
      this.configForWorkflow[workflow].disableTaxonFilter;
    const annotationFilterDisabled =
      currentTab === TAB_SAMPLES &&
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
      this.configForWorkflow[workflow].disableAnnotationFilter;
    const disableTaxonThreshold =
      currentTab === TAB_SAMPLES &&
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
      this.configForWorkflow[workflow].disableTaxonThresholdFilter;

    return (
      <div className={cx(cs.filtersContainer, className)}>
        {/* Note: Taxon, annotations, and location filter are disabled on snapshot views */}
        {domain !== DISCOVERY_DOMAIN_SNAPSHOT && (
          <>
            <div className={cs.filterHeader}> Taxon Filters </div>
            <div
              className={cx(
                cs.filterContainer,
                hasTaxonThresholdFilterFeature &&
                  cs.taxonThresholdFilterContainer,
              )}
            >
              {hasTaxonThresholdFilterFeature ? (
                this.renderTaxonThresholdFilter({
                  disabled: taxonFilterDisabled,
                  disableThreshold: disableTaxonThreshold,
                  workflow,
                })
              ) : (
                <TaxonFilter
                  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
                  domain={domain}
                  onChange={this.handleChange.bind(this, KEY_TAXON_SELECTED)}
                  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
                  selectedOptions={taxonSelected}
                  disabled={taxonFilterDisabled}
                />
              )}
              {!taxonFilterDisabled && (
                <>
                  {!hasTaxonThresholdFilterFeature && this.renderTags("taxon")}
                  {hasTaxonThresholdFilterFeature &&
                    this.renderTaxonFilterTags()}
                  {hasTaxonThresholdFilterFeature &&
                    !disableTaxonThreshold &&
                    this.renderTaxonThresholdFilterTags()}
                </>
              )}
            </div>
            {hasAnnotationsFilter && (
              <div className={cs.filterContainer}>
                {this.renderAnnotationsFilter({
                  disabled: annotationFilterDisabled,
                  workflow,
                })}
                {!annotationFilterDisabled &&
                  this.renderAnnotationsFilterTags()}
              </div>
            )}
            {hasTaxonThresholdFilterFeature && <div className={cs.divider} />}
            <div className={cs.filterHeader}> Metadata Filters </div>
            <div className={cs.filterContainer}>
              <LocationFilter
                onChange={this.handleChange.bind(this, "locationV2Selected")}
                // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
                selected={
                  locationV2 && locationV2.length ? locationV2Selected : null
                }
                // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
                options={locationV2}
                label="Location"
              />
              {this.renderTags("locationV2")}
            </div>
          </>
        )}
        <div className={cs.filterContainer}>
          <BaseSingleFilter
            label="Timeframe"
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            options={time}
            onChange={this.handleChange.bind(this, "timeSelected")}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            value={time && !!time.length ? timeSelected : null}
          />
          {this.renderTags("time")}
        </div>
        {domain !== DISCOVERY_DOMAIN_SNAPSHOT && (
          <div className={cs.filterContainer}>
            <BaseSingleFilter
              label="Visibility"
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
              options={visibility}
              onChange={this.handleChange.bind(this, "visibilitySelected")}
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
              value={
                visibility && visibility.length ? visibilitySelected : null
              }
            />
            {this.renderTags("visibility")}
          </div>
        )}
        <div className={cs.filterContainer}>
          <BaseMultipleFilter
            onChange={this.handleChange.bind(this, "hostSelected")}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            selected={host && host.length ? hostSelected : null}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            options={host}
            label="Host"
          />
          {this.renderTags("host")}
        </div>
        <div className={cs.filterContainer}>
          <BaseMultipleFilter
            onChange={this.handleChange.bind(this, "tissueSelected")}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            selected={tissue && tissue.length ? tissueSelected : null}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            options={tissue}
            label="Sample Type"
          />
          {this.renderTags("tissue")}
        </div>
      </div>
    );
  }
}

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
DiscoveryFilters.defaultProps = {
  host: [],
  location: [],
  locationV2: [],
  time: [],
  tissue: [],
  visibility: [],
};

export default DiscoveryFilters;
