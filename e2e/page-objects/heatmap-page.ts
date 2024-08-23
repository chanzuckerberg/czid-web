import { Download, expect } from "@playwright/test";
import { PageObject } from "./page-object";
import { SamplesPage } from "./samples-page";
import { ArticlesPage } from './articles-page';

const HEATMAP_NAME =
  "[class*='sampleName']";
const HEATMAP_NAME_INPUT =
  "[class*='sampleName'] input";
const HEATMAP_SAMPLE_NAMES =
  "[class*='columnLabels'] [class*='columnLabel'] text";
const SHARE_BUTTON = "//button[text()='Share']";
const SAVE_BUTTON = "//button[text()='Save']";
const DOWNLOAD_BUTTON = "//*[contains(@class, 'controls')]/button[text()='Download']";
const HELP_BUTTON = "[data-testid='help-button']"
const DOWNLOAD_TYPES_LOCATOR = "[class*='downloadTypeContainer'] [class*='name']";
const DOWNLOAD_MODAL_BUTTON = "//*[contains(@class, 'footer')]/button[text()='Download']";
const DOWNLOAD_MODAL_START_GENERATING_DOWNLOAD_BUTTON = "//button[text()='Start Generating Download']";
const DOWNLOAD_MODAL_METRIC_DROPDOWN = "[class*='metricDropdown'] [class*='dropdownTrigger']";
const DOWNLOAD_MODAL_METRIC_OPTIONS = "[data-testid='dropdown-menu'] [class*='item item']"
const DOWNLOAD_COMBINED_MICROBIOME_FILE_ALERT = "[role='alert'][class*='toast-body']";
const CLOSE_MODAL_BUTTON = "[class*='modal'] [class*='closeIcon']";
const HELP_RESOURCES_IFRAME = "appcues-container iframe";
const HELP_RESOURCES_CONTENT = "cue";
const HEADER_BUTTON_POPUP_CONTENT = "[class*='popup'] [class*='content']";
const TINY_CONFIRMATION = "[class*='tiny basic']";
const VIEW_OPTIONS = "//*[contains(@class, 'listbox')]//*[contains(@class, 'option')]";
const AVAILABLE_VIEW_OPTIONS =
  "[class*='listbox'] [class*='option'][aria-disabled='false']";
const VIEW_OPTION_LABELS =
  "[class*='lowerFilterSection'] [class*='viewOption'] div[class*='label']";
const METRIC_SELECTION = "//*[text()='Metric']/ancestor::button/div";
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
const NOTIFICATION_MESSAGE = "[class*='notification']";
const NOTIFICATION_CONTAINER = "[class*='notificationContainer']";
const FILTER_PANEL_CONTAINER = "[class*='filterPanelContainer']";
const CATEGORIES_BUTTON = "//*[text()='Categories']/ancestor::button";
const CATEGORY_OPTIONS = "//*[text()='Select Categories']/following-sibling::*//*[contains(@class, 'primary-text')]/*";
const CATEGORY_SELECTIONS = "[class*='categoryDropdownContainer'] [class*='labelText']";
const CATEGORIES_APPLY_BUTTON = "//*[text()='Select Categories']/following-sibling::*//button[text()='Apply']";
const CATEGORIES_CANCEL_BUTTON = "//*[text()='Select Categories']/following-sibling::*//button[text()='Cancel']";
const THRESHOLDS_BUTTON = "//*[text()='Thresholds']/ancestor::button";
const THRESHOLDS_OPERATOR = "//*[contains(@class, 'filterContainer')]//button[@label='>=' or @label='<=']";
const THRESHOLDS_METRIC_BUTTON = "[class*='thresholdFilter'] [class*='metricColumn'] button";
const THRESHOLDS_METRIC_FILTERS = "[class*='filterTagsList'] [class*='labelText']";
const THRESHOLD_SELECTIONS = "[class*='thresholdDropdownContainer'] [class*='labelText']";
const REMOVE_THRESHOLD_X_BUTTON = "[class*='filterTagsList'] [data-testid='x-close-icon']";
const ADD_THRESHOLD = "[data-testid='add-threshold']";
const BACKGROUND_DROPDOWN = "[class*='backgroundDropdownContainer'] button";
const SELECTED_BACKGROUND = "//*[contains(@class, 'backgroundDropdownContainer')]/button/div";
const SEARCH_INPUT = "[role='tooltip'] input";
const SEARCH_RESULTS = "//ul[contains(@class, 'listbox')]//li[@aria-disabled='false']//*[contains(@class, 'primary-text')]";
// TODO: rename to be specific to new background alert
const ALERT_MESSAGE = "[class*='Alert-message']";
const CLOSE_ALERT_BUTTON = "[class*='Alert-action'] button";
const THRESHOLDS_INPUT = "input[aria-label='threshold-value']";
const THRESHOLDS_APPLY_BUTTON = "//*[text()='Configure Thresholds']/following-sibling::*//button[text()='Apply']";
const KNOWN_PATHOGENS_ONLY_CHECKBOX = "//*[text()='Known Pathogens Only']/preceding-sibling::*//input";

export const SHAREABLE_URL_NOTIFICATION = "A shareable URL was copied to your clipboard!";
export const SHORTENED_URL_LENGTH = 5; // default value in shortener gem

export const DOWNLOAD_TYPES = {
  COMBINED_MICROBIOME_FILE: "Combined Microbiome File",
  PNG_IMAGE: ".png",
  SVG_IMAGE: ".svg",
};
type HeatmapImageType = typeof DOWNLOAD_TYPES.PNG_IMAGE | typeof DOWNLOAD_TYPES.SVG_IMAGE;

// .biom is listed as Combined Microbiome File in the download modal
export const BIOM_DOWNLOAD_METRICS = {
  NT_RPM: "NT rPM",
  NT_R_TOTAL_READS: "NT r (total reads)",
  NR_RPM: "NR rPM",
  NR_R_TOTAL_READS: "NR r (total reads)",
};
export const DOWNLOAD_NOTIFICATION = "We've received your download request and are busy preparing your data. To check the status of your download, visit the Downloads page.Dismiss";
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

  // #region fill
  public async fillHeatmapName(value: string) {
    await this.page.locator(HEATMAP_NAME).hover();
    await this.pause(1);
    await this.page.locator(HEATMAP_NAME).click();
    await this.page.locator(HEATMAP_NAME_INPUT).fill(value);
  }

  public async fillSearchInput(value: string) {
    await this.page.locator(SEARCH_INPUT).fill(value);
  }
  // #endregion fill

  // #region Click
  public async clickShareButton() {
    await this.page.locator(SHARE_BUTTON).waitFor();
    await this.page.locator(SHARE_BUTTON).click();
    await this.pause(1);
    return this.getClipboardText();
  }

  public async clickDownloadButton() {
    await this.page.locator(DOWNLOAD_BUTTON).click();
  }

  public async clickHelpButton() {
    await this.page.locator(HELP_BUTTON).click();
  }

  public async clickDownloadMetric(option: string) {
    await this.page.locator(DOWNLOAD_MODAL_METRIC_DROPDOWN).click();
    await this.page.locator(DOWNLOAD_MODAL_METRIC_OPTIONS).getByText(option).click();
  }

  public async clickThresholdOperator(index=0) {
    await this.page.locator(THRESHOLDS_OPERATOR).nth(index).click();
  }

  // TODO: Update function name to StartGeneratingDownload for clarity
  public async clickStartDownloadButton() {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        response =>
          (response.url().includes("bulk_downloads") &&
            response.request().method() === "POST") ||
          (response.url().includes("graphqlfed") &&
            response.request().method() === "POST"),
      ),
      this.page.locator(DOWNLOAD_MODAL_START_GENERATING_DOWNLOAD_BUTTON).click(),
    ]);
    const responseJson = await response.json();
    if (responseJson.data && responseJson.data.createAsyncBulkDownload) {
      // graphqlfed
      return responseJson.data.createAsyncBulkDownload.id;
    } else {
      // bulk_downloads
      return responseJson.id;
    }
  }

  public async clickDownloadConfirmationButton() {
    const downloadPromise = this.page.waitForEvent("download");
    await this.page.locator(DOWNLOAD_MODAL_BUTTON).click();
    await this.page.locator(CLOSE_MODAL_BUTTON).click();
    return downloadPromise;
  }

  public async clickCloseAlertButton() {
    const closeIcon = this.page.locator(CLOSE_ALERT_BUTTON).first();
    await closeIcon.waitFor({timeout: 4000}).catch(() => null);

    await closeIcon.click({timeout: 1000}).catch(() => null);
    if (closeIcon.isVisible()) {
      await closeIcon.click({timeout: 1000}).catch(() => null);
    }
  }

  public async clickSearchResult(value: string) {
    await this.page.locator(`${SEARCH_RESULTS}//*[normalize-space(text())="${value}"]`).click();
  }

  public async clickBackgroundDropdown() {
    await this.page.locator(BACKGROUND_DROPDOWN).click();
  }

  public async clickAddThreshold() {
    await this.page.locator(ADD_THRESHOLD).click();
  }

  public async clickKnownPathogensOnlyCheckbox() {
    await this.page.locator(KNOWN_PATHOGENS_ONLY_CHECKBOX).click();
  }

  public async isSampleNamesToggleDisabled() {
    return this.page.locator(TOGGLE_SAMPLE_NAMES).isDisabled()
  }

  public async clickSampleNamesToggle() {
    await this.page.locator(TOGGLE_SAMPLE_NAMES).click();
  }

  public async clickDownloadType(downloadType: string) {
    await this.pause(1);
    await this.page
      .locator(DOWNLOAD_TYPES_LOCATOR)
      .getByText(downloadType)
      .first()
      .click();
    await this.pause(1);
  }

  public async clickSave() {
    await this.pause(1);
    await this.page.locator(SAVE_BUTTON).hover();

    const [response] = await Promise.all([
      this.page.waitForResponse(
        response =>
          (response.url().includes("/visualizations/heatmap/save") &&
            response.request().method() === "POST")
      ),
      this.page.locator(SAVE_BUTTON).click(),
    ]);
    const responseJson = await response.json();
    return responseJson.id;
  }

  public async clickZoomButton(zoom: "+" | "-") {
    const index = zoom === "+" ? 0 : 1;
    await this.page.locator(ZOOM_BUTTONS).nth(index).click();
  }

  public async clickRemoveFilterButton(index = 0) {
    await this.pause(1);
    await this.page.locator(REMOVE_THRESHOLD_X_BUTTON).nth(index).click();
    await this.pause(1);
  }

  public async clickCell(index: number, axis = "") {
    await this.pause(1);
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent("page"),
      await this.page.locator(CELLS + axis).nth(index).click(),
    ]);
    await newPage.waitForLoadState();
    const samplesPage = new SamplesPage(newPage);

    await this.pause(3);
    return samplesPage;
  }
  // #endregion Click

  // #region Hover
  public async hoverOverCollectionLocation(index: number) {
    await this.page.locator(COLLECTION_LOCATION_CELLS).nth(index).hover();
  }

  public async hoverOverCell(index: number, axis = "") {
    await this.page.locator(CELLS + axis).nth(index).hover();
  }

  public async hoverOverFilterPanel() {
    await this.page.locator(FILTER_PANEL_CONTAINER).hover();
  }
  // #endregion Hover

  // #region Get
  public async getNotificationMessage() {
    return this.page.locator(NOTIFICATION_MESSAGE).textContent();
  }

  public async getMetricSelection() {
    return this.page.locator(METRIC_SELECTION).textContent();
  }

  public async getCategorySelections() {
    return this.page.locator(CATEGORY_SELECTIONS).allTextContents();
  }

  public async getThresholdSelections() {
    return this.page.locator(THRESHOLD_SELECTIONS).allTextContents();
  }

  public async getBackgrounds() {
    await this.clickBackgroundDropdown();
    const backgrounds = await this.page.locator(SEARCH_RESULTS).allTextContents();
    const types = ["Standard", "Normalized by input mass"];
    for (let i = 0; i < backgrounds.length; i++) {
      for (const type of types) {
        if (backgrounds[i].endsWith(type)) {
          backgrounds[i] = backgrounds[i].slice(0, -type.length).trim();
        }
      }
    }
    await this.clickBackgroundDropdown();
    return backgrounds;
  }

  public async getCategoryOptions() {
    await this.page.locator(CATEGORIES_BUTTON).click();
    const options = await this.page.locator(CATEGORY_OPTIONS).allTextContents();
    await this.page.locator(CATEGORIES_CANCEL_BUTTON).click();
    return options;
  }

  public async getThresholdsMetricFilters() {
    return this.page.locator(THRESHOLDS_METRIC_FILTERS).allTextContents();
  }

  public async getSaveNotification() {
    // TODO: call getHeaderButtonPopupContent instead
    return this.page.locator(HEADER_BUTTON_POPUP_CONTENT).textContent();
  }

  public async getShareNotification() {
    return this.getHeaderButtonPopupContent();
  }

  public async getHeaderButtonPopupContent() {
    return this.page.locator(HEADER_BUTTON_POPUP_CONTENT).textContent();
  }

  public async getAlertMessage() {
    return this.page.locator(ALERT_MESSAGE).textContent();
  }

  public async getBulkDownloadAlertMessage() {
    await this.page
      .locator(DOWNLOAD_COMBINED_MICROBIOME_FILE_ALERT)
      .first()
      .waitFor({ state: "visible" });
    return this.page.locator(DOWNLOAD_COMBINED_MICROBIOME_FILE_ALERT).allTextContents();
  }

  public async getHelpResourcesIframe() {
    return this.page.frameLocator(HELP_RESOURCES_IFRAME);
  }

  public async getTaxonInfo() {
    await this.pause(1);
    return (await this.getTable(
      "[class*='samplesHeatmapVis'] [class*='tooltip'][class*='visible'] [class*='dataRow'] [class*='label']",
      "[class*='samplesHeatmapVis'] [class*='tooltip'][class*='visible']",
      "[class*='dataRow'] [class*='value']",
    ))[0];
  }

  public async getSelectedBackground() {
    await this.page.locator(SELECTED_BACKGROUND).waitFor();
    const selectedBackground = await this.page.locator(SELECTED_BACKGROUND).textContent();
    await this.pause(1);
    return selectedBackground.trim()
  }

  public async getTooltipText() {
    return this.page.locator(TOOLTIP).textContent();
  }

  public async getHeatmapTooltipText() {
    return this.page.locator(HEATMAP_TOOLTIP).textContent();
  }

  public async getHeatmapTooltipDetails() {
    const tooltipText = await this.getHeatmapTooltipText();
    const toolTipRegex = new RegExp(
      "Info" +
      "Sample(.+)" +
      "Taxon(.+)" +
      "Category(.+)" +
      "Values" +
      "NT Z Score(.+)" +
      "NT rPM(.+)" +
      "NT r \\(total reads\\)(.+)" +
      "NR Z Score(.+)" +
      "NR rPM(.+)" +
      "NR r \\(total reads\\)(.+)"
    );

    let tooltipDetails = {};
    const matchedText = tooltipText.match(toolTipRegex)
    if (matchedText !== null) {
      tooltipDetails = {
        "Sample": matchedText[1],
        "Taxon": matchedText[2],
        "Category": matchedText[3],
        "NT Z Score": matchedText[4],
        "NT rPM": matchedText[5],
        "NT r (total reads)": matchedText[6],
        "NR Z Score": matchedText[7],
        "NR rPM": matchedText[8],
        "NR r (total reads)": matchedText[9],
      }
    }
    return tooltipDetails
  }

  public async getNotificationContainerText() {
    return this.page.locator(NOTIFICATION_CONTAINER).textContent();
  }

  public async getCellsCount() {
    await this.page.locator(CELLS).first().waitFor().catch(() => null);
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
    await this.hoverOverFilterPanel(); // Remove cell hover to hide tooltip
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

  public async getMetricOptions(includeDisabled = false) {
    return this.getAllViewOptions("Metric", includeDisabled);
  }

  private async getAllViewOptions(view: string, includeDisabled = false) {
    await this.page.locator(VIEW_OPTION_LABELS).getByText(view).click();

    await this.page.locator(VIEW_OPTIONS).first().waitFor();
    const options = await this.page.locator(includeDisabled ? VIEW_OPTIONS : AVAILABLE_VIEW_OPTIONS).allTextContents();
    await this.page.locator(VIEW_OPTION_LABELS).getByText(view).click();
    return options;
  }

  private async getAllFilterOptions(includeDisabled = false) {
    await this.page.locator(VIEW_OPTIONS).first().waitFor();
    return this.page.locator(includeDisabled ? VIEW_OPTIONS : AVAILABLE_VIEW_OPTIONS).allTextContents();
  }
  // #endregion Get

  // #region Macro
  public async gotoHeatmap(heatmapUrl: string) {
    await this.pause(1);
    await this.page.goto(heatmapUrl);
    await this.page.waitForLoadState();
    await this.pause(3);

    await this.page.locator(CELLS).first().waitFor();
  }

  public async removeAllFilters() {
    await this.page.locator(REMOVE_THRESHOLD_X_BUTTON).last().waitFor();
    for (let r = 0; r < 3; r++) {
      const filters = await this.page.locator(REMOVE_THRESHOLD_X_BUTTON).all();
      await this.page.locator(REMOVE_THRESHOLD_X_BUTTON).last().waitFor({timeout: 1_000}).catch(() => null);
      for (let i = 0; i < filters.length; i++) {
        await this.page.locator(REMOVE_THRESHOLD_X_BUTTON).nth(0).click();
        // allow heatmap to reload, filters are disabled during reload
        await this.pause(5);
      }
      await this.pause(4);
    }
  }

  public async setThresholdOperator(value: string, index=0) {
    await this.clickThresholdOperator(index);
    await this.clickSearchResult(value);
  }

  public async setBackground(value: string) {
    await this.clickBackgroundDropdown();
    await this.fillSearchInput(value);
    await this.clickSearchResult(value);
  }

  public async getThresholdsOptions(includeDisabled = false) {
    await this.page.locator(THRESHOLDS_BUTTON).click();
    await this.page.locator(THRESHOLDS_METRIC_BUTTON).click();

    const filterOptions = await this.getAllFilterOptions(includeDisabled);
    await this.page.locator(THRESHOLDS_METRIC_BUTTON).click();
    await this.page.locator(THRESHOLDS_BUTTON).click();
    return filterOptions;
  }

  public async getThresholdOptionTooptip(option: string) {
    await this.page.locator(THRESHOLDS_BUTTON).click();
    await this.page.locator(THRESHOLDS_METRIC_BUTTON).click();

    await this.page.locator(VIEW_OPTIONS).first().waitFor();
    const xpathLocator = `${VIEW_OPTIONS}//span[text()='${option}']/ancestor::li/parent::span`;
    await this.page.locator(xpathLocator).hover();
    const tooltip = await this.page.locator("[class*='tooltip']").textContent();

    await this.pressEnter();
    await this.page.locator(THRESHOLDS_BUTTON).click();

    return tooltip;
  }

  public async getMetricOptionTooltip(option: string) {
    return this.getOptionTooptip("Metric", option)
  }

  private async getOptionTooptip(view: string, option: string) {
    await this.page.locator(VIEW_OPTION_LABELS).getByText(view).click();

    await this.pause(1);
    await this.page.locator(`${VIEW_OPTIONS}//span[text()='${option}']/ancestor::li/parent::span`).hover();
    const tooltip = await this.page.locator("[class*='tooltip']").textContent();

    await this.page.locator(VIEW_OPTION_LABELS).getByText(view).click();
    return tooltip;
  }

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

  private async setViewOption(view: string, option: string) {
    await this.page.locator(VIEW_OPTION_LABELS).getByText(view).click();
    await this.page.locator(VIEW_OPTIONS).getByText(option).click();
  }

  public async setCategoryOption(options: any) {
    if (!Array.isArray(options)) {
      options = [options]
    }
    for (const option of options) {
      await this.page.locator(CATEGORIES_BUTTON).click();
      await this.page.locator(CATEGORY_OPTIONS).getByText(option).click();
      await this.page.locator(CATEGORIES_APPLY_BUTTON).click();
    }
  }

  public async setThresholdsOptions(options: any) {
    await this.page.locator(THRESHOLDS_BUTTON).click();
    if (!Array.isArray(options)) {
      options = [options];
    }
    const inputs = await this.page.locator(THRESHOLDS_INPUT).all();
    if (inputs.length <= 0) {
      await this.clickAddThreshold();
    }
    for (let i = 0; i < options.length; i++) {
      await this.pause(1);

      const option = options[i];
      if (option.value) {
        await this.pause(1);
        await this.page.locator(THRESHOLDS_INPUT).nth(i).fill(option.value);
      }
      if (option.operator) {
        await this.pause(1);
        await this.setThresholdOperator(option.operator, i);
      }
      if (option.metric) {
        await this.pause(1);
        await this.page.locator(THRESHOLDS_METRIC_BUTTON).nth(i).click()
        await this.pause(1);
        await this.page.locator(VIEW_OPTIONS).getByText(option.metric).click();
      }
      if (options[i +1] !== undefined) {
        await this.pause(1);
        await this.clickAddThreshold();
      }
    }
    await this.pause(1);
    await this.page.locator(THRESHOLDS_APPLY_BUTTON).click();
  }

  public async clickHelpResourceLink(name: string) : Promise<ArticlesPage> {
    const newPagePromise = this.page.context().waitForEvent("page");
    const helpResourcesIframe = await this.getHelpResourcesIframe();
    await helpResourcesIframe.getByRole("link", { name }).click();
    const newPage = await newPagePromise;

    await newPage.waitForLoadState();
    return new ArticlesPage(newPage);
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

  public async validateHelpResourcesPanelVisible() {
    await expect(
      (await this.getHelpResourcesIframe())
        .locator(HELP_RESOURCES_CONTENT)
    ).toBeVisible();
  }
  // #endregion Validation

  // #region Bool
  public async isNotificationContainerPresent() {
    return this.page.locator(NOTIFICATION_CONTAINER).isVisible();
  }
  // #endregion Bool

  public async downloadCombinedMicrobiomeFile(downloadMetric: string): Promise<number> {
    // #region Download Combined Microbiome File for given metric
    await this.clickDownloadType(DOWNLOAD_TYPES.COMBINED_MICROBIOME_FILE);
    await this.pause(1);
    await this.clickDownloadMetric(downloadMetric);
    const biomDownloadId = await this.clickStartDownloadButton();
    // #endregion Download Combined Microbiome File for given metric

    // #region Verify the download alert message
    const alertMessage = await this.getBulkDownloadAlertMessage();
    expect(alertMessage).toEqual([DOWNLOAD_NOTIFICATION]);
    // #endregion Verify the download alert message

    return biomDownloadId;
  };

  public async downloadHeatmapImage(imageType: HeatmapImageType): Promise<Download> {
    // #region Download heatmap image and verify file name
    await this.clickDownloadType(imageType);
    const downloadedHeatmapImage = await this.clickDownloadConfirmationButton();
    expect(downloadedHeatmapImage.suggestedFilename()).toEqual(`heatmap${imageType}`);
    // #endregion Download heatmap image and verify file name

    return downloadedHeatmapImage;
  };
}
