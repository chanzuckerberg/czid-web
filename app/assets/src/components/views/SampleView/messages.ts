import { compact } from "lodash/fp";
import { TABS } from "./constants";

const countReportRows = (currentTab, filteredReportData, reportData) => {
  let total = 0;
  let filtered = 0;
  if (currentTab === TABS.MERGED_NT_NR) {
    reportData.forEach((genusRow: $TSFixMe) => {
      if (genusRow["merged_nt_nr"]) {
        total += 1;
        genusRow.species.forEach((speciesRow: $TSFixMe) => {
          if (speciesRow["merged_nt_nr"]) {
            total += 1;
          }
        });
      }
    });
    filteredReportData.forEach((genusRow: $TSFixMe) => {
      if (genusRow["merged_nt_nr"]) {
        filtered += 1;
        genusRow.filteredSpecies.forEach((speciesRow: $TSFixMe) => {
          if (speciesRow["merged_nt_nr"]) {
            filtered += 1;
          }
        });
      }
    });
  } else {
    total = reportData.length;
    filtered = filteredReportData.length;
    reportData.forEach((genusRow: $TSFixMe) => {
      total += genusRow.species.length;
      filtered += genusRow.filteredSpecies.length;
    });
  }

  return { total, filtered };
};

export const filteredMessage = (currentTab, filteredReportData, reportData) => {
  const { total, filtered } = countReportRows(
    currentTab,
    filteredReportData,
    reportData,
  );

  return filtered !== total
    ? `${filtered} rows passing the above filters, out of ${total} total rows `
    : `${total} rows `;
};

export const truncatedMessage = truncatedReadsCount => {
  return (
    truncatedReadsCount &&
    `Initial input was truncated to ${truncatedReadsCount} reads. `
  );
};

export const subsamplingMessage = (
  preSubsamplingCount,
  postSubsamplingCount,
  readsOrBases,
) => {
  return (
    preSubsamplingCount &&
    postSubsamplingCount &&
    preSubsamplingCount !== postSubsamplingCount &&
    `Report values are computed from ${postSubsamplingCount} unique ${readsOrBases} subsampled \
          randomly from the ${preSubsamplingCount} ${readsOrBases} passing host and quality filters. `
  );
};

export const whitelistedMessage = taxonWhitelisted => {
  return (
    taxonWhitelisted &&
    `Report was processed with a whitelist filter of respiratory pathogens. `
  );
};

export const renderReportInfo = (currentTab, reportMetadata) => {
  if (currentTab === TABS.SHORT_READ_MNGS) {
    const {
      truncatedReadsCount,
      postSubsamplingCount,
      preSubsamplingCount,
      taxonWhitelisted,
    } = reportMetadata;
    return compact([
      truncatedMessage(truncatedReadsCount),
      subsamplingMessage(preSubsamplingCount, postSubsamplingCount, "reads"),
      whitelistedMessage(taxonWhitelisted),
    ]).reduce((reportInfoMsg, msg) => {
      reportInfoMsg += msg;
      return reportInfoMsg;
    }, "");
  } else if (currentTab === TABS.LONG_READ_MNGS) {
    const {
      postSubsamplingCount,
      preSubsamplingCount,
      taxonWhitelisted,
    } = reportMetadata;
    return compact([
      subsamplingMessage(preSubsamplingCount, postSubsamplingCount, "bases"),
      whitelistedMessage(taxonWhitelisted),
    ]).reduce((reportInfoMsg, msg) => {
      reportInfoMsg += msg;
      return reportInfoMsg;
    }, "");
  }
};
