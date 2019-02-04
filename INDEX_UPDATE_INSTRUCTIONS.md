# IDSeq Index Update Instructions

## Overview
  IdSeq uses the curated NCBI datasets to build indexes and lookup tables to enable metagenomic analysis as part of the idseq pipeline. The following datasets are downloaded periodically from NCBI and a one-click index generation process is setup for periodical reference database updates. 
   * [**nt.gz**](https://ftp.ncbi.nlm.nih.gov/blast/db/fasta/nt.gz): (NCBI curated nucleotide database): we use [gsnap](http://research-pub.gene.com/gmap/) to build/search the index from nt.
   * [**nr.gz**](https://ftp.ncbi.nlm.nih.gov/blast/db/fasta/nr.gz): (NCBI curated protein database): we use [rapsearch2](http://omics.informatics.indiana.edu/mg/RAPSearch2/) to build/search the index from nr.
   * [**accession2taxid**](https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/accession2taxid): accession(sequence identifier as shown in nt/nr) to taxon id mapping. We build the mapping into a berkeley db table through python shelve. (We are working on switching to sqlite3)
   * [**taxdump.tar.gz**](https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/taxdump.tar.gz): taxonomy information including the whole NCBI taxonomy information. We build the taxon to lineage mapping into a berkeley db table similar to above.

  The next section details the index update process. 


## Step by Step Guide for Index Update (IdSeq Internal)

  1. Make sure you have access to [idseq-infra](https://github.com/chanzuckerberg/idseq-infra) and the right AWS credentials for the idseq account
  2. Find the latest ncbi download datestamp `<DATESTAMP>` by looking at `aws s3 ls s3://idseq-database/ncbi-sources/`
  3. Kickoff the indexing jobs (one-click index generation): go to the [submit_idseq_update_jobs](https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions/submit_idseq_update_jobs?tab=graph) lambda function. Configure a test event with ``` {"NcbiDate": "<DATESTAMP>" } ``` and click the **Test** button to start the index building. It takes about two days for the index to be generated. The gsnap indexing is typically the slowest. The presence of `s3://idseq-database/alignment_indexes/<DATESTAMP>/nt_k16.tar` typically indicates that the index is done generating.  But to be sure. Please read through the components sections below to make sure all the data is generated.
  4. Deploying the index to the staging tier

     * Figure out what the next lineage_version should be by making `<LINEAGE_VERION> = AlignmentConfig.last.lineage_version + 1`
     * Run update_lineage_db on idseq-web: `bin/shell staging " REFERENCE_S3_FOLDER=s3://idseq-database/taxonomy/<DATESTAMP> LINEAGE_VERSION=<LINEAGE_VERSION> rake  update_lineage_db"`
     * Create a new AlignmentConfig with the following script (replace the <VAR> accordingly)
     ```
     name = "<DATESTAMP>"
     AlignmentConfig.create(
       name: name,
       lineage_version: <LINEAGE_VERION> ,
       index_dir_suffix: name,
       s3_nt_db_path: "s3://idseq-database/alignment_data/#{name}/nt",
       s3_nt_loc_db_path: "s3://idseq-database/alignment_data/#{name}/nt_loc.db",
       s3_nr_db_path: "s3://idseq-database/alignment_data/#{name}/nr",
       s3_nr_loc_db_path: "s3://idseq-database/alignment_data/#{name}/nr_loc.db",
       s3_lineage_path: "s3://idseq-database/taxonomy/#{name}/taxid-lineages.db",
       s3_accession2taxid_path: "s3://idseq-database/alignment_data/#{name}/accession2taxid.db",
       s3_deuterostome_db_path: "s3://idseq-database/taxonomy/#{name}/deuterostome_taxids.txt"
     )
     ```
     * Update phage list: follow instructions in [taxon_lineage_helper.json](https://github.com/chanzuckerberg/idseq-web/blob/master/app/helpers/taxon_lineage_helper.rb)
     * Update default alignment index update on terraform to enable the new index. Please make sure there are no pipeline jobs running in the tier.
       * `git clone git@github.com:chanzuckerberg/idseq-infra.git; cd idseq-infra`
       * change the alignment_index_date var in fogg.json to <DATESTAMP> and then run `fogg apply`
       * Go to terraform/envs/staging/{gsnap|rapsearch|web} and run `make apply` under each directory respectively
       * Submit a sample to the staging tier and make sure everything works fine
  5. Deploying the index to the prod tier: same as 4 except `s/staging/prod/`


## Components

### Copy Required Data from NCBI to S3

  * Copy script on [github](https://github.com/chanzuckerberg/idseq-copy-tool)
  * The script will run twice a month through the [submit_ncbi_copy_job](submit_ncbi_copy_job) lambda function and be stored under `s3://idseq-database/ncbi-sources/<DATESTAMP>`
  * The list of files downloaded are listed in the Overview section

### Build Index from  NT

  * The index is built with gsnap on **nt** through [a cloud_init script](https://github.com/chanzuckerberg/idseq-infra/blob/master/terraform/envs/staging/index-gsnap/templates/cloud_init.sh.tpl). It could be kicked off as part of the [submit_idseq_update_jobs](https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions/submit_idseq_update_jobs?tab=graph) lambda function mentioned above.
  * `s3://idseq-database/alignment_indexes/<DATESTAMP>/nt_k16.tar` should be generated from this step.

### Build Index from  NR

  * The index is built with rapsearch2 on **nr** through [a cloud_init script](https://github.com/chanzuckerberg/idseq-infra/blob/master/terraform/envs/staging/index-rapsearch/templates/cloud_init.sh.tpl). It could be kicked off as part of the [submit_idseq_update_jobs](https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions/submit_idseq_update_jobs?tab=graph) lambda function mentioned above.
  * `s3://idseq-database/alignment_indexes/<DATESTAMP>/nr_rapsearch[.info]` should be generated from this step.

### Build accession2taxid Lookup  Table and nt/nr Lookup Table

  * The accession2taxid lookup table is generated on all the accession2taxid files under `s3://idseq-database/ncbi-sources/<DATESTAMP>/accession2taxid/` through  [a cloud_init script](https://github.com/chanzuckerberg/idseq-infra/blob/master/terraform/envs/staging/index-accessions/templates/cloud_init.sh.tpl). It could be kicked off as part of the [submit_idseq_update_jobs](https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions/submit_idseq_update_jobs?tab=graph) lambda function mentioned above.
  * A number of critical files will be generated through this step including
    * `s3://idseq-database/alignment_data/<DATESTAMP>/accession2taxid.db`: accession to taxid lookup table
    * `s3://idseq-database/alignment_data/<DATESTAMP>/taxid2wgs_accession.db`: taxon to list of whole genome accessions
    * `s3://idseq-database/alignment_data/<DATESTAMP>/nr_loc.db`: accession to seqeunce location info in nr
    * `s3://idseq-database/alignment_data/<DATESTAMP>/nt_loc.db`: accession to seqeunce location info in nt


### Build Taxonomy and Lineage Database

  * The index is built with gsnap on taxdump.tar.gz  through [a cloud_init script](https://github.com/chanzuckerberg/idseq-infra/blob/master/terraform/envs/staging/index-index-lineages/templates/cloud_init.sh.tpl). It could be kicked off as part of the [submit_idseq_update_jobs](https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions/submit_idseq_update_jobs?tab=graph) lambda function mentioned above.
  * A number of critical files will be generated including
    * `s3://idseq-database/taxonomy/<DATESTAMP>/taxid-lineages.db`: taxon to lineage lookup table
    * `s3://idseq-database/taxonomy/<DATESTAMP>/deuterostome_taxids.txt`: deuterostome list
    * `s3://idseq-database/taxonomy/<DATESTAMP>/taxid-lineages.csv.gz: lineage csv used for idseq-web taxon_lineage table

### Self-termination mechanisms

  The [submit_idseq_update_jobs](https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions/submit_idseq_update_jobs?tab=graph) lambda function mentioned above will kick off indexing jobs through a cloud init script but it doesn't have a way to terminate the instance once the index is generated. We therefore setup a **cleanup** lambda function [cleanup_index_asg](https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions/cleanup_index_asg?tab=graph) that runs once an hour to scale down instances who are finished with its indexing step.

## Bonus: Adding a New Host Genome

  `Coming soon`

