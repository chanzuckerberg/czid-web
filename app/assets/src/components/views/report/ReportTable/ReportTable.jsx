import React from "react";
import Tipsy from "react-tipsy";

import PropTypes from "../../../utils/propTypes";

import DetailCells from "./DetailCells";

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
        NR: taxInfo.NR
      }
    });
  };

  render() {
    const {
      taxons,
      taxonRowRefs,
      renderName,
      renderNumber,
      renderColumnHeader,
      showConcordance,
      getRowClass,
      reportDetails,
      backgroundData,
      expandTable,
      collapseTable,
      countType,
      setCountType,
      showAssemblyColumns
    } = this.props;

    return (
      <div className="reports-main">
        <table id="report-table" className="bordered report-table">
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
                "Aggregate score: ( |genus.NT.Z| * species.NT.Z * species.NT.rPM ) + ( |genus.NR.Z| * species.NR.Z * species.NR.rPM )"
              )}
              {renderColumnHeader(
                "Z",
                `${countType}_zscore`,
                `Z-score relative to background model for alignments to NCBI NT/NR`
              )}
              {renderColumnHeader(
                "rPM",
                `${countType}_rpm`,
                `Number of reads aligning to the taxon in the NCBI NT/NR database per million total input reads`
              )}
              {renderColumnHeader(
                "r",
                `${countType}_r`,
                `Number of reads aligning to the taxon in the NCBI NT/NR database`
              )}
              {showAssemblyColumns &&
                renderColumnHeader(
                  "contig",
                  `${countType}_contigs`,
                  `Number of assembled contigs aligning to the taxon in the NCBI NT/NR database`
                )}
              {showAssemblyColumns &&
                renderColumnHeader(
                  "contig r",
                  `${countType}_contigreads`,
                  `Total number of reads across all assembled contigs`
                )}
              {renderColumnHeader(
                "%id",
                `${countType}_percentidentity`,
                `Average percent-identity of alignments to NCBI NT/NR`
              )}
              {renderColumnHeader(
                "L",
                `${countType}_alignmentlength`,
                `Average length (bp) of alignments to NCBI NT/NR`
              )}
              {renderColumnHeader(
                "log(1/E)",
                `${countType}_neglogevalue`,
                `Average log-10-transformed expect value for alignments to NCBI NT/NR`
              )}
              {renderColumnHeader(
                "%conc",
                `${countType}_percentconcordant`,
                `Percentage of aligned reads belonging to a concordantly mappped pair (NCBI NT/NR)`,
                showConcordance
              )}
              <th className="last-col">
                <Tipsy content="Switch count type" placement="top">
                  <div className="sort-controls center left">
                    <div
                      className={
                        countType === "NT"
                          ? "active column-switcher"
                          : "column-switcher"
                      }
                      onClick={() => setCountType("NT")}
                    >
                      NT
                    </div>
                    <div
                      className={
                        countType === "NR"
                          ? "active column-switcher"
                          : "column-switcher"
                      }
                      onClick={() => setCountType("NR")}
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
              showConcordance={showConcordance}
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
  showConcordance: PropTypes.bool.isRequired,
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
  handleMouseLeave: PropTypes.func
};
