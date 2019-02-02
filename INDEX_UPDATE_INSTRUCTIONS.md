# IDSeq Index Update Instructions

## Overview
  
 The following datasets are downloaded periodically from NCBI. We build indexes and lookup tables on top of these datasets to
 enable metagenomic analysis as part of the idseq pipeline. 
   * nt.gz: (NCBI curated nucleotide database): we use gsnap to build/search the index from nt.  
   * nr.gz: (NCBI curated protein database): we use rapsearch2 to build/search the index from nr. 
   * accession2taxid: accession(sequence identifier as show in nt/nr) to taxon id mapping. We build the mapping into a berkeley db table through python shelve. (We are working on switching to sqlite3) 
   * taxdump.tar.gz: taxonomy information including the whole NCBI taxonomy information. We build the taxon to lineage mapping into a berkeley db table similar to above.  

## Step by Step Guide for Index Update (IdSeq Internal)
  
  1. Make sure you have access to [idseq-infra](https://github.com/chanzuckerberg/idseq-infra) and the right AWS credentials for the idseq account 
  2. Find the latest ncbi download datestamp <DATESTAMP> by looking at `aws s3 ls s3://idseq-database/ncbi-sources/` 
  3. Kickoff the indexing job: go to the [submit_idseq_update_jobs](https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions/submit_idseq_update_jobs?tab=graph) lambda function. Configure a test event with ``` {"NcbiDate": "<DATESTAMP>" } ``` and click the **Test** button to start the index building. It takes about two days for the index to be generated. The gsnap indexing is typically the slowest. The presence of `s3://idseq-database/alignment_indexes/<DATESTAMP>/nt_k16.tar` typically indicates that the index is done generating.  But to be sure. Please read through the components sections below to make sure all the data is generated. 
  4. Deploying the index to the staging tier
    * Figure out what the next lineage_version should be by making `<LINEAGE_VERION> = AlignmentConfig.last.lineage_version + 1`
    * Run update_lineage_db on idseq-web: `bin/shell staging " REFERENCE_S3_FOLDER=s3://idseq-database/taxonomy/<DATESTAMP> LINEAGE_VERSION=<LINEAGE_VERSION> rake  update_lineage_db"`  
    * Add alignment config to the idseq-web staging tier
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
    * Update default alignment index update on terraform to enable the new index. Please make sure there are no jobs running in the tier. 
      * `git clone git@github.com:chanzuckerberg/idseq-infra.git; cd idseq-infra`
      *  change the alignment_index_date var in fogg.json to <DATESTAMP> and then run `fogg apply`  
      * Go to terraform/envs/staging/{gsnap|rapsearch|web} and run `make apply` under each directory respectively
      * Submit a sample to the staging tier and make sure everything works fine

  5. Deploying the index to the prod tier: same as 4 except `s/staging/prod/`
    


## Components

## Synching Required Data from NCBI to S3 

  s3://idseq-database/ncbi-sources


## Build Indexes from  NT/NR 



## Build accession2taxid Lookup  Table and nt/nr Lookup Table


## Build Taxonomy and Lineage Database


## Update taxon_lineages table in idseq-web and switch to new index 


## Self-termination mechanisms


## Bonus: Adding a New Host Genome


