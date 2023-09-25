import { compact, map, sum, values } from "lodash/fp";
import { WORKFLOW_TABS } from "~/components/utils/workflows";
import ReportMetadata from "~/interface/reportMetaData";
import { CurrentTabSample, FilterSelections } from "~/interface/sampleView";
import { Taxon } from "~/interface/shared";

const countReportRows = (filteredReportData: Taxon[], reportData: Taxon[]) => {
  let total = reportData.length;
  let filtered = filteredReportData.length;
  reportData.forEach(genusRow => {
    total += genusRow.species.length;
    filtered += genusRow.filteredSpecies.length;
  });

  return { total, filtered };
};

export const filteredMessage = (
  filteredReportData: Taxon[],
  reportData: Taxon[],
) => {
  const { total, filtered } = countReportRows(filteredReportData, reportData);

  return filtered !== total
    ? `${filtered} rows passing the above filters, out of ${total} total rows `
    : `${total} rows `;
};

const truncatedMessage = (truncatedReadsCount: number) => {
  return (
    truncatedReadsCount &&
    `Initial input was truncated to ${truncatedReadsCount} reads. `
  );
};

const subsamplingReadsMessage = (
  preSubsamplingCount: number,
  postSubsamplingCount: number,
) => {
  return (
    preSubsamplingCount &&
    postSubsamplingCount &&
    preSubsamplingCount !== postSubsamplingCount &&
    `Report values are computed from ${postSubsamplingCount.toLocaleString()} unique reads subsampled \
          randomly from the ${preSubsamplingCount.toLocaleString()} reads passing host and quality filters. `
  );
};

const subsamplingBasesMessage = (
  preSubsamplingCount: number,
  postSubsamplingCount: number,
) => {
  return (
    preSubsamplingCount &&
    postSubsamplingCount &&
    preSubsamplingCount !== postSubsamplingCount &&
    `Report values are computed from ${postSubsamplingCount.toLocaleString()} bases subsampled \
          from the ${preSubsamplingCount.toLocaleString()} bases passing host and quality filters. `
  );
};

const whitelistedMessage = (taxonWhitelisted: boolean) => {
  return (
    taxonWhitelisted &&
    `Report was processed with a whitelist filter of respiratory pathogens. `
  );
};

export const renderReportInfo = (
  currentTab: CurrentTabSample,
  reportMetadata: ReportMetadata,
) => {
  if (currentTab === WORKFLOW_TABS.SHORT_READ_MNGS) {
    const {
      truncatedReadsCount,
      postSubsamplingCount,
      preSubsamplingCount,
      taxonWhitelisted,
    } = reportMetadata;
    return compact([
      truncatedMessage(truncatedReadsCount),
      subsamplingReadsMessage(preSubsamplingCount, postSubsamplingCount),
      whitelistedMessage(taxonWhitelisted),
    ]).reduce((reportInfoMsg, msg) => {
      reportInfoMsg += msg;
      return reportInfoMsg;
    }, "");
  } else if (currentTab === WORKFLOW_TABS.LONG_READ_MNGS) {
    const { postSubsamplingCount, preSubsamplingCount, taxonWhitelisted } =
      reportMetadata;
    return compact([
      subsamplingBasesMessage(preSubsamplingCount, postSubsamplingCount),
      whitelistedMessage(taxonWhitelisted),
    ]).reduce((reportInfoMsg, msg) => {
      reportInfoMsg += msg;
      return reportInfoMsg;
    }, "");
  }
};

export const countFilters = (
  currentTab: CurrentTabSample,
  selectedOptions: FilterSelections,
) => {
  const {
    categories,
    thresholdsShortReads,
    thresholdsLongReads,
    taxa,
    annotations,
  } = selectedOptions;

  const numThresholdsFilters =
    currentTab === WORKFLOW_TABS.SHORT_READ_MNGS
      ? thresholdsShortReads.length
      : thresholdsLongReads.length;

  let numFilters = taxa.length;
  numFilters += numThresholdsFilters;
  numFilters += annotations.length;
  numFilters += (categories.categories || []).length;
  numFilters += sum(map(v => v.length, values(categories.subcategories || {})));
  return numFilters;
};
