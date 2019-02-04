import React from "react";
import { get } from "lodash/fp";

// TODO(mark): Use alias instead, to avoid dots.
import PropTypes from "../../../utils/propTypes";

const DetailCells = ({
  taxons,
  taxonRowRefs,
  renderName,
  renderNumber,
  showConcordance,
  getRowClass,
  onTaxonClick,
  reportDetails,
  backgroundData,
  showAssemblyColumns
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
        {renderName(taxInfo, reportDetails, backgroundData, onTaxonClick)}
      </td>
      {renderNumber(
        taxInfo.NT.aggregatescore,
        null,
        0,
        true,
        undefined,
        taxInfo.topScoring == 1,
        "score-column"
      )}
      {renderNumber(taxInfo.NT.zscore, taxInfo.NR.zscore, 1)}
      {renderNumber(taxInfo.NT.rpm, taxInfo.NR.rpm, 1)}
      {renderNumber(taxInfo.NT.r, taxInfo.NR.r, 0)}
      {showAssemblyColumns &&
        renderNumber(
          get("summaryContigCounts.NT.contigs", taxInfo) || 0,
          get("summaryContigCounts.NR.contigs", taxInfo) || 0,
          0
        )}
      {showAssemblyColumns &&
        renderNumber(
          get("summaryContigCounts.NT.contigreads", taxInfo) || 0,
          get("summaryContigCounts.NR.contigreads", taxInfo) || 0,
          0
        )}
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
  onTaxonClick: PropTypes.func.isRequired,
  getRowClass: PropTypes.func.isRequired,
  reportDetails: PropTypes.ReportDetails,
  backgroundData: PropTypes.BackgroundData,
  showAssemblyColumns: PropTypes.bool
};

export default DetailCells;
