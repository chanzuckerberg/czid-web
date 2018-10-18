import React from "react";
import Tipsy from "react-tipsy";

import PropTypes from "../../../utils/propTypes";
import TaxonModal from "../TaxonModal";

import DetailCells from "./DetailCells";

export default class ReportTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      taxonModalData: null
    };

    this.openTaxonModal = this.openTaxonModal.bind(this);
    this.closeTaxonModal = this.closeTaxonModal.bind(this);
  }

  renderTaxonModal() {
    const { taxonModalData } = this.state;
    if (!taxonModalData) return;

    const { taxInfo, backgroundData, taxonName } = taxonModalData;
    return (
      <TaxonModal
        taxonId={taxInfo.tax_id}
        taxonValues={{
          NT: taxInfo.NT,
          NR: taxInfo.NR
        }}
        parentTaxonId={
          taxInfo.tax_level === 1 ? taxInfo.genus_taxid : undefined
        }
        background={backgroundData}
        taxonName={taxonName}
        handleClose={this.closeTaxonModal}
      />
    );
  }

  openTaxonModal(taxonModalData) {
    this.setState({
      taxonModalData
    });
  }

  closeTaxonModal() {
    this.setState({
      taxonModalData: null
    });
  }

  render() {
    const {
      taxons,
      taxonRowRefs,
      confirmedTaxIds,
      watchedTaxIds,
      renderName,
      renderNumber,
      renderColumnHeader,
      displayHighlightTags,
      showConcordance,
      getRowClass,
      reportDetails,
      backgroundData,
      expandTable,
      collapseTable,
      countType,
      setCountType
    } = this.props;

    return (
      <div className="reports-main">
        {this.renderTaxonModal()}
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
                Taxonomy
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
              {renderColumnHeader(
                "%id",
                `${countType}_percentidentity`,
                `Average percent-identity of alignments to NCBI NT/NR`
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
              <th>
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
              confirmedTaxIds={confirmedTaxIds}
              watchedTaxIds={watchedTaxIds}
              renderName={renderName}
              renderNumber={renderNumber}
              displayHighlightTags={displayHighlightTags}
              showConcordance={showConcordance}
              getRowClass={getRowClass}
              openTaxonModal={this.openTaxonModal}
              reportDetails={reportDetails}
              backgroundData={backgroundData}
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
  confirmedTaxIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  watchedTaxIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  renderName: PropTypes.func.isRequired,
  renderNumber: PropTypes.func.isRequired,
  displayHighlightTags: PropTypes.func.isRequired,
  showConcordance: PropTypes.bool.isRequired,
  getRowClass: PropTypes.func.isRequired,
  reportDetails: PropTypes.ReportDetails,
  backgroundData: PropTypes.BackgroundData,
  expandTable: PropTypes.func.isRequired,
  collapseTable: PropTypes.func.isRequired,
  renderColumnHeader: PropTypes.func.isRequired,
  countType: PropTypes.string.isRequired,
  setCountType: PropTypes.func.isRequired
};
