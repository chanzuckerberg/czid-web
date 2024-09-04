import { WORKFLOWS } from "@e2e/constants/common";
import { HeatmapPage } from "@e2e/page-objects/heatmap-page";
import { ProjectPage } from "@e2e/page-objects/project-page";
import { test, expect } from "@playwright/test";

let heatmapPage = null;
let projectPage = null;

test.describe("Heatmap top links", () => {
  test.beforeEach(async ({ page }) => {
    // #region Navigate to My Data page
    projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion Navigate to My Data page

    // #region Navigate to mNGS automation project
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.MNGS}`);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    // #endregion Navigate to mNGS automation project

    // #region Select samples and create a heatmap
    await projectPage.selectCompletedSamples(2);
    await projectPage.clickHeatmapButton();
    heatmapPage = await projectPage.clickTaxonHeatmap();
    await heatmapPage.dismissAppcuesContainerIfPresent();
    // #endregion Select samples and create a heatmap
  });

  test("SNo 2: Share button copies shareable URL to clipboard", async ({ page }) => {
    // #region Click the Share button and verify notification
    const shareableURL = await heatmapPage.clickShareButton();
    await heatmapPage.validateShareNotificationMessage();
    // #endregion Click the Share button and verify notification

    // #region Validate the shareable URL was copied to the clipboard
    expect(shareableURL).not.toBeNull();
    expect(shareableURL.startsWith(process.env.BASEURL)).toBeTruthy();
    // shareable URL example: "https://staging.czid.org/a1b2c"
    const shortUrl = shareableURL.split("/").pop()
    heatmapPage.validateShareableUrlLength(shortUrl);
    // #endregion Validate the shareable URL was copied to the clipboard
  });

  test("SNo 3: Save button propagates background and filters", async ({ page }) => {
    // #region Change to a random background
    const background = await heatmapPage.changeToRandomNewBackground(false);
    // #endregion Change to a random background

    // #region Set a threshold filter
    const filterOption = [
      {
        metric: "NT Z Score",
        operator: ">=",
        value: "1"
      },
      {
        metric: "NR rPM",
        operator: ">=",
        value: "1"
      }
    ];
    await heatmapPage.setThresholdsOptions(filterOption);
    // #endregion Set a threshold filter

    // #region Close alert for generating heatmap and save heatmap
    await heatmapPage.clickCloseAlertButton();
    const heatmapId = await heatmapPage.clickSave();
    // #endregion Close alert for generating heatmap and save heatmap

    // #region Close heatmap tab, and navigate to saved heatmap
    await heatmapPage.close();
    heatmapPage = new HeatmapPage(page);
    const savedHeatmapUrl = `${process.env.BASEURL}/visualizations/heatmap/${heatmapId}`
    await heatmapPage.gotoHeatmap(savedHeatmapUrl);
    // #endregion Close heatmap tab, and navigate to saved heatmap

    // #region Validate background is propagated in saved heatmap
    const savedHeatmapBackground = await heatmapPage.getSelectedBackground();
    expect(savedHeatmapBackground).toEqual(background);
    // #endregion Validate background is propagated in saved heatmap

    // #region Validate threshold filters are propagated in saved heatmap
    const savedHeatmapThresholds = await heatmapPage.getThresholdSelections();
    const expectedThresholds = filterOption.map(option => `${option.metric} ${option.operator} ${option.value}`);
    expect(savedHeatmapThresholds).toEqual(expectedThresholds);
    // #endregion Validate threshold filters are propagated in saved heatmap
  });

  test("SNo 5/6: Help button shows help center panel with links", async ({ page }) => {
    // #region Click Help button and verify that help resources panel is visible
    await heatmapPage.clickHelpButton();
    await heatmapPage.validateHelpResourcesPanelVisible();
    // #endregion Click Help button and verify that help resources panel is visible

    // #region Validate each help resource link
    const helpResourceLinks = [
      { name: "Interpreting My Data in a Heatmap", expectedUrl: "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360043062653-Heatmap-Analysis" },
      { name: "Filtering Data & Changing Heatmap View Settings", expectedUrl: "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360043062653-Heatmap-Analysis#view-settings-and-filters" },
      { name: "Understanding Heatmap Clustering & Dendrograms", expectedUrl: "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360054006612-Heatmap-clustering" },
      { name: "Adding Metadata to My Heatmap", expectedUrl: "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360043062853-Metadata-in-the-Heatmap" },
      { name: "Adding Taxa to My Heatmap", expectedUrl: "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360043062453-Creating-a-Heatmap#add-taxon" },
      { name: "Saving My Heatmap", expectedUrl: "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360042578654-Saving-a-Heatmap" },
      { name: "Downloading My Heatmap", expectedUrl: "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360042578654-Saving-a-Heatmap" },
      { name: "CZ ID Help Center", expectedUrl: "https://chanzuckerberg.zendesk.com/hc/en-us" },
    ];

    for await (const { name, expectedUrl } of helpResourceLinks) {
      const helpPage = await heatmapPage.clickHelpResourceLink(name);
      await helpPage.validateUrlIncludesLinkText(expectedUrl);
      await helpPage.close();
    };
    // #endregion Validate each help resource link

    // #region Verify email support link
    const helpResourcesIframe = await heatmapPage.getHelpResourcesIframe();
    const mailtoLink = helpResourcesIframe.getByRole("link", { name: "contact us" });
    await expect(mailtoLink).toHaveAttribute(
      "href",
      "mailto:help@czid.org?Subject=Report%20Feedback"
    );
    // #endregion Verify email support link
  });

  test("SNo 38: Shareable URL opens heatmap", async ({ page }) => {
    // #region Get sample names in heatmap
    const originalHeatmapSampleNames = await heatmapPage.getHeatmapSampleNames();
    // #endregion Get sample names in heatmap

    // #region Click the Share button and verify notification
    const shareableURL = await heatmapPage.clickShareButton();
    await heatmapPage.validateShareNotificationMessage();
    // #endregion Click the Share button and verify notification

    // #region Paste and Go clipboard URL in a new browser tab
    const newHeatmapPage = new HeatmapPage(await page.context().newPage());
    await newHeatmapPage.gotoHeatmap(shareableURL);
    // #endregion Paste and Go clipboard URL in a new browser tab

    // #region Validate the shared heatmap contains same samples as the original heatmap
    const sharedHeatmapSampleNames = await newHeatmapPage.getHeatmapSampleNames();
    expect(sharedHeatmapSampleNames).toEqual(originalHeatmapSampleNames);
  });
});
