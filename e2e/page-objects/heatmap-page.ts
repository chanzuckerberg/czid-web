import { expect } from "@playwright/test";
import { PageObject } from "./page-object";

const HEATMAP_SAMPLE_NAMES = "[class*='columnLabels'] [class*='columnLabel'] text";
const SAVE_BUTTON = "//button[text()='Save']";
const TINY_CONFIRMATION = "[class*='tiny basic']";
const VIEW_OPTIONS = "[class*='listbox'] [class*='option']";
const VIEW_OPTION_LABELS = "[class*='lowerFilterSection'] [class*='viewOption'] div[class*='label']";
const VIEW_OPTION_SELECTION = (viewFilter: string) => `//div[text()='${viewFilter}']//ancestor::div[contains(@class, 'viewOptions')]/button/div`;
const HEATMAP = "svg[class*='heatmap']";
const ZOOM_BUTTONS = "[class*='plusMinusControl'] button";
const TAXON_NAMES = "[data-testid='row-label']";
const CELLS = "rect[class*='cell']";
const HOVER_HIGHLIGHTED_METIC = "//div[contains(@class, 'value')]/b/ancestor::div[contains(@class, 'dataRow')]/div";
const TOGGLE_SAMPLE_NAMES = "button[class*='toggleNames']";

export class HeatmapPage extends PageObject {

  // #region Api
  public async getHeatmapMetrics() {
    const requestUrl = `${process.env.BASEURL}/visualizations/heatmap_metrics.json`;
    const response = await this.page.context().request.get(requestUrl);
    const metrics = await response.json();
    return metrics.slice(0,6); // The first 6 metrics apply
  }
  // #endregion Api

  // #region Click
  public async clickSampleNamesToggle() {
    await this.page.locator(TOGGLE_SAMPLE_NAMES).click();
  }

  public async clickSave() {
    await this.page.locator(SAVE_BUTTON).click();
  }

  public async clickZoomButton(zoom: "+" | "-") {
    const index = zoom === "+" ? 0 : 1;
    await this.page.locator(ZOOM_BUTTONS).nth(index).click();
  }
  // #endregion Click

  // #region Hover
  public async hoverOverCell(index: number) {
    await this.page.locator(CELLS).nth(index).hover();
  }
  // #endregion Hover

  // #region Get
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
    const metric = await this.page.locator(HOVER_HIGHLIGHTED_METIC).allTextContents();
    return {
      "label": metric[0],
      "value": metric[1],
    };
  }

  public async getHeatmapWidthHeight() {
    return {
      "width": await this.page.locator(HEATMAP).getAttribute("width"),
      "height": await this.page.locator(HEATMAP).getAttribute("height"),
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
  // #endregion Macro

  // #region Validation
  public async validateHeatmapSampleNames(sampleNames: Array<string>) {
    const expectedTruncatedNames = sampleNames.map(name => {
      const truncate_length = 12;
      if (name.length <= truncate_length) return name;
      return `${name.substring(0,9)}...${name.slice(-7)}`;
    });

    const heatmapSampleNames = await this.getHeatmapSampleNames();
    heatmapSampleNames.sort();
    expectedTruncatedNames.sort();

    expect(heatmapSampleNames).toEqual(expectedTruncatedNames);
  }
  // #endregion Validation
}