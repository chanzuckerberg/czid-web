import PropTypes from "prop-types";

const TaxonDatabaseStats = PropTypes.shape({
  aggregatescore: PropTypes.number.isRequired,
  alignmentlength: PropTypes.number.isRequired,
  count_type: PropTypes.string.isRequired,
  maxzscore: PropTypes.number.isRequired,
  neglogevalue: PropTypes.number.isRequired,
  percentidentity: PropTypes.number.isRequired,
  r: PropTypes.number.isRequired,
  r_pct: PropTypes.string,
  // Right now, if rpm is 0, it is a number. Otherwise, a string.
  rpm: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  rpm_bg: PropTypes.number,
  zscore: PropTypes.number.isRequired,
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
  topScoring: PropTypes.number,
});

// TODO(mark): Expand signature as more fields of ReportDetails are used in the app.
const ReportDetails = PropTypes.shape({
  taxon_fasta_flag: PropTypes.bool.isRequired,
});

const BackgroundData = PropTypes.shape({
  id: PropTypes.number,
  name: PropTypes.string,
});

// TODO(mark): Expand signature as more fields of Sample are used in the app.
const Sample = PropTypes.shape({
  id: PropTypes.number,
  name: PropTypes.string,
  host_genome_id: PropTypes.number,
});

const Project = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
});

const MetadataType = PropTypes.shape({
  key: PropTypes.string,
  dataType: PropTypes.oneOf(["string", "number", "date", "location"]),
  name: PropTypes.string,
});

const ERCCComparison = PropTypes.arrayOf(
  PropTypes.shape({
    name: PropTypes.string,
    actual: PropTypes.number,
    expected: PropTypes.number,
  })
);

// TODO(mark): Expand signature as more fields of PipelineRun are used in the app.
const PipelineRun = PropTypes.shape({
  pipeline_version: PropTypes.string,
  assembled: PropTypes.number,
  total_ercc_reads: PropTypes.number,
  total_reads: PropTypes.number,
  adjusted_remaining_reads: PropTypes.number,
  version: PropTypes.shape({
    version: PropTypes.string,
    alignment_db: PropTypes.string,
  }),
});

const SummaryStats = PropTypes.shape({
  last_processed_at: PropTypes.string,
});

const HostGenome = PropTypes.shape({
  id: PropTypes.number,
  name: PropTypes.string,
});

const Location = PropTypes.shape({
  city_name: PropTypes.string,
  country_name: PropTypes.string,
  geo_level: PropTypes.string,
  id: PropTypes.number,
  lat: PropTypes.string, // Rails returns Decimal as string to avoid fp issues
  lng: PropTypes.string,
  name: PropTypes.string,
  sample_ids: PropTypes.arrayOf(PropTypes.number),
  state_name: PropTypes.string,
  subdivision_name: PropTypes.string,
});

const SampleUploadType = PropTypes.oneOf(["basespace", "local", "remote"]);

// Bulk download types
const DownloadType = PropTypes.shape({
  type: PropTypes.string,
  display_name: PropTypes.string,
  admin_only: PropTypes.bool,
  description: PropTypes.string,
  category: PropTypes.string,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      display_name: PropTypes.string,
    })
  ),
  uploader_only: PropTypes.bool,
  file_type_display: PropTypes.string,
});

const DownloadTypeParam = PropTypes.shape({
  displayName: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
});

const BulkDownload = PropTypes.shape({
  num_samples: PropTypes.number,
  params: PropTypes.objectOf(DownloadTypeParam),
  presigned_output_url: PropTypes.string,
  download_name: PropTypes.string,
  file_size: PropTypes.string,
});

const SampleTypeProps = PropTypes.shape({
  name: PropTypes.string,
  group: PropTypes.string,
  insect_only: PropTypes.bool,
  human_only: PropTypes.bool,
});

export default {
  ReportDetails,
  Taxon,
  BackgroundData,
  Sample,
  MetadataType,
  ERCCComparison,
  PipelineRun,
  Project,
  SummaryStats,
  HostGenome,
  Location,
  SampleUploadType,
  DownloadType,
  DownloadTypeParam,
  SampleTypeProps,
  BulkDownload,
  ...PropTypes,
};
