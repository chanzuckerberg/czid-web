import { expect } from "@playwright/test";
import { PageObject } from "./page-object";

const HEATMAP_SAMPLE_NAMES =
  "[class*='columnLabels'] [class*='columnLabel'] text";
const SAVE_BUTTON = "//button[text()='Save']";
const TINY_CONFIRMATION = "[class*='tiny basic']";
const VIEW_OPTIONS = "[class*='listbox'] [class*='option']";
const AVAILABLE_VIEW_OPTIONS =
  "[class*='listbox'] [class*='option'][aria-disabled='false']";
const VIEW_OPTION_LABELS =
  "[class*='lowerFilterSection'] [class*='viewOption'] div[class*='label']";
const VIEW_OPTION_SELECTION = (viewFilter: string) =>
  `//div[text()='${viewFilter}']//ancestor::div[contains(@class, 'viewOptions')]/button/div`;
const HEATMAP = "svg[class*='heatmap']";
const ZOOM_BUTTONS = "[class*='plusMinusControl'] button";
const TAXON_NAMES = "[data-testid='row-label']";
const CELLS = "rect[class*='cell']";
const COLLECTION_LOCATION_CELLS = "[class*='collection_location_v2'] [class*='columnMetadataCell']";
const TOOLTIP = "[class*='tooltip'][class*='visible']";
const HEATMAP_TOOLTIP = "[class*='samplesHeatmapVis'] [class*='tooltip']";
const HOVER_HIGHLIGHTED_METIC =
  "//div[contains(@class, 'value')]/b/ancestor::div[contains(@class, 'dataRow')]/div";
const TOGGLE_SAMPLE_NAMES = "button[class*='toggleNames']";
const APPCUES_CONTAINER = "[class*='appcues-tooltip-container']";
const APPCUES_GOT_IT_BUTTON = "[class*='appcues-button-success']";
const NOTIFICATION_CONTAINER = "[class*='notificationContainer']";
const FILTER_PANEL_CONTAINER = "[class*='filterPanelContainer']";
const CATEGORIES_BUTTON = "//*[text()='Categories']/ancestor::button";
const CATEGORY_OPTIONS = "//*[text()='Select Categories']/following-sibling::*//*[contains(@class, 'primary-text')]/*";
const CATEGORIES_APPLY_BUTTON = "//*[text()='Select Categories']/following-sibling::*//button[text()='Apply']";
const THRESHOLDS_BUTTON = "//*[text()='Thresholds']/ancestor::button";
const THRESHOLDS_INPUT = "input[aria-label='threshold-value']";
const THRESHOLDS_APPLY_BUTTON = "//*[text()='Configure Thresholds']/following-sibling::*//button[text()='Apply']";
const KNOWN_PATHOGENS_ONLY_CHECKBOX = "//*[text()='Known Pathogens Only']/preceding-sibling::*//input";

export class HeatmapPage extends PageObject {
  // #region Api
  public async getHeatmapMetrics() {
    await this.page.locator(VIEW_OPTION_LABELS).getByText("Metric").click();
    const viewOptions = await this.page
      .locator(AVAILABLE_VIEW_OPTIONS)
      .allTextContents();
    await this.page.locator(VIEW_OPTION_LABELS).getByText("Metric").click();
    return viewOptions;
  }
  // #endregion Api

  // #region Click
  public async clickKnownPathogensOnlyCheckbox() {
    await this.page.locator(KNOWN_PATHOGENS_ONLY_CHECKBOX).click();
  }

  public async clickSampleNamesToggle() {
    await this.page.locator(TOGGLE_SAMPLE_NAMES).click();
  }

  public async clickSave() {
    await this.pause(1);
    await this.page.locator(SAVE_BUTTON).hover();
    await this.page.locator(SAVE_BUTTON).click();
  }

  public async clickZoomButton(zoom: "+" | "-") {
    const index = zoom === "+" ? 0 : 1;
    await this.page.locator(ZOOM_BUTTONS).nth(index).click();
  }
  // #endregion Click

  // #region Hover
  public async hoverOverCollectionLocation(index: number) {
    await this.page.locator(COLLECTION_LOCATION_CELLS).nth(index).hover();
  }

  public async hoverOverCell(index: number, axis = "") {
    await this.page.locator(CELLS + axis).nth(index).hover();
  }

  public async hoverOverFIlterPanel() {
    await this.page.locator(FILTER_PANEL_CONTAINER).hover();
  }
  // #endregion Hover

  // #region Get
  public async getTaxonInfo() {
    await this.pause(1);
    return (await this.getTable(
      "[class*='samplesHeatmapVis'] [class*='tooltip'][class*='visible'] [class*='dataRow'] [class*='label']",
      "[class*='samplesHeatmapVis'] [class*='tooltip'][class*='visible']",
      "[class*='dataRow'] [class*='value']",
    ))[0];
  }

  public async getTooltipText() {
    return this.page.locator(TOOLTIP).textContent();
  }

  public async getHeatmapTooltipText() {
    return this.page.locator(HEATMAP_TOOLTIP).textContent();
  }

  public async getNotificationContainerText() {
    return this.page.locator(NOTIFICATION_CONTAINER).textContent();
  }

  public async getCellsCount() {
    await this.page.locator(CELLS).first().waitFor();
    const cells = await this.page.locator(CELLS).all();
    return cells.length;
  }

  public async getViewOptionSelection(viewFilter: string) {
    const filter = this.page.locator(VIEW_OPTION_SELECTION(viewFilter));
    return filter.textContent();
  }

  public async getCellStyles() {
    const cellStyles = [];
    const cells = await this.page.locator(CELLS).all();
    for (const cell of cells) {
      const style = await cell.getAttribute("style");
      cellStyles.push(style);
    }
    return cellStyles;
  }

  public async getHighlightedMetic(index: number) {
    await this.hoverOverCell(index);
    await this.page.locator(HOVER_HIGHLIGHTED_METIC).first().waitFor();
    const metric = await this.page
      .locator(HOVER_HIGHLIGHTED_METIC)
      .allTextContents();
    const metrics = {
      label: metric[0],
      value: metric[1],
    };
    await this.hoverOverFIlterPanel(); // Remove cell hover to hide tooltip
    return metrics;
  }

  public async getHeatmapWidthHeight() {
    return {
      width: await this.page.locator(HEATMAP).getAttribute("width"),
      height: await this.page.locator(HEATMAP).getAttribute("height"),
    };
  }

  public async getViewOptions() {
    return this.page.locator(VIEW_OPTION_LABELS).allTextContents();
  }

  public async getTaxonNames() {
    await this.page.locator(TAXON_NAMES).first().waitFor();
    return this.page.locator(TAXON_NAMES).allTextContents();
  }

  public async getHeatmapSampleNames() {
    await this.page.locator(HEATMAP_SAMPLE_NAMES).first().waitFor();
    return this.page.locator(HEATMAP_SAMPLE_NAMES).allTextContents();
  }

  public async getSaveConfirmation() {
    await this.page.locator(TINY_CONFIRMATION).waitFor();
    return this.page.locator(TINY_CONFIRMATION).textContent();
  }
  // #endregion Get

  // #region Macro
  public async dismissAppcuesContainerIfPresent() {
    await this.page
      .locator(APPCUES_CONTAINER)
      .waitFor({ timeout: 5000 })
      .catch(() => null);
    const appcuesContainer = await this.page
      .locator(APPCUES_CONTAINER)
      .isVisible();
    if (appcuesContainer) {
      const iframe = this.page.frameLocator(APPCUES_CONTAINER);
      await iframe.locator(APPCUES_GOT_IT_BUTTON).click();
    }
  }

  public async setTaxonLevel(option: string) {
    await this.setViewOption("Taxon Level", option);
  }

  public async setMetric(option: string) {
    await this.setViewOption("Metric", option);
  }

  public async setSortSamples(option: string) {
    await this.setViewOption("Sort Samples", option);
  }

  public async setSortTaxa(option: string) {
    await this.setViewOption("Sort Taxa", option);
  }

  public async setScale(option: string) {
    await this.setViewOption("Scale", option);
    await this.pause(1);
  }

  public async setViewOption(view: string, option: string) {
    await this.page.locator(VIEW_OPTION_LABELS).getByText(view).click();
    await this.page.locator(VIEW_OPTIONS).getByText(option).click();
  }

  public async setCategoryOption(option: string) {
    await this.page.locator(CATEGORIES_BUTTON).click();
    await this.page.locator(CATEGORY_OPTIONS).getByText(option).click();
    await this.page.locator(CATEGORIES_APPLY_BUTTON).click();
  }

  public async setThresholdsOptions(options: any) {
    await this.page.locator(THRESHOLDS_BUTTON).click();
    if (options.value) {
      await this.page.locator(THRESHOLDS_INPUT).fill(options.value);
    }
    await this.page.locator(THRESHOLDS_APPLY_BUTTON).click();
  }
  // #endregion Macro

  // #region Validation
  public async validateHeatmapSampleNames(sampleNames: Array<string>) {
    const expectedTruncatedNames = sampleNames.map(name => {
      const truncate_length = 20;
      if (name.length < truncate_length) return name;
      return `${name.substring(0, 9)}...${name.slice(-7)}`;
    });

    const heatmapSampleNames = await this.getHeatmapSampleNames();
    heatmapSampleNames.sort();
    expectedTruncatedNames.sort();

    expect(heatmapSampleNames).toEqual(expectedTruncatedNames);
  }

  public async validateNotificationContainerIsNotPresent() {
    await this.page
      .locator(NOTIFICATION_CONTAINER)
      .waitFor({ timeout: 2 })
      .catch(() => null);
    if (await this.isNotificationContainerPresent()) {
      const notification = await this.getNotificationContainerText();
      expect(notification).toBeUndefined();
    }
  }
  // #endregion Validation

  // #region Bool
  public async isNotificationContainerPresent() {
    return this.page.locator(NOTIFICATION_CONTAINER).isVisible();
  }
  // #endregion Bool
}
