import { compact } from "lodash/fp";
import Nanobar from "nanobar";
import querystring from "querystring";
import React, { useContext } from "react";
import SvgSaver from "svgsaver";

import { deleteSample as deleteSampleAPI } from "~/api";
import { logAnalyticsEvent } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import DownloadButtonDropdown from "~/components/ui/controls/dropdowns/DownloadButtonDropdown";
import { logError } from "~/components/utils/logUtil";
import PropTypes from "~/components/utils/propTypes";
import {
  getDownloadDropdownOptions,
  getLinkInfoForDownloadOption,
} from "~/components/views/report/utils/download";
import { TABS } from "./constants";

const SampleViewControls = ({
  backgroundId,
  currentTab,
  deletable,
  editable,
  getDownloadReportTableWithAppliedFiltersLink,
  hasAppliedFilters,
  minContigReads,
  pipelineRun,
  project,
  reportPresent,
  sample,
  view,
}) => {
  const downloadCSV = () => {
    const resParams = {
      ...(backgroundId && { background_id: backgroundId }),
      ...(pipelineRun &&
        pipelineRun.pipeline_version && {
          pipeline_version: pipelineRun.pipeline_version,
        }),
      ...(minContigReads && { min_contig_reads: minContigReads }),
    };
    location.href = `/samples/${sample.id}/report_csv?${querystring.stringify(
      resParams
    )}`;
  };

  const deleteSample = async () => {
    let nanobar = new Nanobar({
      id: "prog-bar",
      class: "prog-bar",
    });
    nanobar.go(30);
    await deleteSampleAPI(sample.id);
    nanobar.go(100);
    location.href = `/home?project_id=${project.id}`;
    logAnalyticsEvent("SampleViewControls_delete-sample-button_clicked", {
      sampleId: sample.id,
      sampleName: sample.name,
    });
  };

  const handleDownload = option => {
    const log = () =>
      logAnalyticsEvent(
        // make names like:
        // SampleViewControls_download-download-non-host-contigs-summary-csv_clicked
        `SampleViewControls-download-${option
          .replace(/\W+/g, "-")
          .replace(/_/g, "-")
          .replace("-_", "_")
          .toLowerCase()}_clicked`,
        {
          sampleId: sample.id,
          sampleName: sample.name,
        }
      );

    switch (option) {
      case "download_csv":
        downloadCSV();
        break;
      case "download_csv_with_filters":
        // getDownloadReportTableWithAppliedFiltersLink() generates an anchor tag that returns a link to download the CSV.
        // Instead of programmatically clicking the anchor tag when it is clicked, it is passed directly into the DownloadButtonDropdown and downloaded upon click.
        // See: renderDownloadButtonDropdown()
        break;
      case "taxon_svg":
        new SvgSaver().asSvg(getTaxonTreeNode(), "taxon_tree.svg");
        break;
      case "taxon_png":
        new SvgSaver().asPng(getTaxonTreeNode(), "taxon_tree.png");
        break;
      default:
        logError({
          message:
            "SampleViewControls: Invalid option passed to handleDownload",
          details: { option },
        });
    }

    log();
    const linkInfo = getLinkInfoForDownloadOption(
      option,
      sample.id,
      pipelineRun
    );
    if (linkInfo) {
      window.open(linkInfo.path, linkInfo.newPage ? "_blank" : "_self");
      log();
    }
  };

  // TODO (gdingle): should we pass in a reference with React somehow?
  const getTaxonTreeNode = () => {
    return document.getElementsByClassName("taxon-tree-vis")[0];
  };

  const getImageDownloadOptions = () => {
    if (view === "tree") {
      return [
        { text: "Download Taxon Tree as SVG", value: "taxon_svg" },
        { text: "Download Taxon Tree as PNG", value: "taxon_png" },
      ];
    }
    return [];
  };

  const renderDownloadButtonDropdown = () => {
    const { allowedFeatures = [] } = useContext(UserContext) || {};

    const downloadOptions = compact([
      {
        text: "Download Report Table (.csv)",
        value: "download_csv",
        disabled: currentTab === TABS.MERGED_NT_NR,
      },
      allowedFeatures.includes("filtered_report_csv") && {
        text: getDownloadReportTableWithAppliedFiltersLink(),
        value: "download_csv_with_filters",
        disabled: !hasAppliedFilters,
      },
      ...getDownloadDropdownOptions(pipelineRun),
      ...getImageDownloadOptions(),
    ]);

    return (
      <DownloadButtonDropdown
        options={downloadOptions}
        onClick={handleDownload}
        direction="left"
      />
    );
  };

  if (reportPresent && pipelineRun) {
    return renderDownloadButtonDropdown();
  } else if (editable && deletable) {
    return <PrimaryButton onClick={deleteSample} text="Delete Sample" />;
  } else {
    return <div />;
  }
};

SampleViewControls.defaultProps = {
  deletable: false,
};

SampleViewControls.propTypes = {
  backgroundId: PropTypes.number,
  currentTab: PropTypes.string,
  deletable: PropTypes.bool,
  editable: PropTypes.bool,
  getDownloadReportTableWithAppliedFiltersLink: PropTypes.func,
  hasAppliedFilters: PropTypes.bool,
  minContigReads: PropTypes.number,
  reportPresent: PropTypes.bool,
  sample: PropTypes.Sample,
  pipelineRun: PropTypes.PipelineRun,
  project: PropTypes.Project,
  view: PropTypes.string,
};

export default SampleViewControls;
