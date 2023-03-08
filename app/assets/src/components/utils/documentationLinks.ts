// WARNING: Links with the prefix help.czid.org/knowledge will not be user-accessible. Just replace /knowledge/ with /hc/en-us/ .

export const SARS_COV_2_CONSENSUS_GENOME_DOC_LINK =
  "https://help.czid.org/hc/en-us/articles/360049787632";
export const VIRAL_CONSENSUS_GENOME_DOC_LINK =
  "https://help.czid.org/hc/en-us/articles/360059664191";
export const NEXTCLADE_APP_LINK = "https://clades.nextstrain.org/";
export const NEXTCLADE_DEFAULT_TREE_LINK =
  "https://docs.nextstrain.org/projects/nextclade/en/latest/user/datasets.html"; // Beware of link breaking
export const NEXTCLADE_REFERENCE_TREE_LINK =
  "https://help.czid.org/hc/en-us/articles/360052479232#Uploading-to-Nextclade";
export const NEXTCLADE_TOOL_DOC_LINK =
  "https://help.czid.org/hc/en-us/articles/360052479232";
export const NEXTCLADE_TREE_FORMAT_LINK =
  "https://docs.nextstrain.org/en/latest/reference/formats/data-formats.html";
export const NEXTCLADE_TREE_ROOT_LINK =
  "https://github.com/nextstrain/ncov/blob/master/defaults/reference_seq.gb";
export const VISUALIZATIONS_DOC_LINK =
  "https://help.czid.org/hc/en-us/articles/360043062453-Creating-a-Heatmap";
export const ARTIC_PIPELINE_LINK =
  "https://artic.network/ncov-2019/ncov2019-bioinformatics-sop.html";
export const CG_ILLUMINA_PIPELINE_GITHUB_LINK =
  "https://github.com/chanzuckerberg/czid-workflows/tree/main/workflows/consensus-genome";
export const MNGS_ILLUMINA_PIPELINE_GITHUB_LINK =
  "https://github.com/chanzuckerberg/czid-workflows/tree/main/workflows/short-read-mngs";
export const MNGS_NANOPORE_PIPELINE_GITHUB_LINK =
  "https://github.com/chanzuckerberg/czid-workflows/blob/main/workflows/long-read-mngs/run.wdl";
export const PREVIEW_TERMS_AND_PRIVACY_POLICY_CHANGES_DOC_LINK =
  "https://help.czid.org/hc/en-us/articles/360058195412";
export const UPLOAD_SAMPLE_PIPELINE_OVERVIEW_LINK =
  "https://help.czid.org/hc/en-us/articles/360059656311#Upload";
export const VADR_ANCHOR_LINK =
  "https://help.czid.org/hc/en-us/articles/360049787632-Building-and-analyzing-a-SARS-CoV-2-consensus-genome#Viral-Annotation-DefineR-VADR";
export const MAIL_TO_HELP_LINK = "mailto:help@czid.org";
export const PHYLO_TREE_LINK =
  "https://help.czid.org/hc/en-us/articles/4404223662228";
export const BACKGROUND_MODELS_LINK =
  "https://help.czid.org/hc/en-us/articles/360050883054-Background-Models";
export const CG_QUALITY_CONTROL_LINK =
  "https://help.czid.org/hc/en-us/articles/360049787632-Building-and-analyzing-a-SARS-CoV-2-consensus-genome#Quality-control";
export const NCBI_POLICIES_AND_DISCLAIMERS_LINK =
  "https://www.ncbi.nlm.nih.gov/home/about/policies/";
export const BLAST_HELP_LINK =
  "https://chanzuckerberg.zendesk.com/hc/en-us/articles/4429814631572-Confirm-hits-using-BLASTN";
export const BULK_DOWNLOAD_LINK =
  "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360042575714-Initiate-a-Bulk-Download";
export const AMR_HELP_LINK =
  "https://docs.google.com/document/d/16qYFrijM3XgafTkodKtDGVOZDRY4D_TMBWix_hzZLvw/edit?usp=sharing";
export const AMR_EXISTING_SAMPLES_LINK =
  "https://docs.google.com/document/d/12a_0PQcTRbB-0JC1SMjhLvdQzhBF2Z0TZseFkoH-aRI/edit#bookmark=id.lqgywt4vgvg3";
export const AMR_DEPRECATED_HELP_LINK =
  "https://docs.google.com/document/d/1BkkegYEu5hoo-6xqNL-A-eMuT-tTYsJu4Q5OlO_HI5s/edit?usp=sharing";
export const WEB_UPLOAD_LINK =
  "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360035296573-Upload-on-the-Web";
export const GUPPY_BASECALLER_DOC_LINK =
  "https://docs.google.com/document/d/1ZsZ8ythCMrER7eZKbjZG93O6bNB37pJpsX2lf1sAs_I/edit#bookmark=id.w6xiktgro9k";
export const CONCAT_FILES_HELP_LINK =
  "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360051806072-How-to-concatenate-files";

export const TOTAL_READ_HELP_LINK = {
  url:
    "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360053758913-Sample-QC#Total-Reads",
  header: "Do my samples have enough total reads?",
  pop_up:
    "Total Reads:The total number of single-end reads uploaded. Each end of the paired-end reads count as one read. Learn more.",
};
export const QUALITY_READ_HELP_LINK = {
  url:
    "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360053758913-Sample-QC#Passed-QC",
  header: "Do my samples have enough quality reads?",
  pop_up:
    "Passed QC:The percentage of reads that came out of PriceSeq, step (3) of the host filtration and QC steps, compared to what went into Trimmomatic, step (2). Learn more.",
};
export const DUPLICATE_READ_HELP_LINK = {
  url:
    "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360053758913-Sample-QC#DCR-(duplicate-compression-ratio)",
  header: "Are there too many duplicate reads in my library?",
  pop_up:
    "DCR:Duplicate Compression Ratio is the ratio of the total number of sequences present prior to running czid-dedup (duplicate identification) vs the number of unique sequences. Learn more.",
};
export const INSERT_LENGTH_HELP_LINK = {
  url:
    "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360053758913-Sample-QC#Mean-Insert-Size",
  header: "Do my samples have sufficient insert lengths?",
  pop_up:
    "Mean Insert Size:The average length of the nucleotide sequence that is inserted between the adapters. Learn more.",
};

export const READ_URL_HELP_LINK =
  "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360053758913-Sample-QC#Reads-Lost";

export const READS_POPUP_HELP =
  "Reads Lost:Reads filtered during each step of the pipeline. The full length of the bar represents the Total Reads. Passed Filters represent the reads that passed quality control and filtering steps. Learn more.";
