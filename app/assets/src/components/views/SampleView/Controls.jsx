import React from "react";
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

  render() {
    const { reportPresent, pipelineRun, sample } = this.props;

    if (reportPresent) {
      const downloadOptions = [
        {
          text: "Download Report Table (.csv)",
          value: "download_csv"
        },
        ...getDownloadDropdownOptions(pipelineRun)
      ];

      return (
        <DownloadButtonDropdown
          options={downloadOptions}
          onClick={this.handleDownload}
          direction="left"
        />
      );
    } else if (sample.status === "created" || !reportPresent) {
      return <PrimaryButton onClick={this.deleteSample} text="Delete Sample" />;
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
    background_id: PropTypes.string
  })
};

export default Controls;
