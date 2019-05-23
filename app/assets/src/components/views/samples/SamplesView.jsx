import React from "react";
import PropTypes from "prop-types";
import { difference, find, isEmpty, union } from "lodash/fp";
import cx from "classnames";

import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import InfiniteTable from "~/components/visualizations/table/InfiniteTable";
import Label from "~ui/labels/Label";
import { numberWithCommas } from "~/helpers/strings";
import HeatmapIcon from "~ui/icons/HeatmapIcon";
import PhyloTreeIcon from "~ui/icons/PhyloTreeIcon";
import SamplePublicIcon from "~ui/icons/SamplePublicIcon";
import SamplePrivateIcon from "~ui/icons/SamplePrivateIcon";
import SaveIcon from "~ui/icons/SaveIcon";
import PhyloTreeCreationModal from "~/components/views/phylo_tree/PhyloTreeCreationModal";
import { DownloadIconDropdown } from "~ui/controls/dropdowns";
import BasicPopup from "~/components/BasicPopup";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import { Menu, MenuItem } from "~ui/controls/Menu";
import BaseMap from "~/components/views/discovery/mapping/BaseMap";

import ReportsDownloader from "./ReportsDownloader";
import CollectionModal from "./CollectionModal";
import cs from "./samples_view.scss";

const DISPLAYS = ["table", "map"];

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
        dataKey: "createdAt",
        label: "Uploaded On",
        width: 120,
        className: cs.basicCell,
        cellRenderer: TableRenderers.renderDateWithElapsed
      },
      {
        dataKey: "host",
        flexGrow: 1,
        className: cs.basicCell
      },
      {
        dataKey: "collectionLocation",
        label: "Location",
        flexGrow: 1,
        className: cs.basicCell
      },
      {
        dataKey: "totalReads",
        label: "Total Reads",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          this.formatNumberWithCommas(rowData[dataKey])
      },
      {
        dataKey: "nonHostReads",
        label: "Passed Filters",
        flexGrow: 1,
        className: cs.basicCell,
        cellRenderer: this.renderNumberAndPercentage
      },
      {
        dataKey: "qcPercent",
        label: "Passed QC",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          this.formatPercentage(rowData[dataKey])
      },
      {
        dataKey: "duplicateCompressionRatio",
        label: "DCR",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          this.formatPercentage(rowData[dataKey])
      },
      {
        dataKey: "erccReads",
        label: "ERCC Reads",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          this.formatNumberWithCommas(rowData[dataKey])
      },
      {
        dataKey: "notes",
        flexGrow: 1,
        className: cs.basicCell
      },
      {
        dataKey: "nucleotideType",
        label: "Nucleotide Type",
        flexGrow: 1,
        className: cs.basicCell
      },
      {
        dataKey: "sampleType",
        label: "Sample Type",
        flexGrow: 1,
        className: cs.basicCell
      },
      {
        dataKey: "subsampledFraction",
        label: "SubSampled Fraction",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          this.formatNumber(rowData[dataKey])
      },
      {
        dataKey: "totalRuntime",
        label: "Total Runtime",
        flexGrow: 1,
        className: cs.basicCell,
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
    logAnalyticsEvent("SamplesView_row_selected", {
      selectedSampleIds: newSelected
    });
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
              <BasicPopup
                trigger={<div className={cs.sampleName}>{sample.name}</div>}
                content={sample.name}
              />
              <div className={cx(cs.sampleStatus, cs[sample.status])}>
                {sample.status}
              </div>
            </div>
          ) : (
            <div className={cs.sampleNameAndStatus} />
          )}
          {sample ? (
            <div className={cs.sampleDetails}>
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
    const log = () =>
      logAnalyticsEvent("SamplesView_heatmap-icon_clicked", {
        selectedSampleIds: selectedSampleIds.length
      });
    return selectedSampleIds.size < 2 ? (
      <HeatmapIcon className={cx(cs.icon, cs.disabled, cs.heatmap)} />
    ) : (
      <a
        onClick={log}
        href={`/visualizations/heatmap?sampleIds=${Array.from(
          selectedSampleIds
        )}`}
      >
        <HeatmapIcon className={cx(cs.icon, cs.heatmap)} />
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
        iconClassName={cx(cs.icon, cs.download)}
        options={downloadOptions}
        onClick={downloadOption => {
          new ReportsDownloader({
            projectId,
            downloadOption
          });
          logAnalyticsEvent("SamplesView_download-dropdown-option_clicked", {
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

    return selectedSampleIds.size < 2 ? (
      <SaveIcon
        className={cx(cs.icon, cs.disabled, cs.save)}
        popupText={"Save a Collection"}
      />
    ) : (
      <CollectionModal
        trigger={
          <SaveIcon
            className={cx(cs.icon, cs.save)}
            popupText={"Save a Collection"}
          />
        }
        selectedSampleIds={selectedSampleIds}
        fetchedSamples={samples.filter(sample =>
          selectedSampleIds.has(sample.id)
        )}
      />
    );
  };

  renderToolbar = () => {
    const { allowedFeatures } = this.props;
    const { selectedSampleIds } = this.state;
    return (
      <div className={cs.samplesToolbar}>
        {allowedFeatures &&
          allowedFeatures.includes("maps") &&
          this.renderDisplaySwitcher()}
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
          <div className={cs.action}>{this.renderCollectionTrigger()}</div>
          <div className={cs.action}>{this.renderHeatmapTrigger()}</div>
          <div
            className={cs.action}
            onClick={withAnalytics(
              this.handlePhyloModalOpen,
              "SamplesView_phylo-tree-modal-open_clicked"
            )}
          >
            <PhyloTreeIcon className={cs.icon} />
          </div>
          <div className={cs.action}>{this.renderDownloadTrigger()}</div>
        </div>
      </div>
    );
  };

  renderTable = () => {
    const { activeColumns, onLoadRows, protectedColumns } = this.props;
    const { selectedSampleIds } = this.state;

    // TODO(tiago): replace by automated cell height computing
    const rowHeight = 66;
    const selectAllChecked = this.isSelectAllChecked();
    return (
      <div className={cs.table}>
        <InfiniteTable
          ref={infiniteTable => (this.infiniteTable = infiniteTable)}
          columns={this.columns}
          defaultRowHeight={rowHeight}
          initialActiveColumns={activeColumns}
          loadingClassName={cs.loading}
          onLoadRows={onLoadRows}
          onSelectAllRows={withAnalytics(
            this.handleSelectAllRows,
            "SamplesView_select-all-rows_clicked"
          )}
          onSelectRow={this.handleSelectRow}
          onRowClick={this.handleRowClick}
          protectedColumns={protectedColumns}
          rowClassName={cs.tableDataRow}
          selectableKey="id"
          selected={selectedSampleIds}
          selectAllChecked={selectAllChecked}
        />
      </div>
    );
  };

  renderDisplaySwitcher = () => {
    const { currentDisplay, onDisplaySwitch } = this.props;
    return (
      <div className={cs.displaySwitcher}>
        <Menu compact className={cs.switcherMenu}>
          {DISPLAYS.map(display => (
            <MenuItem
              className={cs.menuItem}
              active={currentDisplay === display}
              onClick={withAnalytics(
                () => onDisplaySwitch(display),
                `SamplesView_${display}-switch_clicked`
              )}
            >
              <i
                className={cx(
                  "fa",
                  display === "map" ? "fa-globe" : "fa-list-ul",
                  cs.icon
                )}
              />
            </MenuItem>
          ))}
        </Menu>
      </div>
    );
  };

  renderMap = () => {
    const { mapTilerKey } = this.props;
    return (
      <div className={cs.map}>
        <BaseMap mapTilerKey={mapTilerKey} />
      </div>
    );
  };

  handlePhyloModalOpen = () => {
    this.setState({ phyloTreeCreationModalOpen: true });
  };

  handlePhyloModalClose = () => {
    this.setState({ phyloTreeCreationModalOpen: false });
  };

  handleRowClick = ({ event, rowData }) => {
    const { onSampleSelected, samples } = this.props;
    const sample = find({ id: rowData.id }, samples);
    onSampleSelected && onSampleSelected({ sample, currentEvent: event });
    logAnalyticsEvent("SamplesView_row_clicked", {
      sampleId: sample.id,
      sampleName: sample.name
    });
  };

  render() {
    const { currentDisplay } = this.props;
    const { phyloTreeCreationModalOpen } = this.state;
    return (
      <div className={cs.container}>
        {this.renderToolbar()}
        {currentDisplay === "table" ? this.renderTable() : this.renderMap()}
        {phyloTreeCreationModalOpen && (
          <PhyloTreeCreationModal
            // TODO(tiago): migrate phylo tree to use api (or read csrf from context) and remove this
            csrf={document.getElementsByName("csrf-token")[0].content}
            onClose={withAnalytics(
              this.handlePhyloModalClose,
              "SamplesView_phylo-tree-modal_closed"
            )}
          />
        )}
      </div>
    );
  }
}

SamplesView.defaultProps = {
  activeColumns: [
    "sample",
    "createdAt",
    "host",
    "collectionLocation",
    "nonHostReads",
    "qcPercent"
  ],
  protectedColumns: ["sample"],
  currentDisplay: "table"
};

SamplesView.propTypes = {
  activeColumns: PropTypes.arrayOf(PropTypes.string),
  onLoadRows: PropTypes.func.isRequired,
  projectId: PropTypes.number,
  protectedColumns: PropTypes.array,
  samples: PropTypes.array,
  selectableIds: PropTypes.array.isRequired,
  onSampleSelected: PropTypes.func,
  currentDisplay: PropTypes.string.isRequired,
  allowedFeatures: PropTypes.arrayOf(PropTypes.string),
  onDisplaySwitch: PropTypes.func,
  mapTilerKey: PropTypes.string
};

export default SamplesView;
