import { PageObject } from "./page-object";
const PAGE_HEADER = "[class*='viewHeader'] h1";
const SAMPLE_LINK = "[class*='pretitle'] a";
const VIZ_NETWORK_GRAPHS = "[class*='graph'] [class='vis-network']";

export class PipelineVizPage extends PageObject {
  // #region Get
  public async getSampleDetails() {
    const sampleDetails = this.page.locator(SAMPLE_LINK);
    return {
      id: (await sampleDetails.getAttribute("href")).split("/")[2],
      name: await sampleDetails.textContent(),
    };
  }

  public async getPageHeaderText() {
    return this.page.locator(PAGE_HEADER).textContent();
  }
  // #endregion Get

  // #region bool
  public async areVizNetworkGraphsVisible() {
    let visible = false;
    const graphs = await this.page.locator(VIZ_NETWORK_GRAPHS).all();
    for (const graph of graphs) {
      if (!graph.isVisible()) {
        return false;
      }
    }
    if (graphs.length > 0) {
      visible = true;
    }
    return visible;
  }
  // #endregion bool
}
