import { compact, map, sum, values } from "lodash/fp";
import {
  isPipelineFeatureAvailable,
  SHORT_READ_MNGS_MODERN_HOST_FILTERING_FEATURE,
} from "~/components/utils/pipeline_versions";
import { WORKFLOW_TABS } from "~/components/utils/workflows";
import { ReportMetadata } from "~/interface/reportMetaData";
import { CurrentTabSample, FilterSelections } from "~/interface/sampleView";
import { PipelineRun, Taxon } from "~/interface/shared";

const countReportRows = (filteredReportData: Taxon[], reportData: Taxon[]) => {
  let total = reportData.length;
  let filtered = filteredReportData.length;
  reportData.forEach(genusRow => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    total += genusRow.species.length;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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

// Meaning of `preSubsamplingCount` changed after release of Modern Host Filtering.
const subsamplingReadsMessagePreMhf = (
  preSubsamplingCount: number | undefined,
  postSubsamplingCount: number | undefined,
) => {
  return (
    preSubsamplingCount &&
    postSubsamplingCount &&
    preSubsamplingCount !== postSubsamplingCount &&
    `Report values are computed from ${postSubsamplingCount.toLocaleString()} unique reads subsampled \
          randomly from the ${preSubsamplingCount.toLocaleString()} reads passing host and quality filters. `
  );
};
const subsamplingReadsMessagePostMhf = (
  preSubsamplingCount: number | undefined,
  postSubsamplingCount: number | undefined,
) => {
  return (
    preSubsamplingCount &&
    postSubsamplingCount &&
    preSubsamplingCount !== postSubsamplingCount &&
    `Report values are computed from ${preSubsamplingCount.toLocaleString()} reads \
      (${postSubsamplingCount.toLocaleString()} unique reads) subsampled randomly from \
      the reads that passed host and quality filters.`
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
  pipelineRun: PipelineRun,
) => {
  if (currentTab === WORKFLOW_TABS.SHORT_READ_MNGS) {
    const {
      truncatedReadsCount,
      postSubsamplingCount,
      preSubsamplingCount,
      taxonWhitelisted,
    } = reportMetadata;
    // Language of subsampling message changes based on run being pre- or post-MHF.
    const isShortReadRunPostMhf =
      pipelineRun?.pipeline_version &&
      isPipelineFeatureAvailable(
        SHORT_READ_MNGS_MODERN_HOST_FILTERING_FEATURE,
        pipelineRun.pipeline_version,
      );
    const subsamplingMessage = isShortReadRunPostMhf
      ? subsamplingReadsMessagePostMhf(
          preSubsamplingCount,
          postSubsamplingCount,
        )
      : subsamplingReadsMessagePreMhf(
          preSubsamplingCount,
          postSubsamplingCount,
        );
    return compact([
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      truncatedMessage(truncatedReadsCount),
      subsamplingMessage,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      whitelistedMessage(taxonWhitelisted),
    ]).reduce((reportInfoMsg, msg) => {
      reportInfoMsg += msg;
      return reportInfoMsg;
    }, "");
  } else if (currentTab === WORKFLOW_TABS.LONG_READ_MNGS) {
    const { postSubsamplingCount, preSubsamplingCount, taxonWhitelisted } =
      reportMetadata;
    return compact([
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      subsamplingBasesMessage(preSubsamplingCount, postSubsamplingCount),
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
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
