import { Page, expect } from "@playwright/test";

const linkURLs = [
  "www.ncbi.nlm.nih.gov",
  "en.wikipedia.org",
  "www.google.com",
  "pubmed.ncbi.nlm.nih.gov",
];

export const testTaxonLinks = async (page: Page) => {
   // check links
   const links = await page.getByTestId("taxon-link").all();

   // for each link, click it and verify that it navigates to the correct page
   links.forEach((link: { click: () => void; }, i: string | number) => {
     link.click();
     expect(page.url()).toContain(linkURLs[i]);
   });
};

export const testHistogramAppears = async (page: Page, shouldHistogramExist: boolean) => {
  // check histogram does or does not exist
  if (shouldHistogramExist) {
    await expect(page.getByTestId("taxon-histogram")).toBeVisible();
  } else {
    await expect(page.getByTestId("taxon-histogram")).not.toBeVisible();
  }
};

export const testTaxonInfo = async (
  page: Page,
  options: {
    taxonName: string,
    taxonId: string,
    taxonDescription: string,
    parentDescription: string,
  }) => {
      // check that sidebar is visible
      await expect(page.getByTestId("details-sidebar")).toBeVisible();

      // check that name is correct
      await expect(page.getByTestId("taxon-name")).toContainText(options.taxonName);


      // check taxon id is correct
      const subtitle = page.getByTestId("taxon-id");
      await expect(subtitle).toContainText(options.taxonId);

      // check taxon description exists
      const descriptionText = "taxon-description";
      let description = page.getByTestId(descriptionText).first();
      await expect(description).toContainText(options.taxonDescription);

      // check that show more button adds more text
      await page.getByText("Show More").first().click();
      description = page.getByTestId(descriptionText).first();
      await expect(description).toContainText(
        "This article uses material from the Wikipedia",
      );

      // parent description should be visible
      const parentDescription = page.getByTestId(descriptionText).nth(1);
      await expect(parentDescription).toContainText(options.parentDescription);
};