import React from "react";
import PropTypes from "prop-types";
import { difference, isEmpty, union } from "lodash/fp";
import InfiniteTable from "../../visualizations/table/InfiniteTable";
import Label from "~ui/labels/Label";
import moment from "moment";
import { numberWithCommas } from "~/helpers/strings";
import cs from "./samples_view.scss";
import cx from "classnames";
import HeatmapIcon from "~ui/icons/HeatmapIcon";
import PhyloTreeIcon from "~ui/icons/PhyloTreeIcon";
import SamplePublicIcon from "~ui/icons/SamplePublicIcon";
import SamplePrivateIcon from "~ui/icons/SamplePrivateIcon";
import SaveIcon from "~ui/icons/SaveIcon";
import PhyloTreeCreationModal from "~/components/views/phylo_tree/PhyloTreeCreationModal";
import { DownloadIconDropdown } from "~ui/controls/dropdowns";
import ReportsDownloader from "./ReportsDownloader";
import CollectionModal from "./CollectionModal";

class SamplesView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      phyloTreeCreationModalOpen: false,
      selectedSampleIds: new Set()
    };

    this.columns = [
      {
        dataKey: "sample",
        flexGrow: 1,
        width: 350,
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
        label: "Passed Filters",
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
    const { selectedSampleIds } = this.state;
    let newSelected = new Set(selectedSampleIds);
    if (checked) {
      newSelected.add(value);
    } else {
      newSelected.delete(value);
    }
    this.setState({ selectedSampleIds: newSelected });
  };

  handleSelectAllRows = (value, checked) => {
    const { selectableIds } = this.props;
    const { selectedSampleIds } = this.state;
    let newSelected = new Set(
      checked
        ? union(selectedSampleIds, selectableIds)
        : difference(selectedSampleIds, selectableIds)
    );
    this.setState({ selectedSampleIds: newSelected });
  };

  isSelectAllChecked = () => {
    const { selectedSampleIds } = this.state;
    const { selectableIds } = this.props;

    return (
      !isEmpty(selectableIds) &&
      isEmpty(difference(selectableIds, Array.from(selectedSampleIds)))
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
    const { selectedSampleIds } = this.state;
    return (
      <a
        href={`/visualizations/heatmap?sampleIds=${Array.from(
          selectedSampleIds
        )}`}
      >
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
        iconClassName={cs.icon}
        options={downloadOptions}
        onClick={downloadOption => {
          new ReportsDownloader({
            projectId,
            downloadOption
          });
        }}
      />
    );
  };

  renderCollectionTrigger = () => {
    const { samples } = this.props;
    const { selectedSampleIds } = this.state;

    return (
      <CollectionModal
        trigger={<SaveIcon className={cs.icon} />}
        selectedSampleIds={selectedSampleIds}
        fetchedSamples={samples.filter(sample =>
          selectedSampleIds.has(sample.id)
        )}
      />
    );
  };

  renderToolbar = () => {
    const { selectedSampleIds } = this.state;
    return (
      <div className={cs.samplesToolbar}>
        <div className={cs.fluidBlank} />
        <div className={cs.counterContainer}>
          <Label
            circular
            className={cs.counter}
            text={`${selectedSampleIds.size}`}
          />
          <span className={cs.label}>Selected</span>
        </div>
        <div className={cs.separator} />
        <div className={cs.actions}>
          <div
            className={cx(
              cs.action,
              selectedSampleIds.size < 2 && cs.actionDisabled
            )}
          >
            {this.renderCollectionTrigger()}
          </div>
          <div
            className={cx(
              cs.action,
              selectedSampleIds.size < 2 && cs.actionDisabled
            )}
          >
            {this.renderHeatmapTrigger()}
          </div>
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
    const { activeColumns, onLoadRows, protectedColumns } = this.props;
    const { phyloTreeCreationModalOpen, selectedSampleIds } = this.state;

    // TODO(tiago): replace by automated cell height computing
    const rowHeight = 70;

    const selectAllChecked = this.isSelectAllChecked();
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
            protectedColumns={protectedColumns}
            rowClassName={cs.tableDataRow}
            selectableKey="id"
            selected={selectedSampleIds}
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
    "host",
    "collectionLocation",
    "nonHostReads",
    "qcPercent"
  ],
  protectedColumns: ["sample"]
};

SamplesView.propTypes = {
  activeColumns: PropTypes.arrayOf(PropTypes.string),
  onLoadRows: PropTypes.func.isRequired,
  projectId: PropTypes.number,
  protectedColumns: PropTypes.array,
  samples: PropTypes.array,
  selectableIds: PropTypes.array.isRequired
};

export default SamplesView;
