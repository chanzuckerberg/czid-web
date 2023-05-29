import { compact, map, sum, values } from "lodash/fp";
import { TABS } from "~/components/views/SampleView/constants";
import ReportMetadata from "~/interface/reportMetaData";
import { CurrentTabSample, FilterSelections } from "~/interface/sampleView";
import { Taxon } from "~/interface/shared";

const countReportRows = (
  currentTab: CurrentTabSample,
  filteredReportData: Taxon[],
  reportData: Taxon[],
) => {
  let total = 0;
  let filtered = 0;
  if (currentTab === TABS.MERGED_NT_NR) {
    reportData.forEach(genusRow => {
      if (genusRow["merged_nt_nr"]) {
        total += 1;
        genusRow.species.forEach(speciesRow => {
          if (speciesRow["merged_nt_nr"]) {
            total += 1;
          }
        });
      }
    });
    filteredReportData.forEach(genusRow => {
      if (genusRow["merged_nt_nr"]) {
        filtered += 1;
        genusRow.filteredSpecies.forEach(speciesRow => {
          if (speciesRow["merged_nt_nr"]) {
            filtered += 1;
          }
        });
      }
    });
  } else {
    total = reportData.length;
    filtered = filteredReportData.length;
    reportData.forEach(genusRow => {
      total += genusRow.species.length;
      filtered += genusRow.filteredSpecies.length;
    });
  }

  return { total, filtered };
};

export const filteredMessage = (
  currentTab: CurrentTabSample,
  filteredReportData: Taxon[],
  reportData: Taxon[],
) => {
  const { total, filtered } = countReportRows(
    currentTab,
    filteredReportData,
    reportData,
  );

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
  if (currentTab === TABS.SHORT_READ_MNGS) {
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
  } else if (currentTab === TABS.LONG_READ_MNGS) {
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
    currentTab === TABS.SHORT_READ_MNGS
      ? thresholdsShortReads.length
      : thresholdsLongReads.length;

  let numFilters = taxa.length;
  numFilters += numThresholdsFilters;
  numFilters += annotations.length;
  numFilters += (categories.categories || []).length;
  numFilters += sum(map(v => v.length, values(categories.subcategories || {})));
  return numFilters;
};
