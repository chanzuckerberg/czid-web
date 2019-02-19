import React from "react";
import PropTypes from "prop-types";
import { getSamples, getSampleDetails } from "~/api";
import { get, map, zip } from "lodash";
import GlobeIcon from "~ui/icons/GlobeIcon";
import LockIcon from "~ui/icons/LockIcon";
import InfiniteTable from "../../visualizations/table/InfiniteTable";
import moment from "moment";
import numberWithCommas from "~/helpers/strings";
import cs from "./samples_view.scss";
import cx from "classnames";

class SamplesView extends React.Component {
  constructor(props) {
    super(props);

    this.columns = [
      {
        dataKey: "sample",
        flexGrow: 1,
        width: 500,
        cellRenderer: this.renderSample,
        headerClassName: cs.sampleHeader
      },
      {
        dataKey: "totalReads",
        label: "Total Reads",
        flexGrow: 1,
        cellRenderer: this.renderNumberWithCommas
      },
      {
        dataKey: "nonHostReads",
        label: "Non Host Reads",
        flexGrow: 1,
        cellRenderer: this.renderNumberAndPercentage
      },
      {
        dataKey: "passedQC",
        label: "Passed QC",
        flexGrow: 1,
        cellRenderer: this.renderPercentage
      },
      {
        dataKey: "duplicateCompressionRatio",
        label: "DCR",
        flexGrow: 1,
        cellRenderer: this.renderPercentage
      },
      { dataKey: "host", flexGrow: 1 },
      { dataKey: "collectionLocation", label: "Location", flexGrow: 1 },
      { dataKey: "status", flexGrow: 1, cellRenderer: this.renderStatus },
      {
        dataKey: "erccReads",
        label: "ERCC Reads",
        flexGrow: 1,
        cellRenderer: this.renderNumberWithCommas
      },
      { dataKey: "notes", flexGrow: 1 },
      { dataKey: "nucleotideType", label: "Nucleotide Type", flexGrow: 1 },
      { dataKey: "sampleType", label: "Sample Type", flexGrow: 1 },
      {
        dataKey: "subsampledFraction",
        label: "SubSampled Fraction",
        flexGrow: 1,
        cellRenderer: this.renderNumber
      },
      {
        dataKey: "totalRuntime",
        label: "Total Runtime",
        flexGrow: 1,
        cellRenderer: this.renderDuration
      }
    ];
  }

  formatDuration(runtime) {
    runtime = Number(runtime);
    const h = Math.floor(runtime / 3600);
    const m = Math.floor((runtime % 3600) / 60);

    const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
    const mDisplay = m > 0 ? m + (m === 1 ? " minute" : " minutes") : "";
    return hDisplay + mDisplay;
  }

  renderDuration = ({ cellData: value }) => {
    return this.formatDuration(value);
  };

  renderNumberWithCommas({ cellData: value }) {
    return numberWithCommas(value);
  }

  formatNumber = value => {
    if (!value) return value;
    if (!isFinite(value)) return value;
    return value.toFixed(2);
  };

  renderNumber = ({ cellData: value }) => {
    return this.formatNumber(value);
  };

  formatPercentage = value => {
    if (!isFinite(value)) return value;
    return `${this.formatNumber(value)}%`;
  };

  renderPercentage = ({ cellData: value }) => {
    return this.formatPercentage(value);
  };

  renderNumberAndPercentage = ({ cellData: number }) => {
    if (!number) return;

    return (
      <div className={cs.numberValueAndPercentage}>
        <div className={cs.value}>{numberWithCommas(number.value)}</div>
        <div className={cs.percentage}>
          {this.formatPercentage(number.percent)}
        </div>
      </div>
    );
  };

  renderSample = ({ cellData: sample }) => {
    if (!sample) return;

    return (
      <div className={cs.sample}>
        <div className={cs.publicAccess}>
          {sample.publicAccess ? (
            <GlobeIcon className={cx(cs.icon, cs.iconGlobe)} />
          ) : (
            <LockIcon className={cx(cs.icon, cs.iconLock)} />
          )}
        </div>
        <div className={cs.sampleRightPane}>
          <div className={cs.sampleNameAndStatus}>
            <div className={cs.sampleName}>{sample.name}</div>
            <div className={cx(cs.sampleStatus, cs[sample.status])}>
              {sample.status}
            </div>
          </div>
          <div className={cs.sampleDetails}>
            <span className={cs.createdAt}>
              {moment(sample.createdAt).fromNow()}
            </span>|
            <span className={cs.user}>{sample.user}</span>|
            <span className={cs.project}>{sample.project}</span>
          </div>
        </div>
      </div>
    );
  };

  handleLoadRows = async ({ startIndex, stopIndex }) => {
    const { excludeLibrary, onlyLibrary } = this.props;

    const samples = await getSamples({
      excludeLibrary,
      onlyLibrary,
      limit: stopIndex - startIndex + 1,
      offset: startIndex
    });
    let sampleIds = map(samples, "id");
    const sampleDetails = await getSampleDetails({ sampleIds });
    const zipped = zip(samples, sampleDetails);
    console.log(zipped);
    const mapped = map(zipped, this.processRow);
    return mapped;
  };

  processRow = ([sampleInfo, sampleDetails]) => {
    const row = {
      sample: {
        name: sampleInfo.name,
        // TODO(tiago): replace by real value
        publicAccess: false,
        user: get(sampleDetails, "uploader.name"),
        project: get(sampleDetails, "derived_sample_output.project_name"),
        createdAt: sampleInfo.created_at,
        status: get(
          sampleDetails,
          "run_info.result_status_description"
        ).toLowerCase()
      },
      collectionLocation: get(sampleDetails, "metadata.collection_location"),
      duplicateCompressionRatio: get(
        sampleDetails,
        "derived_sample_output.summary_stats.compression_ratio"
      ),
      erccReads: get(
        sampleDetails,
        "derived_sample_output.pipeline_run.total_ercc_reads"
      ),
      host: get(sampleDetails, "db_sample.host_genome_name"),
      id: sampleInfo.id,
      nonHostReads: {
        value: get(
          sampleDetails,
          "derived_sample_output.summary_stats.adjusted_remaining_reads"
        ),
        percent: get(
          sampleDetails,
          "derived_sample_output.summary_stats.percent_remaining"
        )
      },
      notes: sampleInfo.sample_notes,
      nucleotideType: get(sampleDetails, "metadata.nucleotide_type"),
      passedQC: get(
        sampleDetails,
        "derived_sample_output.summary_stats.qc_percent"
      ),
      sampleType: get(sampleDetails, "metadata.sample_type"),
      totalRuntime: get(sampleDetails, "run_info.total_runtime"),
      subsampledFraction: get(
        sampleDetails,
        "derived_sample_output.pipeline_run.fraction_subsampled"
      ),
      totalReads: get(
        sampleDetails,
        "derived_sample_output.pipeline_run.total_reads"
      )
    };
    return row;
  };

  render() {
    const { activeColumns } = this.props;
    // TODO(tiago): replace by automated cell renderer
    const rowHeight = 70;

    return (
      <div className={cs.container}>
        <div className={cs.table}>
          <InfiniteTable
            columns={this.columns}
            onLoadRows={this.handleLoadRows}
            initialActiveColumns={activeColumns}
            defaultRowHeight={rowHeight}
          />
        </div>
      </div>
    );
  }
}

SamplesView.defaultProps = {
  activeColumns: [
    "sample",
    "totalReads",
    "nonHostReads",
    "passedQC",
    "duplicateCompressionRatio",
    "collectionLocation",
    "host",
    "totalRuntime"
  ]
};

SamplesView.propTypes = {
  activeColumns: PropTypes.arrayOf(PropTypes.string),
  excludeLibrary: PropTypes.bool,
  onlyLibrary: PropTypes.bool
};

export default SamplesView;
