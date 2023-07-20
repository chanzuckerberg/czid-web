export const CONTIGS_COLUMN_GROUP = "contigs-column-group";

const GENES_COLUMN_GROUP_TOOLTIP_LINK_HREF =
  "https://chanzuckerberg.zendesk.com/hc/en-us/articles/15072078210708-AMR-Report-Metrics#gene-information";
const READS_COLUMN_GROUP_TOOLTIP_LINK_HREF =
  "https://chanzuckerberg.zendesk.com/hc/en-us/articles/15072078210708-AMR-Report-Metrics#read-metrics";
const CONTIGS_COLUMN_GROUP_TOOLTIP_LINK_HREF =
  "https://chanzuckerberg.zendesk.com/hc/en-us/articles/15072078210708-AMR-Report-Metrics#contig-metrics";

const TOOLTIP_LINK_TEXT = "Learn More.";

export const GENE_COLUMN_TOOLTIP_STRINGS = {
  regularText: "Gene name with best match in CARD.",
  boldText: "Gene",
  link: {
    href: GENES_COLUMN_GROUP_TOOLTIP_LINK_HREF,
    linkText: TOOLTIP_LINK_TEXT,
  },
};
export const GENE_FAMILY_COLUMN_TOOLTIP_STRINGS = {
  regularText: "ARO category for homologous genes.",
  boldText: "Gene Family",
  link: {
    href: GENES_COLUMN_GROUP_TOOLTIP_LINK_HREF,
    linkText: TOOLTIP_LINK_TEXT,
  },
};
export const DRUG_CLASS_COLUMN_TOOLTIP_STRINGS = {
  regularText: "Drug class this AMR gene confers resistance to.",
  boldText: "Drug Class",
  link: {
    href: GENES_COLUMN_GROUP_TOOLTIP_LINK_HREF,
    linkText: TOOLTIP_LINK_TEXT,
  },
};
export const HIGH_LEVEL_DRUG_CLASS_COLUMN_TOOLTIP_STRINGS = {
  regularText:
    "Antibiotic family classified based on mechanism of action, chemical structure or spectrum of activity. Not available for pipeline versions before v1.2.14.",
  boldText: "High-level Drug Class",
  link: {
    href: GENES_COLUMN_GROUP_TOOLTIP_LINK_HREF,
    linkText: TOOLTIP_LINK_TEXT,
  },
};
export const MECHANISMS_COLUMN_TOOLTIP_STRINGS = {
  regularText: "Refers to ARO category specifying resistance mechanism.",
  boldText: "Mechanism",
  link: {
    href: GENES_COLUMN_GROUP_TOOLTIP_LINK_HREF,
    linkText: TOOLTIP_LINK_TEXT,
  },
};
export const MODEL_COLUMN_TOOLTIP_STRINGS = {
  regularText:
    "Whether resistance is conferred by presence of the gene (homolog model) or by mutations(s) on the gene (variant model).",
  boldText: "Model",
  link: {
    href: GENES_COLUMN_GROUP_TOOLTIP_LINK_HREF,
    linkText: TOOLTIP_LINK_TEXT,
  },
};
export const CUTOFF_COLUMN_TOOLTIP_STRINGS = {
  regularText: `Cutoff used to detect AMR gene and contig matches based on a "Perfect", "Strict", and "Loose" paradigm that uses curated BLASTP bit-scores. "Nudged" specifies Loose matches that have at least 95% identity.`,
  boldText: "Cutoff",
  link: {
    href: CONTIGS_COLUMN_GROUP_TOOLTIP_LINK_HREF,
    linkText: TOOLTIP_LINK_TEXT,
  },
};
export const CONTIGS_COLUMN_TOOLTIP_STRINGS = {
  regularText: "Total number of contig sequences aligning to AMR gene.",
  boldText: "Contigs",
  link: {
    href: CONTIGS_COLUMN_GROUP_TOOLTIP_LINK_HREF,
    linkText: TOOLTIP_LINK_TEXT,
  },
};
export const CONTIGS_PERCENT_COVERAGE_COLUMN_TOOLTIP_STRINGS = {
  regularText: "Percentage of gene covered by contig sequence(s).",
  boldText: "Contigs % Coverage",
  link: {
    href: CONTIGS_COLUMN_GROUP_TOOLTIP_LINK_HREF,
    linkText: TOOLTIP_LINK_TEXT,
  },
};
export const CONTIGS_PERCENT_IDENTITY_COLUMN_TOOLTIP_STRINGS = {
  regularText: "Average percent identity of contig(s) aligning to AMR gene.",
  boldText: "Contigs % Identity",
  link: {
    href: CONTIGS_COLUMN_GROUP_TOOLTIP_LINK_HREF,
    linkText: TOOLTIP_LINK_TEXT,
  },
};
export const CONTIGS_SPECIES_COLUMN_TOOLTIP_STRINGS = {
  regularText: "Pathogen-of-origin prediction based on alignment to CARD.",
  boldText: "Contigs Species",
  link: {
    href: CONTIGS_COLUMN_GROUP_TOOLTIP_LINK_HREF,
    linkText: TOOLTIP_LINK_TEXT,
  },
};
export const READS_COLUMN_TOOLTIP_STRINGS = {
  regularText: "Total number of reads aligning to AMR gene.",
  boldText: "Reads",
  link: {
    href: READS_COLUMN_GROUP_TOOLTIP_LINK_HREF,
    linkText: TOOLTIP_LINK_TEXT,
  },
};
export const READS_PERCENT_COVERAGE_COLUMN_TOOLTIP_STRINGS = {
  regularText: "Percentage of gene covered by read(s).",
  boldText: "Reads % Coverage",
  link: {
    href: READS_COLUMN_GROUP_TOOLTIP_LINK_HREF,
    linkText: TOOLTIP_LINK_TEXT,
  },
};
export const READS_COVERAGE_DEPTH_TOOLTIP_STRINGS = {
  regularText: "Average depth of reads aligned across gene.",
  boldText: "Reads Coverage Depth",
  link: {
    href: READS_COLUMN_GROUP_TOOLTIP_LINK_HREF,
    linkText: TOOLTIP_LINK_TEXT,
  },
};
export const READS_SPECIES_COLUMN_TOOLTIP_STRINGS = {
  regularText:
    "Pathogen-of-origin prediction based on read alignment to CARD. The number refers to reads aligning to this species.",
  boldText: "Reads Species",
  link: {
    href: READS_COLUMN_GROUP_TOOLTIP_LINK_HREF,
    linkText: TOOLTIP_LINK_TEXT,
  },
};
export const READS_DPM_COLUMN_TOOLTIP_STRINGS = {
  regularText:
    "Number of bases mapped to gene in CARD, divided by gene length, per million reads sequenced.",
  boldText: "Reads dPM",
  link: {
    href: READS_COLUMN_GROUP_TOOLTIP_LINK_HREF,
    linkText: TOOLTIP_LINK_TEXT,
  },
};
export const READS_RPM_COLUMN_TOOLTIP_STRINGS = {
  regularText:
    "Number of reads aligning to gene in CARD per million reads sequenced.",
  boldText: "Reads rPM",
  link: {
    href: READS_COLUMN_GROUP_TOOLTIP_LINK_HREF,
    linkText: TOOLTIP_LINK_TEXT,
  },
};
