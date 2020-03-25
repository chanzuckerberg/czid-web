import React from "react";
import BasicPopup from "~/components/BasicPopup";

import { logAnalyticsEvent } from "~/api/analytics";

import PropTypes from "../../../utils/propTypes";
import DetailCells from "./DetailCells";
import { REPORT_TABLE_COLUMNS } from "./constants";

export default class ReportTable extends React.Component {
  handleTaxonClick = taxonSidebarData => {
    const { taxInfo, backgroundData, taxonName } = taxonSidebarData;
    this.props.onTaxonClick({
      background: backgroundData,
      parentTaxonId: taxInfo.tax_level === 1 ? taxInfo.genus_taxid : undefined,
      taxonId: taxInfo.tax_id,
      taxonName,
      taxonValues: {
        NT: taxInfo.NT,
        NR: taxInfo.NR,
      },
    });
  };

  render() {
    const {
      taxons,
      taxonRowRefs,
      renderName,
      renderNumber,
      renderColumnHeader,
      getRowClass,
      reportDetails,
      backgroundData,
      expandTable,
      collapseTable,
      countType,
      setCountType,
      showAssemblyColumns,
    } = this.props;

    return (
      <div className="reports-main">
        <table id="report-table" className="report-table">
          <thead>
            <tr className="report-header">
              <th>
                <span className="table-arrow">
                  <i className="fa fa-angle-right" onClick={expandTable} />
                </span>
                <span className="table-arrow hidden">
                  <i className="fa fa-angle-down" onClick={collapseTable} />
                </span>
                Taxon
              </th>
              {renderColumnHeader(
                "Score",
                `NT_aggregatescore`,
                REPORT_TABLE_COLUMNS["NT_aggregatescore"]
              )}
              {renderColumnHeader(
                "Z",
                `${countType}_zscore`,
                REPORT_TABLE_COLUMNS["zscore"]
              )}
              {renderColumnHeader(
                "rPM",
                `${countType}_rpm`,
                REPORT_TABLE_COLUMNS["rpm"]
              )}
              {renderColumnHeader(
                "r",
                `${countType}_r`,
                REPORT_TABLE_COLUMNS["r"]
              )}
              {showAssemblyColumns &&
                renderColumnHeader(
                  "contig",
                  `${countType}_contigs`,
                  REPORT_TABLE_COLUMNS["contigs"]
                )}
              {showAssemblyColumns &&
                renderColumnHeader(
                  "contig r",
                  `${countType}_contigreads`,
                  REPORT_TABLE_COLUMNS["contigreads"]
                )}
              {renderColumnHeader(
                "%id",
                `${countType}_percentidentity`,
                REPORT_TABLE_COLUMNS["percentidentity"]
              )}
              {renderColumnHeader(
                "L",
                `${countType}_alignmentlength`,
                REPORT_TABLE_COLUMNS["alignmentlength"]
              )}
              {renderColumnHeader(
                "log(1/E)",
                `${countType}_neglogevalue`,
                REPORT_TABLE_COLUMNS["neglogevalue"]
              )}
              <th className="last-col">
                <BasicPopup
                  trigger={
                    <div className="sort-controls center left">
                      <div
                        className={
                          countType === "NT"
                            ? "active column-switcher"
                            : "column-switcher"
                        }
                        onClick={() => {
                          setCountType("NT");
                          logAnalyticsEvent(
                            "ReportTable_count-type-nt_clicked"
                          );
                        }}
                      >
                        NT
                      </div>
                      <div
                        className={
                          countType === "NR"
                            ? "active column-switcher"
                            : "column-switcher"
                        }
                        onClick={() => {
                          setCountType("NR");
                          logAnalyticsEvent(
                            "ReportTable_count-type-nr_clicked"
                          );
                        }}
                      >
                        NR
                      </div>
                    </div>
                  }
                  position="top right"
                  content="Switch count type"
                  inverted
                  basic={false}
                  size="small"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <DetailCells
              taxons={taxons}
              taxonRowRefs={taxonRowRefs}
              renderName={renderName}
              renderNumber={renderNumber}
              getRowClass={getRowClass}
              onTaxonClick={this.handleTaxonClick}
              reportDetails={reportDetails}
              backgroundData={backgroundData}
              showAssemblyColumns={showAssemblyColumns}
              handleMouseEnter={this.props.handleMouseEnter}
              handleMouseLeave={this.props.handleMouseLeave}
            />
          </tbody>
        </table>
      </div>
    );
  }
}

ReportTable.propTypes = {
  taxons: PropTypes.arrayOf(PropTypes.Taxon).isRequired,
  taxonRowRefs: PropTypes.objectOf(PropTypes.any).isRequired, // These are DOM elements.
  renderName: PropTypes.func.isRequired,
  renderNumber: PropTypes.func.isRequired,
  getRowClass: PropTypes.func.isRequired,
  reportDetails: PropTypes.ReportDetails,
  backgroundData: PropTypes.BackgroundData,
  expandTable: PropTypes.func.isRequired,
  collapseTable: PropTypes.func.isRequired,
  renderColumnHeader: PropTypes.func.isRequired,
  countType: PropTypes.string.isRequired,
  setCountType: PropTypes.func.isRequired,
  showAssemblyColumns: PropTypes.bool,
  onTaxonClick: PropTypes.func,
  handleMouseEnter: PropTypes.func,
  handleMouseLeave: PropTypes.func,
};
