import { WORKFLOWS } from "@e2e/constants/common";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";

/*
 * Viral CG (WGS) - Sample report
 */
test.describe("Viral CG (WGS) - Sample report: Functional: P-1", () => {
  test("SNo 26: Tooltips", async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.WGS}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with WGS samples
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 2. Pick a project with WGS samples

    // #region 3. Open a CG sample report
    const sampleName = (await projectPage.selectCompletedSamples(1))[0];
    await projectPage.clickSample(sampleName);
    // #endregion 3. Open a CG sample report

    // #region 4. Hover over ""Is my consensus genome complete?"" info icon and table titles
    const samplesPage = new SamplesPage(page);
    await samplesPage.clickConsensusGenomeTab();

    const expectedMyConsensusGenomeCompleteTooltip =
      "These metrics help determine the quality of the reference accession. Learn more.";
    const isMyConsensusGenomeCompleteTooltip =
      await samplesPage.getIsMyConsensusGenomeCompleteTooltip();
    expect(isMyConsensusGenomeCompleteTooltip).toEqual(
      expectedMyConsensusGenomeCompleteTooltip,
    );

    // """Is my consensus genome complete?"" information tooltips displayed for:
    // - Taxon / Mapped Reads / GC Content / SNPs / %id / Informative Nucleotides / %Genome Called / Missing Bases / Ambiguous Bases
    const expectedConsensusGenomeTooltips = {
      Taxon: "Taxon",
      "Mapped Reads":
        "Mapped Reads:Number of reads aligning to the reference accession.",
      "GC Content":
        "GC Content:The percentage of bases that are either guanine (G) or cytosine (C).",
      SNPs: "SNPs:The number of single nucleotide polymorphisms (SNPs) - locations where the nucleotide of the consensus genome does not match the base of the reference accession",
      "%id":
        "%id:The percentage of nucleotides of the consensus genome that are identical to those in the reference accession.",
      "Informative Nucleotides":
        "Informative Nucleotides:The number of nucleotides that are A,T,C, or G. Nucleotides are only called if 10 or more reads aligned.",
      "%Genome Called":
        "% Genome Called:The percentage of the genome meeting thresholds for calling consensus bases.",
      "Missing Bases":
        "Missing Bases:The number of bases that are N's because they could not be called.",
      "Ambiguous Bases":
        "Ambiguous Bases:The number of bases that could not be specified due to multiple observed alleles of single-base polymorphisms.",
    };
    let i = 0;
    for (const header of Object.keys(expectedConsensusGenomeTooltips)) {
      const headerTooptip =
        await samplesPage.getOverIsMyConsensusGenomeCompleteHeaderTooltip(i);
      expect(headerTooptip).toEqual(expectedConsensusGenomeTooltips[header]);
      i++;
    }
    // #endregion 4. Hover over ""Is my consensus genome complete?"" info icon and table titles

    // #region 5. Hover over ""How good is the coverage?"" info icon and table titles
    // ""How good is the coverage?"" information tooltips displayed for:
    const expectedHowGoodIsTheCoverageTooltip =
      "These metrics and chart help determine the coverage of the reference accession. Learn more.";
    const howGoodIsTheCoverageTooltip =
      await samplesPage.getHowGoodIsTheCoverageTooltip();
    expect(howGoodIsTheCoverageTooltip).toEqual(
      expectedHowGoodIsTheCoverageTooltip,
    );

    // Custom Reference / Reference Length / Coverage Depth / Coverage Breadth
    const expectedCoverageTooltips = {
      "Custom Reference": "The custom reference you uploaded with this sample.",
      "Reference Length": "Length in base pairs of the reference accession.",
      "Coverage Depth":
        "The average read depth of aligned contigs and reads over the length of the accession.",
      "Coverage Breadth":
        "The percentage of the accession that is covered by at least one read or contig.",
    };
    i = 0;
    for (const header of Object.keys(expectedCoverageTooltips)) {
      const headerTooptip = await samplesPage.getHowGoodIsTheCoverageHeaders(i);
      expect(headerTooptip).toEqual(expectedCoverageTooltips[header]);
      i++;
    }
    // #endregion 5. Hover over ""How good is the coverage?"" info icon and table titles

    // #region 6. Hover over ""How good is the coverage?"" histogram bars
    await samplesPage.hoverOverCoverageVizHistogram();

    // ""How good is the coverage?"" histogram Coverage tooltip displayed with:
    // Base Pair Range / Coverage Depth / Coverage Breadth"
    const expectedHoverBasePairRange = /[0-9]+–[0-9]+/;
    const actualHoverBasePairRange = await samplesPage.getHoverBasePairRange();
    expect(actualHoverBasePairRange).toMatch(expectedHoverBasePairRange);

    const expectedHoverCoverageDepth = /\d+\.\d+x/;
    const actualHoverCoverageDepth = await samplesPage.getHoverCoverageDepth();
    expect(actualHoverCoverageDepth).toMatch(expectedHoverCoverageDepth);

    const expectedHoverCoverageBreadth = /\d{1,3}\.\d{1}%/;
    const actualHoverCoverageBreadth =
      await samplesPage.getHoverCoverageBreadth();
    expect(actualHoverCoverageBreadth).toMatch(expectedHoverCoverageBreadth);
    // #endregion 6. Hover over ""How good is the coverage?"" histogram bars
  });
});

test.describe("Viral CG (WGS) - Sample report: Functional: P-2", () => {
  test("SNo 24: Share link", async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.WGS}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with WGS samples
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 2. Pick a project with WGS samples

    // #region 3. Open a CG sample report
    const sampleName = (await projectPage.selectCompletedSamples(1))[0];
    await projectPage.clickSample(sampleName);
    // #endregion 3. Open a CG sample report

    // #region 4. Click on Share button
    const samplesPage = new SamplesPage(page);
    const sample = (await samplesPage.getSamples(project.name, sampleName))[0];

    const clipboardText = await samplesPage.clickShareButton();
    // #endregion 4. Click on Share button

    // #region 5. Open a new browser tab and Paste-Go the URL in clipboard
    const sharedMessage = await samplesPage.getShareMessage();

    // - URL Sample report copied in clipboard
    let isValidUrl = false;
    try {
      // eslint-disable-next-line no-new
      new URL(clipboardText);
      isValidUrl = true;
    } finally {
      expect(isValidUrl).toBeTruthy();
    }

    // - Pop-up displayed - "A shareable URL was copied to your clipboard!"
    const expectedMessage = "A shareable URL was copied to your clipboard!";
    expect(sharedMessage).toEqual(expectedMessage);

    // - URL opens sample report in new tab
    await samplesPage.page.goto(clipboardText, { timeout: 30 * 1000 });

    const newUrl = samplesPage.page.url();
    expect(newUrl).toContain(
      `${process.env.BASEURL}/samples/${sample.id}?currentTab=Consensus%20Genome`,
    );
    // #endregion 5. Open a new browser tab and Paste-Go the URL in clipboard
  });

  test("SNo 25: Learn more link (3)", async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.WGS}`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with WGS samples
    await projectPage.navigateToSamples(project.id, WORKFLOWS.WGS);
    // #endregion 2. Pick a project with WGS samples

    // #region 3. Open a CG sample report
    const sampleName = (await projectPage.selectCompletedSamples(1))[0];
    await projectPage.clickSample(sampleName);

    const samplesPage = new SamplesPage(page);
    await samplesPage.clickConsensusGenomeTab();
    // #endregion 3. Open a CG sample report

    // #region 4. Hover over Info icon next to ""Is my consensus genome complete?"" title
    await samplesPage.hoverOverIsMyConsensusGenomeCompleteTooltip();
    // #endregion 4. Hover over Info icon next to ""Is my consensus genome complete?"" title

    // #region 5. Click on Learn more link
    let articlesPage = await samplesPage.clickTooltipLearnMore();

    const expectedArticleUrl =
      "https://chanzuckerberg.zendesk.com/hc/en-us/articles/13619776085780-Consensus-Genome-Quality-Checks";
    // - ""Learn more"" and ""Learn more about consensus genomes"" links open in new browser tab
    // - Consensus Genome Quality Checks article page is displayed
    // (https://chanzuckerberg.zendesk.com/hc/en-us/articles/13619776085780-Consensus-Genome-Quality-Checks)"
    let articleUrl = await articlesPage.url();
    expect(articleUrl).toEqual(expectedArticleUrl);

    await articlesPage.close();
    // #endregion 5. Click on Learn more link

    // #region 6. Hover over Info icon next to ""How good is the coverage?"" title
    await samplesPage.hoverOverHowGoodIsTheCoverageTooltip();
    // #endregion 6. Hover over Info icon next to ""How good is the coverage?"" title

    // #region 7. Click on Learn more link
    articlesPage = await samplesPage.clickTooltipLearnMore();

    // - ""Learn more"" and ""Learn more about consensus genomes"" links open in new browser tab
    // - Consensus Genome Quality Checks article page is displayed
    // (https://chanzuckerberg.zendesk.com/hc/en-us/articles/13619776085780-Consensus-Genome-Quality-Checks)"
    articleUrl = await articlesPage.url();
    expect(articleUrl).toEqual(expectedArticleUrl);

    await articlesPage.close();
    // #endregion 7. Click on Learn more link

    // #region 8. Click on Learn more about consensus genomes link
    articlesPage = await samplesPage.clickLearnMoreAboutConsensusGenomesLink();

    // - ""Learn more"" and ""Learn more about consensus genomes"" links open in new browser tab
    // - Consensus Genome Quality Checks article page is displayed
    // (https://chanzuckerberg.zendesk.com/hc/en-us/articles/13619776085780-Consensus-Genome-Quality-Checks)"
    articleUrl = await articlesPage.url();
    expect(articleUrl).toEqual(expectedArticleUrl);

    await articlesPage.close();
    // #endregion 8. Click on Learn more about consensus genomes link
  });
});
