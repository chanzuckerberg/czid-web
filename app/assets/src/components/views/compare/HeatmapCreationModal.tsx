import { isEqual, isNull, size, startCase } from "lodash/fp";
import React from "react";
import { getBackgrounds, getMassNormalizedBackgroundAvailability } from "~/api";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import SecondaryButton from "~/components/ui/controls/buttons/SecondaryButton";
import {
  SPECIES_SELECTION_OPTIONS,
  SPECIFICITY_OPTIONS,
  THRESHOLDS,
} from "~/components/views/compare/SamplesHeatmapView/constants";
import BackgroundModelFilter from "~/components/views/report/filters/BackgroundModelFilter";
import { CATEGORIES } from "~/components/views/SampleView/utils";
import { getURLParamString } from "~/helpers/url";
import Modal from "~ui/containers/Modal";
import { Dropdown, MultipleNestedDropdown } from "~ui/controls/dropdowns";
import { openUrl, openUrlInNewTab } from "~utils/links";
import ThresholdFilterDropdown from "../report/filters/ThresholdFilterDropdown/ThresholdFilterDropdown";
import cs from "./heatmap_creation_modal.scss";

interface HeatmapCreationModalProps {
  continueInNewTab?: boolean;
  onClose: $TSFixMeFunction;
  open?: boolean;
  selectedIds?: Set<$TSFixMe> | $TSFixMe[];
}

interface HeatmapCreationModalState {
  backgroundOptions: $TSFixMe[];
  enableMassNormalizedBackgrounds: boolean;
  selectedBackground: number;
  selectedCategories: $TSFixMe[];
  selectedSpecificity: $TSFixMe;
  selectedSubcategories: object;
  selectedTaxonLevel: $TSFixMe;
  selectedThresholdFilters: $TSFixMe[];
}

export default class HeatmapCreationModal extends React.Component<
  HeatmapCreationModalProps,
  HeatmapCreationModalState
> {
  constructor(props: HeatmapCreationModalProps) {
    super(props);

    this.state = {
      backgroundOptions: [],
      enableMassNormalizedBackgrounds: false,
      selectedBackground: 26, // default background id
      selectedCategories: [],
      selectedSpecificity: null,
      selectedSubcategories: {},
      selectedTaxonLevel: null,
      selectedThresholdFilters: [],
    };
  }

  componentDidMount() {
    this.fetchBackgrounds();
    this.fetchBackgroundAvailability();
  }

  componentDidUpdate(prevProps: HeatmapCreationModalProps) {
    if (prevProps.selectedIds !== this.props.selectedIds) {
      this.fetchBackgroundAvailability();
    }
  }

  async fetchBackgrounds() {
    const { backgrounds } = await getBackgrounds();

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const backgroundOptions = backgrounds.map((background: $TSFixMe) => ({
      text: background.name,
      value: background.id,
      mass_normalized: background.mass_normalized,
    }));

    this.setState({
      backgroundOptions: backgroundOptions,
    });
  }

  async fetchBackgroundAvailability() {
    const { selectedIds } = this.props;
    const { massNormalizedBackgroundsAvailable } =
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
      await getMassNormalizedBackgroundAvailability(Array.from(selectedIds));

    this.setState({
      enableMassNormalizedBackgrounds: massNormalizedBackgroundsAvailable,
    });
  }

  onCategoryChange = (categories: $TSFixMe, subcategories: $TSFixMe) => {
    this.setState({
      selectedCategories: categories,
      selectedSubcategories: subcategories,
    });
  };

  renderCategoryFilter() {
    const { selectedCategories, selectedSubcategories } = this.state;

    const options = CATEGORIES.map((category: $TSFixMe) => {
      const option = { text: category.name, value: category.name };
      const subcategories = category.children;
      if (Array.isArray(subcategories)) {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'suboptions' does not exist on type '{ te... Remove this comment to see the full error message
        option.suboptions = subcategories.map(subcategory => {
          return { text: subcategory, value: subcategory };
        });
      }
      return option;
    });

    return (
      <MultipleNestedDropdown
        fluid
        options={options}
        onChange={this.onCategoryChange}
        placeholder="Select category"
        selectedOptions={selectedCategories}
        selectedSuboptions={selectedSubcategories}
        useDropdownLabelCounter={false}
      />
    );
  }

  onBackgroundChange = (background: $TSFixMe) => {
    this.setState({
      selectedBackground: background,
    });
  };

  renderBackgroundSelect() {
    const {
      backgroundOptions,
      enableMassNormalizedBackgrounds,
      selectedBackground,
    } = this.state;

    return (
      <BackgroundModelFilter
        allBackgrounds={backgroundOptions}
        enableMassNormalizedBackgrounds={enableMassNormalizedBackgrounds}
        fluid
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        label={null}
        onChange={this.onBackgroundChange}
        rounded={false}
        value={selectedBackground}
      />
    );
  }

  onTaxonLevelChange = (taxonLevel: $TSFixMe) => {
    this.setState({ selectedTaxonLevel: taxonLevel });
  };

  renderTaxonLevelSelect() {
    const taxonLevels: $TSFixMe = [];
    Object.entries(SPECIES_SELECTION_OPTIONS).forEach(([text, value]) =>
      taxonLevels.push({ text: startCase(text), value }),
    );

    return (
      <Dropdown
        fluid
        options={taxonLevels}
        onChange={this.onTaxonLevelChange}
        placeholder="Select level"
        usePortal
        withinModal
      />
    );
  }

  onSpecificityChange = (specificity: $TSFixMe) => {
    this.setState({ selectedSpecificity: specificity });
  };

  renderSpecificityFilter() {
    return (
      <Dropdown
        fluid
        options={SPECIFICITY_OPTIONS}
        placeholder="Select specificity"
        onChange={this.onSpecificityChange}
        usePortal
        withinModal
      />
    );
  }

  onThresholdFilterApply = (newThresholdFilters: $TSFixMe) => {
    const { selectedThresholdFilters } = this.state;
    if (isEqual(selectedThresholdFilters, newThresholdFilters)) {
      return;
    }
    this.setState({ selectedThresholdFilters: newThresholdFilters });
  };

  renderThresholdFilterSelect() {
    const { selectedThresholdFilters } = this.state;

    // We don't use the aggregate score filter on heatmaps.
    const thresholdOptions = THRESHOLDS.filter(
      (threshold: $TSFixMe) => threshold.value !== "agg_score",
    );

    return (
      <ThresholdFilterDropdown
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        label={null}
        onApply={this.onThresholdFilterApply}
        options={{
          targets: thresholdOptions,
          operators: [">=", "<="],
        }}
        placeholder="Add a threshold"
        rounded={false}
        thresholds={selectedThresholdFilters}
        // Note: Portal currently doesn't work properly for ThresholdFilterDropdown.
        useDropdownLabelCounter={false}
      />
    );
  }

  renderModalHeader() {
    const { selectedIds } = this.props;

    return (
      <div className={cs.header}>
        <div className={cs.title}>Create a Taxon Heatmap</div>
        <div className={cs.subtitle}>{size(selectedIds)} samples selected</div>
      </div>
    );
  }

  renderPresets() {
    return (
      <div className={cs.presets}>
        <div className={cs.title}>Optional Presets</div>
        <div className={cs.description}>
          Expedite heatmap creation with presets. Presets cannot be changed. If
          you prefer not to use presets, simply click Continue.
        </div>
        <div className={cs.filter}>
          <div className={cs.label}>
            Categories{" "}
            <span className={cs.optionalLabel}> &mdash; Recommended </span>
          </div>
          {this.renderCategoryFilter()}
        </div>
        <div className={cs.filter}>
          <div className={cs.label}>
            Background{" "}
            <span className={cs.optionalLabel}> &mdash; Recommended </span>
          </div>
          {this.renderBackgroundSelect()}
        </div>
        <div className={cs.filter}>
          <div className={cs.label}>Taxon Level</div>
          {this.renderTaxonLevelSelect()}
        </div>
        <div className={cs.filter}>
          <div className={cs.label}>Read Specificity</div>
          {this.renderSpecificityFilter()}
        </div>
        <div className={cs.filter}>
          <div className={cs.label}>Threshold Filters</div>
          {this.renderThresholdFilterSelect()}
        </div>
      </div>
    );
  }

  getHeatmapUrl() {
    const { selectedIds } = this.props;
    const {
      selectedBackground,
      selectedCategories,
      selectedSpecificity,
      selectedSubcategories,
      selectedTaxonLevel,
      selectedThresholdFilters,
    } = this.state;

    const presets = [];
    if (selectedBackground !== 26) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      presets.push("background");
    }
    if (selectedCategories.length > 0) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      presets.push("categories");
    }
    if (!isNull(selectedSpecificity)) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      presets.push("readSpecificity");
    }
    if (Object.keys(selectedSubcategories).length > 0) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      presets.push("subcategories");
    }
    if (!isNull(selectedTaxonLevel)) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      presets.push("species");
    }
    if (selectedThresholdFilters.length > 0) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      presets.push("thresholdFilters");
    }

    const params = getURLParamString({
      background: selectedBackground,
      categories: selectedCategories,
      subcategories: JSON.stringify(selectedSubcategories),
      readSpecificity: selectedSpecificity,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
      sampleIds: Array.from(selectedIds),
      species: selectedTaxonLevel,
      thresholdFilters: JSON.stringify(selectedThresholdFilters),
      presets: presets,
    });

    return `/visualizations/heatmap?${params}`;
  }

  render() {
    const { continueInNewTab, open, onClose } = this.props;
    const url = this.getHeatmapUrl();

    return (
      <Modal narrow open={open} tall onClose={onClose}>
        {this.renderModalHeader()}
        {this.renderPresets()}
        <div className={cs.footer}>
          <PrimaryButton
            className={cs.button}
            text="Continue"
            onClick={() => {
              continueInNewTab ? openUrlInNewTab(url) : openUrl(url);
            }}
          />
          <SecondaryButton
            className={cs.button}
            text="Cancel"
            onClick={onClose}
          />
        </div>
      </Modal>
    );
  }
}

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
HeatmapCreationModal.defaultProps = {
  continueInNewTab: false,
};
