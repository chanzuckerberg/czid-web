// TODO(tiago): this is a minimal port from Samples.jsx with just the necessary refactoring.
// Needs to be rethought, e.g.:
// - Removed reading the cookie for background id - what is the alternative?
// - Move axios calls to api
// - Replace some events (openUrl) with callbacks

import axios from "axios";
import { openUrl } from "~utils/links";

export default class ReportsDownloader {
  constructor({ projectId = "all", onDownloadFail = null, downloadOption }) {
    console.log(
      "ReportsDownloader:constructor",
      projectId,
      onDownloadFail,
      downloadOption
    );
    this.projectId = projectId;
    this.onDownloadFail = onDownloadFail;

    this.startReportGeneration({ downloadOption });
  }

  checkReportDownload = ({ statusAction, retrieveAction }) => {
    axios
      .get(`/projects/${this.projectId}/${statusAction}`)
      .then(res => {
        let downloadStatus = res.data.status_display;
        if (downloadStatus === "complete") {
          openUrl(`/projects/${this.projectId}/${retrieveAction}`);
        } else {
          this.scheduleCheckReportDownload(res, statusAction, retrieveAction);
        }
      })
      .catch(() => {
        () => {
          // eslint-disable-next-line no-console
          console.error("ReportsDownloader - Failed report download");
          this.onDownloadFail &&
            this.onDownloadFail({ projectId: this.projectId });
        };
      });
  };

  scheduleCheckReportDownload({ statusAction, retrieveAction }) {
    console.log("ReportsDownloader:constructor - schedule check");
    setTimeout(() => {
      this.checkReportDownload(statusAction, retrieveAction);
    }, 2000);
  }

  generateReport = ({ makeAction, statusAction, retrieveAction }) => {
    let url = `/projects/${this.projectId}/${makeAction}`;
    axios
      .get(url)
      .then(res => {
        this.checkReportDownload(res, statusAction, retrieveAction);
      })
      .catch(() => {});
  };

  startReportGeneration = ({ downloadOption }) => {
    console.log(downloadOption);
    switch (downloadOption) {
      case "samples_table":
        openUrl(`/projects/${this.projectId}/csv`);
        break;
      case "project_reports":
        this.generateReport({
          makeAction: "make_project_reports_csv",
          statusAction: "project_reports_csv_status",
          retrieveAction: "send_project_reports_csv"
        });
        break;
      case "host_gene_counts":
        this.generateReport({
          makeAction: "make_host_gene_counts",
          statusAction: "host_gene_counts_status",
          retrieveAction: "send_host_gene_counts"
        });
        break;
      default:
        // eslint-disable-next-line no-console
        console.error("ReportsDownloader - Download option not set!");
        break;
    }
  };
}
