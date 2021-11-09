import { isEqual, startCase } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";

import { getBackgrounds, getMassNormalizedBackgroundAvailability } from "~/api";
import { withAnalytics, ANALYTICS_EVENT_NAMES } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import SecondaryButton from "~/components/ui/controls/buttons/SecondaryButton";
import {
  CATEGORIES,
  THRESHOLDS,
} from "~/components/views/SampleView/constants";
import {
  SPECIFICITY_OPTIONS,
  TAXON_LEVEL_OPTIONS,
} from "~/components/views/compare/SamplesHeatmapView/constants";
import BackgroundModelFilter from "~/components/views/report/filters/BackgroundModelFilter";
import { getURLParamString } from "~/helpers/url";
import Modal from "~ui/containers/Modal";
import {
  Dropdown,
  MultipleNestedDropdown,
  ThresholdFilterDropdown,
} from "~ui/controls/dropdowns";
import { openUrl } from "~utils/links";

import cs from "./heatmap_creation_modal.scss";

export default class HeatmapCreationModal extends React.Component {
  constructor(props) {
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

  componentDidUpdate(prevProps) {
    if (prevProps.selectedIds !== this.props.selectedIds) {
      this.fetchBackgroundAvailability();
    }
  }

  async fetchBackgrounds() {
    const { backgrounds } = await getBackgrounds();

    const backgroundOptions = backgrounds.map(background => ({
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
    const {
      massNormalizedBackgroundsAvailable,
    } = await getMassNormalizedBackgroundAvailability(Array.from(selectedIds));

    this.setState({
      enableMassNormalizedBackgrounds: massNormalizedBackgroundsAvailable,
    });
  }

  onCategoryChange = (categories, subcategories) => {
    this.setState({
      selectedCategories: categories,
      selectedSubcategories: subcategories,
    });
  };

  renderCategoryFilter() {
    const { selectedCategories, selectedSubcategories } = this.state;

    let options = CATEGORIES.map(category => {
      let option = { text: category.name, value: category.name };
      let subcategories = category.children;
      if (Array.isArray(subcategories)) {
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

  onBackgroundChange = background => {
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
        label={null}
        onChange={this.onBackgroundChange}
        rounded={false}
        value={selectedBackground}
      />
    );
  }

  onTaxonLevelChange = taxonLevel => {
    this.setState({ selectedTaxonlevel: taxonLevel });
  };

  renderTaxonLevelSelect() {
    const taxonLevels = [];
    Object.entries(TAXON_LEVEL_OPTIONS).forEach(([text, value]) =>
      taxonLevels.push({ text: startCase(text), value })
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

  onSpecificityChange = specificity => {
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

  onThresholdFilterApply = newThresholdFilters => {
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
      threshold => threshold.value !== "agg_score"
    );

    return (
      <ThresholdFilterDropdown
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
      />
    );
  }

  renderModalHeader() {
    const { selectedIds } = this.props;
    return (
      <div className={cs.header}>
        <div className={cs.title}>Create a Taxon Heatmap</div>
        <div className={cs.subtitle}>{selectedIds.size} samples selected</div>
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
  render() {
    const { open, onClose, selectedIds } = this.props;

    const {
      selectedBackground,
      selectedCategories,
      selectedSpecificity,
      selectedSubcategories,
      selectedTaxonLevel,
      selectedThresholdFilters,
    } = this.state;

    // TODO: Update heatmap query to filter results on the backend based on these parameters.
    const params = getURLParamString({
      sampleIds: Array.from(selectedIds),
    });

    return (
      <Modal narrow open={open} tall onClose={onClose}>
        {this.renderModalHeader()}
        {this.renderPresets()}
        <div className={cs.footer}>
          <PrimaryButton
            className={cs.button}
            text="Continue"
            onClick={() => {
              withAnalytics(
                openUrl(`/visualizations/heatmap?${params}`),
                ANALYTICS_EVENT_NAMES.HEATMAP_CREATION_MODAL_CONTINUE_BUTTON_CLICKED,
                {
                  selectedBackground,
                  selectedCategories,
                  selectedSpecificity,
                  selectedSubcategories,
                  selectedTaxonLevel,
                  selectedThresholdFilters,
                }
              );
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

HeatmapCreationModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool,
  selectedIds: PropTypes.instanceOf(Set),
};

HeatmapCreationModal.contextType = UserContext;
