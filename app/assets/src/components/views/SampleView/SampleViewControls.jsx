import React from "react";
import SvgSaver from "svgsaver";
import Nanobar from "nanobar";

import { deleteSample } from "~/api";
import { logAnalyticsEvent } from "~/api/analytics";
import PropTypes from "~/components/utils/propTypes";
import DownloadButtonDropdown from "~/components/ui/controls/dropdowns/DownloadButtonDropdown";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import {
  getDownloadDropdownOptions,
  getLinkInfoForDownloadOption,
} from "~/components/views/report/utils/download";

class SampleViewControls extends React.Component {
  downloadCSV = () => {
    const {
      backgroundId,
      pipelineRun,
      sample,
      reportVersion,
      minContigSize,
    } = this.props;

    let resParams = {};
    const stringer = require("querystring");

    // Set the right CSV background ID.
    // Should have background_id param in all cases now.
    if (backgroundId) resParams["background_id"] = backgroundId;

    // Set the right pipeline version.
    let v = pipelineRun && pipelineRun.pipeline_version;
    if (v) resParams["pipeline_version"] = v;

    // Set the min contig size.
    if (minContigSize) resParams["min_contig_size"] = minContigSize;

    // Need to know what version of the report table we're looking at and request accordingly
    let res =
      reportVersion === 1
        ? `/samples/${sample.id}/report_csv`
        : `/samples/${sample.id}/report_csv_v2`;
    res += `?${stringer.stringify(resParams)}`;
    location.href = res;
  };

  deleteSample = async () => {
    const { sample, project } = this.props;
    let nanobar = new Nanobar({
      id: "prog-bar",
      class: "prog-bar",
    });
    nanobar.go(30);
    await deleteSample(sample.id);
    nanobar.go(100);
    location.href = `/home?project_id=${project.id}`;
    logAnalyticsEvent("SampleViewControls_delete-sample-button_clicked", {
      sampleId: sample.id,
      sampleName: sample.name,
    });
  };

  handleDownload = option => {
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
          sampleId: this.props.sample.id,
          sampleName: this.props.sample.name,
        }
      );

    if (option === "download_csv") {
      this.downloadCSV();
      log();
      return;
    } else if (option == "taxon_svg") {
      // TODO (gdingle): filename per tree?
      new SvgSaver().asSvg(this.getTaxonTreeNode(), "taxon_tree.svg");
      log();
      return;
    } else if (option == "taxon_png") {
      // TODO (gdingle): filename per tree?
      new SvgSaver().asPng(this.getTaxonTreeNode(), "taxon_tree.png");
      log();
      return;
    }
    const linkInfo = getLinkInfoForDownloadOption(
      option,
      this.props.sample.id,
      this.props.pipelineRun
    );
    if (linkInfo) {
      window.open(linkInfo.path, linkInfo.newPage ? "_blank" : "_self");
      log();
    }
  };

  // TODO (gdingle): should we pass in a reference with React somehow?
  getTaxonTreeNode() {
    return document.getElementsByClassName("taxon-tree-vis")[0];
  }

  getImageDownloadOptions() {
    if (this.props.view === "tree") {
      return [
        { text: "Download Taxon Tree as SVG", value: "taxon_svg" },
        { text: "Download Taxon Tree as PNG", value: "taxon_png" },
      ];
    }
    return [];
  }

  render() {
    const { reportPresent, pipelineRun, editable } = this.props;

    if (reportPresent) {
      const downloadOptions = [
        {
          text: "Download Report Table (.csv)",
          value: "download_csv",
        },
        ...getDownloadDropdownOptions(pipelineRun),
        ...this.getImageDownloadOptions(),
      ];

      return (
        <DownloadButtonDropdown
          options={downloadOptions}
          onClick={this.handleDownload}
          direction="left"
        />
      );
    } else if (editable) {
      return <PrimaryButton onClick={this.deleteSample} text="Delete Sample" />;
    } else {
      return <div />;
    }
  }
}

SampleViewControls.propTypes = {
  backgroundId: PropTypes.number,
  reportPresent: PropTypes.bool,
  sample: PropTypes.Sample,
  project: PropTypes.Project,
  pipelineRun: PropTypes.PipelineRun,
  editable: PropTypes.bool,
  view: PropTypes.string,
  reportVersion: PropTypes.number,
  minContigSize: PropTypes.number,
};

export default SampleViewControls;
