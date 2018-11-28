import React from "react";

// TODO(mark): Use alias instead, to avoid dots.
import PropTypes from "../../../utils/propTypes";

const DetailCells = ({
  taxons,
  taxonRowRefs,
  renderName,
  renderNumber,
  showConcordance,
  getRowClass,
  openTaxonModal,
  reportDetails,
  backgroundData
}) => {
  return taxons.map(taxInfo => (
    <tr
      key={taxInfo.tax_id}
      id={`taxon-${taxInfo.tax_id}`}
      ref={elm => {
        taxonRowRefs[taxInfo.tax_id] = elm;
      }}
      className={getRowClass(taxInfo)}
    >
      <td>
        {renderName(taxInfo, reportDetails, backgroundData, openTaxonModal)}
      </td>
      {renderNumber(
        taxInfo.NT.aggregatescore,
        null,
        0,
        true,
        undefined,
        taxInfo.topScoring == 1
      )}
      {renderNumber(taxInfo.NT.zscore, taxInfo.NR.zscore, 1)}
      {renderNumber(taxInfo.NT.rpm, taxInfo.NR.rpm, 1)}
      {renderNumber(taxInfo.NT.r, taxInfo.NR.r, 0)}
      {renderNumber(taxInfo.NT.percentidentity, taxInfo.NR.percentidentity, 1)}
      {renderNumber(taxInfo.NT.neglogevalue, taxInfo.NR.neglogevalue, 0)}
      {renderNumber(
        taxInfo.NT.percentconcordant,
        taxInfo.NR.percentconcordant,
        1,
        undefined,
        showConcordance
      )}
      <td className="last-col" />
    </tr>
  ));
};

DetailCells.propTypes = {
  taxons: PropTypes.arrayOf(PropTypes.Taxon).isRequired,
  taxonRowRefs: PropTypes.objectOf(PropTypes.any).isRequired, // These are DOM elements.
  renderName: PropTypes.func.isRequired,
  renderNumber: PropTypes.func.isRequired,
  showConcordance: PropTypes.bool.isRequired,
  openTaxonModal: PropTypes.func.isRequired,
  getRowClass: PropTypes.func.isRequired,
  reportDetails: PropTypes.ReportDetails,
  backgroundData: PropTypes.BackgroundData
};

export default DetailCells;
