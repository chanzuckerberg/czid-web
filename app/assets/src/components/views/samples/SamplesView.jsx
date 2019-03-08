import React from "react";
import PropTypes from "prop-types";
import SamplePublicIcon from "~ui/icons/SamplePublicIcon";
import SamplePrivateIcon from "~ui/icons/SamplePrivateIcon";
import InfiniteTable from "../../visualizations/table/InfiniteTable";
import moment from "moment";
import { numberWithCommas } from "~/helpers/strings";
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
        cellDataGetter: ({ dataKey, rowData }) =>
          this.formatNumberWithCommas(rowData[dataKey])
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
        cellDataGetter: ({ dataKey, rowData }) =>
          this.formatPercentage(rowData[dataKey])
      },
      {
        dataKey: "duplicateCompressionRatio",
        label: "DCR",
        flexGrow: 1,
        cellDataGetter: ({ dataKey, rowData }) =>
          this.formatPercentage(rowData[dataKey])
      },
      { dataKey: "host", flexGrow: 1 },
      { dataKey: "collectionLocation", label: "Location", flexGrow: 1 },
      {
        dataKey: "erccReads",
        label: "ERCC Reads",
        flexGrow: 1,
        cellDataGetter: ({ dataKey, rowData }) =>
          this.formatNumberWithCommas(rowData[dataKey])
      },
      { dataKey: "notes", flexGrow: 1 },
      { dataKey: "nucleotideType", label: "Nucleotide Type", flexGrow: 1 },
      { dataKey: "sampleType", label: "Sample Type", flexGrow: 1 },
      {
        dataKey: "subsampledFraction",
        label: "SubSampled Fraction",
        flexGrow: 1,
        cellDataGetter: ({ dataKey, rowData }) =>
          this.formatNumber(rowData[dataKey])
      },
      {
        dataKey: "totalRuntime",
        label: "Total Runtime",
        flexGrow: 1,
        cellDataGetter: ({ dataKey, rowData }) =>
          this.formatDuration(rowData[dataKey])
      }
    ];
  }

  formatDuration = runtime => {
    const h = Math.floor(runtime / 3600);
    const m = Math.floor((runtime % 3600) / 60);

    const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
    const mDisplay = m > 0 ? m + (m === 1 ? " minute" : " minutes") : "";
    return hDisplay + mDisplay;
  };

  formatNumberWithCommas = value => {
    return numberWithCommas(value);
  };

  formatNumber = value => {
    if (!value) return value;
    if (!isFinite(value)) return value;
    return value.toFixed(2);
  };

  formatPercentage = value => {
    if (!value) return value;
    return `${this.formatNumber(value)}%`;
  };

  renderNumberAndPercentage = ({ cellData: number }) => {
    return (
      <div className={cs.numberValueAndPercentage}>
        <div className={cs.value}>
          {number && numberWithCommas(number.value)}
        </div>
        <div className={cs.percentage}>
          {number && this.formatPercentage(number.percent)}
        </div>
      </div>
    );
  };

  renderSample = ({ cellData: sample }) => {
    return (
      <div className={cs.sample}>
        <div className={cs.publicAccess}>
          {sample &&
            (sample.publicAccess ? (
              <SamplePublicIcon className={cx(cs.icon, cs.iconPublic)} />
            ) : (
              <SamplePrivateIcon className={cx(cs.icon, cs.iconPrivate)} />
            ))}
        </div>
        <div className={cs.sampleRightPane}>
          {sample ? (
            <div className={cs.sampleNameAndStatus}>
              <div className={cs.sampleName}>{sample.name}</div>
              <div className={cx(cs.sampleStatus, cs[sample.status])}>
                {sample.status}
              </div>
            </div>
          ) : (
            <div className={cs.sampleNameAndStatus} />
          )}
          {sample ? (
            <div className={cs.sampleDetails}>
              <span className={cs.createdAt}>
                {moment(sample.createdAt).fromNow()}
              </span>|
              <span className={cs.user}>{sample.user}</span>|
              <span className={cs.project}>{sample.project}</span>
            </div>
          ) : (
            <div className={cs.sampleDetails} />
          )}
        </div>
      </div>
    );
  };

  reset = () => {
    this.infiniteTable.reset();
  };

  render() {
    const { activeColumns, onLoadRows } = this.props;
    // TODO(tiago): replace by automated cell height computing
    const rowHeight = 70;

    return (
      <div className={cs.container}>
        <div className={cs.table}>
          <InfiniteTable
            ref={infiniteTable => (this.infiniteTable = infiniteTable)}
            columns={this.columns}
            loadingClassName={cs.loading}
            onLoadRows={onLoadRows}
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
  onLoadRows: PropTypes.func.isRequired
};

export default SamplesView;
