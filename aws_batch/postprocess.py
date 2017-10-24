#!/usr/bin/env python
import os
import sys
import multiprocessing
import subprocess
import json
import csv
import shelve
import argparse
import re
import time
import random
import datetime
import gzip
import logging
import math

INPUT_BUCKET = 's3://czbiohub-infectious-disease/UGANDA' # default to be overwritten by environment variable
OUTPUT_BUCKET = 's3://czbiohub-idseq-samples-test/id-uganda'  # default to be overwritten by environment variable
KEY_S3_PATH = 's3://czbiohub-infectious-disease/idseq-alpha.pem'
ROOT_DIR = '/mnt'
DEST_DIR = ROOT_DIR + '/idseq/data' # generated data go here
REF_DIR  = ROOT_DIR + '/idseq/ref' # referene genome / ref databases go here

ACCESSION2TAXID = 's3://czbiohub-infectious-disease/references/accession2taxid.db.gz'
LINEAGE_SHELF = 's3://czbiohub-infectious-disease/references/taxid-lineages.db'

# output files
TAXID_ANNOT_FASTA = 'taxid_annot_sorted.fasta'
TAXID_LOCATIONS_JSON = 'taxid_locations.json'

def accession2taxid(read_id, accession2taxid_dict, hit_type, lineage_map):
    accid_short = ((read_id.split(hit_type+':'))[1].split(":")[0]).split(".")[0]
    taxid = accession2taxid_dict.get(accid_short, "NA")
    species_taxid, genus_taxid, family_taxid = lineage_map.get(taxid, ("-1", "-2", "-3"))
    return species_taxid, genus_taxid, family_taxid

def generate_taxid_fasta_from_accid(input_fasta_file, accession2taxid_path, lineagePath, output_fasta_file):
    # currently annotates with species-level taxid; other ranks to be potentially implemented in the future
    accession2taxid_dict = shelve.open(accession2taxid_path)
    lineage_map = shelve.open(lineagePath)
    input_fasta_f = open(input_fasta_file, 'rb')
    output_fasta_f = open(output_fasta_file, 'wb')
    sequence_name = input_fasta_f.readline()
    sequence_data = input_fasta_f.readline()
    while len(sequence_name) > 0 and len(sequence_data) > 0:
        read_id = sequence_name.rstrip().lstrip('>') # example read_id: "NR::NT:CP010376.2:NB501961:14:HM7TLBGX2:1:23109:12720:8743/2"
        nr_taxid_species, nr_taxid_genus, nr_taxid_family = accession2taxid(read_id, accession2taxid_dict, 'NR', lineage_map)
        nt_taxid_species, nt_taxid_genus, nt_taxid_family = accession2taxid(read_id, accession2taxid_dict, 'NT', lineage_map)
        new_read_name = ('nr:' + nr_taxid_family + ':nt:' + nt_taxid_family
                         + ':nr:' + nr_taxid_genus + ':nt:' + nt_taxid_genus
                         + ':nr:' + nr_taxid_species + ':nt:' + nt_taxid_species
                         + ':' + read_id)
        output_fasta_f.write(">%s\n" % new_read_name)
        output_fasta_f.write(sequence_data)
        sequence_name = input_fasta_f.readline()
        sequence_data = input_fasta_f.readline()
    input_fasta_f.close()
    output_fasta_f.close()

def run_generate_taxid_fasta_from_accid(sample_name, input_fasta, accession2taxid_s3_path, lineage_s3_path,
    output_fasta, result_dir, sample_s3_output_path, lazy_run):
    if lazy_run:
        # check if output already exists
        if os.path.isfile(output_fasta):
            return 1
    accession2taxid_gz = os.path.basename(accession2taxid_s3_path)
    accession2taxid_path = REF_DIR + '/' + accession2taxid_gz[:-3]
    if not os.path.isfile(accession2taxid_path):
        execute_command("aws s3 cp %s %s/" % (accession2taxid_s3_path, REF_DIR))
        execute_command("cd %s; gunzip %s" % (REF_DIR, accession2taxid_gz))
        logging.getLogger().info("downloaded accession-to-taxid map")
    lineage_filename = os.path.basename(lineage_s3_path)
    lineage_path = REF_DIR + '/' + lineage_filename
    if not os.path.isfile(lineage_path):
        execute_command("aws s3 cp %s %s/" % (lineage_s3_path, REF_DIR))
        logging.getLogger().info("downloaded taxid-lineage shelf")
    generate_taxid_fasta_from_accid(input_fasta, accession2taxid_path, lineage_path, output_fasta)
    logging.getLogger().info("finished job")
    execute_command("aws s3 cp %s %s/" % (output_fasta, sample_s3_output_path))


