import React from "react";
import SvgSaver from "svgsaver";

import PropTypes from "~/components/utils/propTypes";
import { deleteSample } from "~/api";
import DownloadButtonDropdown from "~/components/ui/controls/dropdowns/DownloadButtonDropdown";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import {
  getDownloadDropdownOptions,
  getLinkInfoForDownloadOption
} from "~/components/views/report/utils/download";

class Controls extends React.Component {
  downloadCSV = () => {
    const { reportPageParams, pipelineRun, sample } = this.props;

    let resParams = {};
    const stringer = require("querystring");

    // Set the right CSV background ID.
    // Should have background_id param in all cases now.
    const givenBackgroundId = reportPageParams.background_id;
    if (givenBackgroundId) resParams["background_id"] = givenBackgroundId;

    // Set the right pipeline version.
    let v = pipelineRun && pipelineRun.pipeline_version;
    if (v) resParams["pipeline_version"] = v;

    let res = `/samples/${sample.id}/report_csv`;
    res += `?${stringer.stringify(resParams)}`;
    location.href = res;
  };

  deleteSample = async () => {
    const { sample, project } = this.props;
    await deleteSample(sample.id);
    location.href = `/home?project_id=${project.id}`;
  };

  handleDownload = option => {
    if (option === "download_csv") {
      this.downloadCSV();
      return;
    } else if (option == "taxon_svg") {
      // TODO (gdingle): filename per tree?
      new SvgSaver().asSvg(this.getNode(), "taxon_tree.svg");
      return;
    } else if (option == "taxon_png") {
      // TODO (gdingle): filename per tree?
      new SvgSaver().asPng(this.getNode(), "taxon_tree.png");
      return;
    }
    const linkInfo = getLinkInfoForDownloadOption(
      option,
      this.props.sample.id,
      this.props.pipelineRun
    );
    if (linkInfo) {
      window.open(linkInfo.path, linkInfo.newPage ? "_blank" : "_self");
    }
  };

  // TODO (gdingle): should we pass in a reference with React somehow?
  getNode() {
    return document.getElementsByClassName("taxon-tree-vis")[0];
  }

  render() {
    const { reportPresent, pipelineRun, canEdit } = this.props;

    if (reportPresent) {
      const downloadOptions = [
        {
          text: "Download Report Table (.csv)",
          value: "download_csv"
        },
        ...getDownloadDropdownOptions(pipelineRun),
        { text: "Download Taxon Tree as SVG", value: "taxon_svg" },
        { text: "Download Taxon Tree as PNG", value: "taxon_png" }
      ];

      return (
        <DownloadButtonDropdown
          options={downloadOptions}
          onClick={this.handleDownload}
          direction="left"
        />
      );
    } else if (canEdit) {
      return <PrimaryButton onClick={this.deleteSample} text="Delete Sample" />;
    } else {
      return <div />;
    }
  }
}

Controls.propTypes = {
  reportPresent: PropTypes.bool,
  sample: PropTypes.Sample,
  project: PropTypes.Project,
  pipelineRun: PropTypes.PipelineRun,
  reportDetails: PropTypes.ReportDetails,
  reportPageParams: PropTypes.shape({
    pipeline_version: PropTypes.string,
    // TODO (gdingle): standardize on string or number
    background_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  canEdit: PropTypes.bool
};

export default Controls;
