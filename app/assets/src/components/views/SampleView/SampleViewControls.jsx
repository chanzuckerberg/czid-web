import React from "react";
import SvgSaver from "svgsaver";
import Nanobar from "nanobar";
import querystring from "querystring";

import { deleteSample as deleteSampleAPI } from "~/api";
import { logAnalyticsEvent } from "~/api/analytics";
import { TABS } from "./constants";
import PropTypes from "~/components/utils/propTypes";
import DownloadButtonDropdown from "~/components/ui/controls/dropdowns/DownloadButtonDropdown";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import {
  getDownloadDropdownOptions,
  getLinkInfoForDownloadOption,
} from "~/components/views/report/utils/download";

const SampleViewControls = ({
  backgroundId,
  currentTab,
  deletable,
  editable,
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

    if (option === "download_csv") {
      downloadCSV();
      log();
      return;
    } else if (option === "taxon_svg") {
      // TODO (gdingle): filename per tree?
      new SvgSaver().asSvg(getTaxonTreeNode(), "taxon_tree.svg");
      log();
      return;
    } else if (option === "taxon_png") {
      // TODO (gdingle): filename per tree?
      new SvgSaver().asPng(getTaxonTreeNode(), "taxon_tree.png");
      log();
      return;
    }
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
    const downloadOptions = [
      {
        text: "Download Report Table (.csv)",
        value: "download_csv",
        disabled: currentTab === TABS.MERGED_NT_NR,
      },
      ...getDownloadDropdownOptions(pipelineRun),
      ...getImageDownloadOptions(),
    ];

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
  minContigReads: PropTypes.number,
  reportPresent: PropTypes.bool,
  sample: PropTypes.Sample,
  pipelineRun: PropTypes.PipelineRun,
  project: PropTypes.Project,
  view: PropTypes.string,
};

export default SampleViewControls;
