import React from "react";
import Tipsy from "react-tipsy";

import TaxonModal from "../TaxonModal";

import DetailCells from "./DetailCells";

// TODO(mark): Refactor to remove parent prop.
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
    const { parent } = this.props;

    return (
      <div className="reports-main">
        {this.renderTaxonModal()}
        <table id="report-table" className="bordered report-table">
          <thead>
            <tr className="report-header">
              <th>
                <span className="table-arrow">
                  <i
                    className="fa fa-angle-right"
                    onClick={parent.expandTable}
                  />
                </span>
                <span className="table-arrow hidden">
                  <i
                    className="fa fa-angle-down"
                    onClick={parent.collapseTable}
                  />
                </span>
                Taxonomy
              </th>
              {parent.render_column_header(
                "Score",
                `NT_aggregatescore`,
                "Aggregate score: ( |genus.NT.Z| * species.NT.Z * species.NT.rPM ) + ( |genus.NR.Z| * species.NR.Z * species.NR.rPM )"
              )}
              {parent.render_column_header(
                "Z",
                `${parent.state.countType}_zscore`,
                `Z-score relative to background model for alignments to NCBI NT/NR`
              )}
              {parent.render_column_header(
                "rPM",
                `${parent.state.countType}_rpm`,
                `Number of reads aligning to the taxon in the NCBI NT/NR database per million total input reads`
              )}
              {parent.render_column_header(
                "r",
                `${parent.state.countType}_r`,
                `Number of reads aligning to the taxon in the NCBI NT/NR database`
              )}
              {parent.render_column_header(
                "%id",
                `${parent.state.countType}_percentidentity`,
                `Average percent-identity of alignments to NCBI NT/NR`
              )}
              {parent.render_column_header(
                "log(1/E)",
                `${parent.state.countType}_neglogevalue`,
                `Average log-10-transformed expect value for alignments to NCBI NT/NR`
              )}
              {parent.render_column_header(
                "%conc",
                `${parent.state.countType}_percentconcordant`,
                `Percentage of aligned reads belonging to a concordantly mappped pair (NCBI NT/NR)`,
                parent.showConcordance
              )}
              <th>
                <Tipsy content="Switch count type" placement="top">
                  <div className="sort-controls center left">
                    <div
                      className={
                        parent.state.countType === "NT"
                          ? "active column-switcher"
                          : "column-switcher"
                      }
                      onClick={() => {
                        parent.setState({ countType: "NT" });
                      }}
                    >
                      NT
                    </div>
                    <div
                      className={
                        parent.state.countType === "NR"
                          ? "active column-switcher"
                          : "column-switcher"
                      }
                      onClick={() => {
                        parent.setState({ countType: "NR" });
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
            <DetailCells parent={parent} openTaxonModal={this.openTaxonModal} />
          </tbody>
        </table>
      </div>
    );
  }
}
