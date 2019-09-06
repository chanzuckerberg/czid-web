import React from "react";
import Tipsy from "react-tipsy";

import { logAnalyticsEvent } from "~/api/analytics";

import PropTypes from "../../../utils/propTypes";
import DetailCells from "./DetailCells";

const doclink =
  "https://github.com/chanzuckerberg/idseq-dag/wiki/IDseq-Pipeline-Stage-%233:-Reporting-and-Visualization#reports";

export default class ReportTable extends React.Component {
  constructor(props) {
    super(props);
  }

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
              {renderColumnHeader("Score", `NT_aggregatescore`, {
                title: "Aggregate score",
                tooltip:
                  "Experimental ranking score for prioritizing microbes.",
                link: doclink,
              })}
              {renderColumnHeader("Z", `${countType}_zscore`, {
                title: "Z-score",
                tooltip:
                  "Experimental method for evaluating the prevelance of microbes in your sample as compared to background contaminants.",
                link: doclink,
              })}
              {renderColumnHeader("rPM", `${countType}_rpm`, {
                tooltip:
                  "Number of reads aligning to the taxon in the NCBI NR/NT database per million reads sequenced.",
                link: doclink,
              })}
              {renderColumnHeader("r", `${countType}_r`, {
                tooltip:
                  "Number of reads aligning to the taxon in the NCBI NT/NR database.",
                link: doclink,
              })}
              {showAssemblyColumns &&
                renderColumnHeader("contig", `${countType}_contigs`, {
                  tooltip:
                    "Number of assembled contigs aligning to the taxon in the NCBI NT/NR database.",
                  link: doclink,
                })}
              {showAssemblyColumns &&
                renderColumnHeader("contig r", `${countType}_contigreads`, {
                  tooltip: "Total number reads across all assembled contigs.",
                  link: doclink,
                })}
              {renderColumnHeader("%id", `${countType}_percentidentity`, {
                tooltip:
                  "Average percent-identity of alignments to NCBI NT/NR.",
                link: doclink,
              })}
              {renderColumnHeader("L", `${countType}_alignmentlength`, {
                tooltip:
                  "Average length of the local alignment for all contigs.",
                link: doclink,
              })}
              {renderColumnHeader("log(1/E)", `${countType}_neglogevalue`, {
                tooltip:
                  "Average log10 transformed expect value of alignments to NCBI NT/NR.",
                link: doclink,
              })}
              <th className="last-col">
                <Tipsy content="Switch count type" placement="top">
                  <div className="sort-controls center left">
                    <div
                      className={
                        countType === "NT"
                          ? "active column-switcher"
                          : "column-switcher"
                      }
                      onClick={() => {
                        setCountType("NT");
                        logAnalyticsEvent("ReportTable_count-type-nt_clicked");
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
                        logAnalyticsEvent("ReportTable_count-type-nr_clicked");
                      }}
                    >
                      NR
                    </div>
                  </div>
                </Tipsy>
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
