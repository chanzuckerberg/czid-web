import React from "react";

const DetailCells = ({ parent, openTaxonModal }) => {
  return parent.state.selected_taxons_top.map(taxInfo => (
    <tr
      key={taxInfo.tax_id}
      id={`taxon-${taxInfo.tax_id}`}
      ref={elm => {
        parent.taxon_row_refs[taxInfo.tax_id] = elm;
      }}
      className={parent.getRowClass(
        taxInfo,
        parent.props.confirmed_taxids,
        parent.props.watched_taxids
      )}
    >
      <td>
        {parent.render_name(
          taxInfo,
          parent.report_details,
          parent,
          openTaxonModal
        )}
      </td>
      {parent.render_number(
        taxInfo.NT.aggregatescore,
        null,
        0,
        true,
        undefined,
        taxInfo.topScoring == 1
      )}
      {parent.render_number(taxInfo.NT.zscore, taxInfo.NR.zscore, 1)}
      {parent.render_number(taxInfo.NT.rpm, taxInfo.NR.rpm, 1)}
      {parent.render_number(taxInfo.NT.r, taxInfo.NR.r, 0)}
      {parent.render_number(
        taxInfo.NT.percentidentity,
        taxInfo.NR.percentidentity,
        1
      )}
      {parent.render_number(
        taxInfo.NT.neglogevalue,
        taxInfo.NR.neglogevalue,
        0
      )}
      {parent.render_number(
        taxInfo.NT.percentconcordant,
        taxInfo.NR.percentconcordant,
        1,
        undefined,
        parent.showConcordance
      )}
      <td>{parent.displayHighlightTags(taxInfo)}</td>
    </tr>
  ));
};

export default DetailCells;
