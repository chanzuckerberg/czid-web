import PropTypes from "prop-types";

const TaxonDatabaseStats = PropTypes.shape({
  aggregatescore: PropTypes.number.isRequired,
  alignmentlength: PropTypes.number.isRequired,
  count_type: PropTypes.string.isRequired,
  maxzscore: PropTypes.number.isRequired,
  neglogevalue: PropTypes.number.isRequired,
  percentconcordant: PropTypes.number.isRequired,
  percentidentity: PropTypes.number.isRequired,
  r: PropTypes.number.isRequired,
  r_pct: PropTypes.string,
  // Right now, if rpm is 0, it is a number. Otherwise, a string.
  rpm: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  rpm_bg: PropTypes.number,
  zscore: PropTypes.number.isRequired
});

const Taxon = PropTypes.shape({
  NR: TaxonDatabaseStats.isRequired,
  NT: TaxonDatabaseStats.isRequired,
  category_name: PropTypes.string.isRequired,
  common_name: PropTypes.string,
  family_taxid: PropTypes.number.isRequired,
  genus_taxid: PropTypes.number.isRequired,
  is_phage: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  pathogenTag: PropTypes.string,
  species_count: PropTypes.number.isRequired,
  species_taxid: PropTypes.number.isRequired,
  tax_id: PropTypes.number.isRequired,
  tax_level: PropTypes.number.isRequired,
  topScoring: PropTypes.number
});

// TODO(mark): Complete signature as more fields of ReportDetails are used in the app.
const ReportDetails = PropTypes.shape({
  taxon_fasta_flag: PropTypes.bool.isRequired
});

const BackgroundData = PropTypes.shape({
  id: PropTypes.number,
  name: PropTypes.string
});

// TODO(mark): Complete signature as more fields of Sample are used in the app.
const Sample = PropTypes.shape({
  id: PropTypes.number.isRequired
});

export default {
  ReportDetails,
  Taxon,
  BackgroundData,
  Sample,
  ...PropTypes
};
