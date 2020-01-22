import React from "react";
import SvgSaver from "svgsaver";
import Nanobar from "nanobar";
import querystring from "querystring";

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
    const { backgroundId, pipelineRun, sample, minContigSize } = this.props;

    const resParams = {
      ...(backgroundId && { background_id: backgroundId }),
      ...(pipelineRun &&
        pipelineRun.pipeline_version && {
          pipeline_version: pipelineRun.pipeline_version,
        }),
      ...(minContigSize && { min_contig_size: minContigSize }),
    };
    location.href = `/samples/${sample.id}/report_csv?${querystring.stringify(
      resParams
    )}`;
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
    const { deletable, editable, pipelineRun, reportPresent } = this.props;

    if (reportPresent && pipelineRun) {
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
    } else if (editable && deletable) {
      return <PrimaryButton onClick={this.deleteSample} text="Delete Sample" />;
    } else {
      return <div />;
    }
  }
}

SampleViewControls.defaultProps = {
  deletable: false,
};

SampleViewControls.propTypes = {
  backgroundId: PropTypes.number,
  deletable: PropTypes.bool,
  editable: PropTypes.bool,
  minContigSize: PropTypes.number,
  reportPresent: PropTypes.bool,
  sample: PropTypes.Sample,
  pipelineRun: PropTypes.PipelineRun,
  project: PropTypes.Project,
  view: PropTypes.string,
};

export default SampleViewControls;
