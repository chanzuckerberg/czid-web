import React from "react";
import PropTypes from "prop-types";
import { difference, isEmpty, union } from "lodash/fp";
import SamplePublicIcon from "~ui/icons/SamplePublicIcon";
import SamplePrivateIcon from "~ui/icons/SamplePrivateIcon";
import InfiniteTable from "../../visualizations/table/InfiniteTable";
import Label from "~ui/labels/Label";
import moment from "moment";
import { numberWithCommas } from "~/helpers/strings";
import cs from "./samples_view.scss";
import cx from "classnames";
import HeatmapIcon from "~ui/icons/HeatmapIcon";
import PhyloTreeIcon from "~ui/icons/PhyloTreeIcon";
import PhyloTreeCreationModal from "~/components/views/phylo_tree/PhyloTreeCreationModal";
import { DownloadIconDropdown } from "~ui/controls/dropdowns";
import ReportsDownloader from "./ReportsDownloader";

class SamplesView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      phyloTreeCreationModalOpen: false,
      selected: new Set()
    };

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
        dataKey: "qcPercent",
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

  handleSelectRow = (value, checked) => {
    const { selected } = this.state;
    let newSelected = new Set(selected);
    if (checked) {
      newSelected.add(value);
    } else {
      newSelected.delete(value);
    }
    this.setState({ selected: newSelected });
  };

  handleSelectAllRows = (value, checked) => {
    const { selectableIds } = this.props;
    const { selected } = this.state;

    let newSelected = new Set(
      checked
        ? union(selected, selectableIds)
        : difference(selected, selectableIds)
    );
    this.setState({ selected: newSelected });
  };

  isSelectAllChecked = () => {
    const { selected } = this.state;
    const { selectableIds } = this.props;

    return (
      !isEmpty(selectableIds) &&
      isEmpty(difference(selectableIds, Array.from(selected)))
    );
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

  renderHeatmapTrigger = () => {
    const { selected } = this.state;
    return (
      <a href={`/visualizations/heatmap?sampleIds=${Array.from(selected)}`}>
        <HeatmapIcon className={cs.icon} />
      </a>
    );
  };

  renderDownloadTrigger = () => {
    const { projectId } = this.props;
    const downloadOptions = [{ text: "Sample Table", value: "samples_table" }];
    if (projectId) {
      downloadOptions.push({
        text: "Sample Reports",
        value: "project_reports"
      });
    }

    return (
      <DownloadIconDropdown
        options={downloadOptions}
        onClick={downloadOption => {
          console.log(downloadOption);
          new ReportsDownloader({
            projectId,
            downloadOption
          });
        }}
      />
    );
  };

  renderToolbar = () => {
    const { selected } = this.state;
    return (
      <div className={cs.samplesToolbar}>
        <div className={cs.fluidBlank} />
        <div className={cs.counterContainer}>
          <Label circular className={cs.counter} text={`${selected.size}`} />
          <span className={cs.label}>Selected</span>
        </div>
        <div className={cs.separator} />
        <div className={cs.actions}>
          <div className={cs.action}>{this.renderHeatmapTrigger()}</div>
          <div className={cs.action} onClick={this.handlePhyloModalOpen}>
            <PhyloTreeIcon className={cs.icon} />
          </div>
          <div className={cs.action}>{this.renderDownloadTrigger()}</div>
        </div>
      </div>
    );
  };

  handlePhyloModalOpen = () => {
    this.setState({ phyloTreeCreationModalOpen: true });
  };

  handlePhyloModalClose = () => {
    this.setState({ phyloTreeCreationModalOpen: false });
  };

  render() {
    const { activeColumns, onLoadRows } = this.props;
    const { phyloTreeCreationModalOpen, selected } = this.state;

    // TODO(tiago): replace by automated cell height computing
    const rowHeight = 70;

    const selectAllChecked = this.isSelectAllChecked();
    console.log("SamplesView:render - state=", this.state);
    return (
      <div className={cs.container}>
        {this.renderToolbar()}
        <div className={cs.table}>
          <InfiniteTable
            ref={infiniteTable => (this.infiniteTable = infiniteTable)}
            columns={this.columns}
            defaultRowHeight={rowHeight}
            initialActiveColumns={activeColumns}
            loadingClassName={cs.loading}
            onLoadRows={onLoadRows}
            onSelectAllRows={this.handleSelectAllRows}
            onSelectRow={this.handleSelectRow}
            selectableKey="id"
            selected={selected}
            selectAllChecked={selectAllChecked}
          />
        </div>
        {phyloTreeCreationModalOpen && (
          <PhyloTreeCreationModal
            // TODO(tiago): migrate phylo tree to use api (or read csrf from context) and remove this
            csrf={document.getElementsByName("csrf-token")[0].content}
            onClose={this.handlePhyloModalClose}
          />
        )}
      </div>
    );
  }
}

SamplesView.defaultProps = {
  activeColumns: [
    "sample",
    "totalReads",
    "nonHostReads",
    "qcPercent",
    "duplicateCompressionRatio",
    "collectionLocation",
    "host",
    "totalRuntime"
  ]
};

SamplesView.propTypes = {
  activeColumns: PropTypes.arrayOf(PropTypes.string),
  onLoadRows: PropTypes.func.isRequired,
  projectId: PropTypes.number,
  selectableIds: PropTypes.array.isRequired
};

export default SamplesView;
