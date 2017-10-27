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

KEY_S3_PATH = 's3://czbiohub-infectious-disease/idseq-alpha.pem'
ROOT_DIR = '/mnt'
DEST_DIR = ROOT_DIR + '/idseq/data' # generated data go here
REF_DIR  = ROOT_DIR + '/idseq/ref' # referene genome / ref databases go here
TEMP_DIR = ROOT_DIR + '/tmp' # tmp directory with a lot of space for sorting large files

# Global variable examples, to be overwritten by environment variables
INPUT_BUCKET = 's3://czbiohub-idseq-samples-development/samples/3/60/results'
OUTPUT_BUCKET = 's3://czbiohub-idseq-samples-development/samples/3/60/postprocess'

# references
ACCESSION2TAXID = 's3://czbiohub-infectious-disease/references/accession2taxid.db.gz'
LINEAGE_SHELF = 's3://czbiohub-infectious-disease/references/taxid-lineages.db'

# input files
ACCESSION_ANNOTATED_FASTA = 'taxids.rapsearch2.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.fasta'

# output files
TAXID_ANNOT_FASTA = 'taxid_annot.fasta'
TAXID_ANNOT_SORTED_FASTA_NT = 'taxid_annot_sorted_nt.fasta'
TAXID_ANNOT_SORTED_FASTA_NR = 'taxid_annot_sorted_nr.fasta'
TAXID_ANNOT_SORTED_FASTA_GENUS_NT = 'taxid_annot_sorted_genus_nt.fasta'
TAXID_ANNOT_SORTED_FASTA_GENUS_NR = 'taxid_annot_sorted_genus_nr.fasta'
TAXID_ANNOT_SORTED_FASTA_FAMILY_NT = 'taxid_annot_sorted_family_nt.fasta'
TAXID_ANNOT_SORTED_FASTA_FAMILY_NR = 'taxid_annot_sorted_family_nr.fasta'
TAXID_LOCATIONS_JSON_NT = 'taxid_locations_nt.json'
TAXID_LOCATIONS_JSON_NR = 'taxid_locations_nr.json'
TAXID_LOCATIONS_JSON_GENUS_NT = 'taxid_locations_genus_nt.json'
TAXID_LOCATIONS_JSON_GENUS_NR = 'taxid_locations_genus_nr.json'
TAXID_LOCATIONS_JSON_FAMILY_NT = 'taxid_locations_family_nt.json'
TAXID_LOCATIONS_JSON_FAMILY_NR = 'taxid_locations_family_nr.json'
TAXID_LOCATIONS_JSON_ALL = 'taxid_locations_combined.json'
LOGS_OUT_BASENAME = 'postprocess-log'

# convenience functions
def return_merged_dict(dict1, dict2):
    result = dict1.copy()
    result.update(dict2)
    return result

# processing functions
def accession2taxid(read_id, accession2taxid_dict, hit_type, lineage_map):
    accid_short = ((read_id.split(hit_type+':'))[1].split(":")[0]).split(".")[0]
    taxid = accession2taxid_dict.get(accid_short, "NA")
    species_taxid, genus_taxid, family_taxid = lineage_map.get(taxid, ("-100", "-200", "-300"))
    return species_taxid, genus_taxid, family_taxid

def generate_taxid_fasta_from_accid(input_fasta_file, accession2taxid_path, lineagePath, output_fasta_file):
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
        new_read_name = ('family_nr:' + nr_taxid_family + ':family_nt:' + nt_taxid_family
                         + ':genus_nr:' + nr_taxid_genus + ':genus_nt:' + nt_taxid_genus
                         + ':species_nr:' + nr_taxid_species + ':species_nt:' + nt_taxid_species
                         + ':' + read_id)
        output_fasta_f.write(">%s\n" % new_read_name)
        output_fasta_f.write(sequence_data)
        sequence_name = input_fasta_f.readline()
        sequence_data = input_fasta_f.readline()
    input_fasta_f.close()
    output_fasta_f.close()

def get_taxid(sequence_name, taxid_field):
    parts = sequence_name.replace('>', ':').split(":%s:" % taxid_field)
    if len(parts) <= 1:
        # sequence_name empty or taxid_field not found
        return 'none'
    taxid = parts[1].split(":")[0]
    # example sequence_name: ">nr:-100:nt:684552:NR::NT:LT629734.1:HWI-ST640:828:H917FADXX:2:1101:1424:15119/1"
    return taxid

def get_taxid_field_num(taxid_field, fasta_file):
    with open(output_fasta) as f:
        sequence_name = f.readline()
    return sequence_name.split(":").index(taxid_field) + 1

def generate_taxid_locator(input_fasta, taxid_field, hit_type, output_fasta, output_json):
    taxid_field_num = get_taxid_field_num(taxid_field, input_fasta)
    # put every 2-line fasta record on a single line with delimiter ":lineseparator:":
    command = "awk 'NR % 2 == 1 { o=$0 ; next } { print o \":lineseparator:\" $0 }' " + input_fasta
    # sort the records based on the field containing the taxids:
    command += " | sort -T %s --key %s --field-separator ':' --numeric-sort" % (TEMP_DIR, taxid_field_num)
    # split every record back over 2 lines:
    command += " | sed 's/:lineseparator:/\\n/g' > %s" % output_fasta
    subprocess.check_output(command, shell=True)
    # make json giving byte range of file corresponding to each taxid:
    taxon_sequence_locations = []
    f = open(output_fasta, 'rb')
    sequence_name = f.readline()
    sequence_data = f.readline()
    taxid = get_taxid(sequence_name, taxid_field)
    first_byte = 0
    end_byte = first_byte + len(sequence_name) + len(sequence_data)
    while len(sequence_name) > 0 and len(sequence_data) > 0:
        sequence_name = f.readline()
        sequence_data = f.readline()
        new_taxid = get_taxid(sequence_name, taxid_field)
        if new_taxid != taxid:
            # Note on boundary condition: when end of file is reached, then
            # sequence_name == '' => new_taxid=='none' => new_taxid != taxid
            # so last record will be written to output correctly.
            taxon_sequence_locations.append({'taxid': taxid, 'first_byte': first_byte,
                                             'last_byte': end_byte - 1, 'hit_type': hit_type})
            taxid = new_taxid
            first_byte = end_byte
            end_byte = first_byte + len(sequence_name) + len(sequence_data)
        else:
            end_byte += len(sequence_name) + len(sequence_data)
    f.close()
    with open(output_json, 'wb') as f:
       json.dump(taxon_sequence_locations, f)

def combine_json(input_json_list, output_json):
    output = []
    for input_json in input_json_list:
        with open(input_json) as f:
            output.append(json.load(f))
    with open(output_json, 'wb') as outf:
        json.dump(output, outf)

# job functions
def execute_command(command):
    print command
    output = subprocess.check_output(command, shell=True)
    return output

class TimeFilter(logging.Filter):
    def filter(self, record):
        try:
          last = self.last
        except AttributeError:
          last = record.relativeCreated
        delta = datetime.datetime.fromtimestamp(record.relativeCreated/1000.0) - datetime.datetime.fromtimestamp(last/1000.0)
        record.time_since_last = '{0:.2f}'.format(delta.seconds + delta.microseconds/1000000.0)
        self.last = record.relativeCreated
        return True

def run_and_log(logparams, func_name, *args):
    logger = logging.getLogger()
    logger.info("========== %s ==========" % logparams.get("title"))
    # produce the output
    func_return = func_name(*args)
    if func_return == 1:
        logger.info("output exists, lazy run")
    else:
        logger.info("uploaded output")
    # copy log file
    execute_command("aws s3 cp %s %s/;" % (logger.handlers[0].baseFilename, logparams["sample_s3_output_path"]))

def run_generate_taxid_fasta_from_accid(input_fasta, accession2taxid_s3_path, lineage_s3_path,
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

def run_generate_taxid_locator(input_fasta, taxid_field, hit_type, output_fasta, output_json,
    result_dir, sample_s3_output_path, lazy_run):
    if lazy_run:
        # check if output already exists
        if os.path.isfile(output_fasta):
            return 1
    generate_taxid_locator(input_fasta, taxid_field, hit_type, output_fasta, output_json)
    logging.getLogger().info("finished job")
    execute_command("aws s3 cp %s %s/" % (output_fasta, sample_s3_output_path))
    execute_command("aws s3 cp %s %s/" % (output_json, sample_s3_output_path))

def run_combine_json(input_json_list, output_json, result_dir, sample_s3_output_path, lazy_run):
    if lazy_run:
        # check if output already exists
        if os.path.isfile(output_json):
            return 1
    combine_json(input_json_list, output_json)
    logging.getLogger().info("finished job")
    execute_command("aws s3 cp %s %s/" % (output_json, sample_s3_output_path))

def run_sample(sample_s3_input_path, sample_s3_output_path, aws_batch_job_id, lazy_run = True):

    sample_s3_output_path = sample_s3_output_path.rstrip('/')
    sample_name = sample_s3_input_path[5:].rstrip('/').replace('/','-')
    sample_dir = DEST_DIR + '/' + sample_name
    input_dir = sample_dir + '/inputs'
    result_dir = sample_dir + '/results'
    scratch_dir = sample_dir + '/scratch'
    execute_command("mkdir -p %s %s %s %s" % (sample_dir, input_dir, result_dir, scratch_dir))
    execute_command("mkdir -p %s " % REF_DIR);
    execute_command("mkdir -p %s " % TEMP_DIR);

    # configure logger
    log_file = "%s/%s-%s.txt" % (result_dir, LOGS_OUT_BASENAME, aws_batch_job_id)
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    handler = logging.FileHandler(log_file)
    formatter = logging.Formatter("%(asctime)s (%(time_since_last)ss elapsed): %(message)s")
    handler.addFilter(TimeFilter())
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    DEFAULT_LOGPARAMS = {"sample_s3_output_path": sample_s3_output_path}

    # download input
    execute_command("aws s3 cp %s/%s %s/" % (sample_s3_input_path, ACCESSION_ANNOTATED_FASTA, input_dir))
    input_file = os.path.join(input_dir, ACCESSION_ANNOTATED_FASTA)

    if lazy_run:
       # Download existing data and see what has been done
        command = "aws s3 cp %s %s --recursive" % (sample_s3_output_path, result_dir)
        print execute_command(command)

    # generate taxid fasta
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "run_generate_taxid_fasta_from_accid"})
    run_and_log(logparams, run_generate_taxid_fasta_from_accid,
        input_file, ACCESSION2TAXID, LINEAGE_SHELF,
        os.path.join(result_dir, TAXID_ANNOT_FASTA),
        result_dir, sample_s3_output_path, False)

    # SPECIES level
    # generate taxid locator for NT
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "run_generate_taxid_locator for NT"})
    run_and_log(logparams, run_generate_taxid_locator,
        os.path.join(result_dir, TAXID_ANNOT_FASTA), 'species_nt', 'NT',
        os.path.join(result_dir, TAXID_ANNOT_SORTED_FASTA_NT),
        os.path.join(result_dir, TAXID_LOCATIONS_JSON_NT),
        result_dir, sample_s3_output_path, False)

    # generate taxid locator for NR
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "run_generate_taxid_locator for NR"})
    run_and_log(logparams, run_generate_taxid_locator,
        os.path.join(result_dir, TAXID_ANNOT_FASTA), 'species_nr', 'NR',
        os.path.join(result_dir, TAXID_ANNOT_SORTED_FASTA_NR),
        os.path.join(result_dir, TAXID_LOCATIONS_JSON_NR),
        result_dir, sample_s3_output_path, False)

    # GENUS level
    # generate taxid locator for NT
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "run_generate_taxid_locator for NT"})
    run_and_log(logparams, run_generate_taxid_locator,
        os.path.join(result_dir, TAXID_ANNOT_FASTA), 'genus_nt', 'NT',
        os.path.join(result_dir, TAXID_ANNOT_SORTED_FASTA_GENUS_NT),
        os.path.join(result_dir, TAXID_LOCATIONS_JSON_GENUS_NT),
        result_dir, sample_s3_output_path, False)

    # generate taxid locator for NR
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "run_generate_taxid_locator for NR"})
    run_and_log(logparams, run_generate_taxid_locator,
        os.path.join(result_dir, TAXID_ANNOT_FASTA), 'genus_nr', 'NR',
        os.path.join(result_dir, TAXID_ANNOT_SORTED_FASTA_GENUS_NR),
        os.path.join(result_dir, TAXID_LOCATIONS_JSON_GENUS_NR),
        result_dir, sample_s3_output_path, False)

    # FAMILY level
    # generate taxid locator for NT
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "run_generate_taxid_locator for NT"})
    run_and_log(logparams, run_generate_taxid_locator,
        os.path.join(result_dir, TAXID_ANNOT_FASTA), 'family_nt', 'NT',
        os.path.join(result_dir, TAXID_ANNOT_SORTED_FASTA_FAMILY_NT),
        os.path.join(result_dir, TAXID_LOCATIONS_JSON_FAMILY_NT),
        result_dir, sample_s3_output_path, False)

    # generate taxid locator for NR
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "run_generate_taxid_locator for NR"})
    run_and_log(logparams, run_generate_taxid_locator,
        os.path.join(result_dir, TAXID_ANNOT_FASTA), 'family_nr', 'NR',
        os.path.join(result_dir, TAXID_ANNOT_SORTED_FASTA_FAMILY_NR),
        os.path.join(result_dir, TAXID_LOCATIONS_JSON_FAMILY_NR),
        result_dir, sample_s3_output_path, False)

    # combine results
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "run_combine_json"})
    input_files_basenames = [TAXID_LOCATIONS_JSON_NT, TAXID_LOCATIONS_JSON_NR,
                             TAXID_LOCATIONS_JSON_GENUS_NT, TAXID_LOCATIONS_JSON_GENUS_NR,
                             TAXID_LOCATIONS_JSON_FAMILY_NT, TAXID_LOCATIONS_JSON_FAMILY_NR]
    input_files = [os.path.join(result_dir, file) for file in input_files_basenames]
    run_and_log(logparams, run_combine_json,
         input_files, os.path.join(result_dir, TAXID_LOCATIONS_JSON_ALL),
         result_dir, sample_s3_output_path, False)

# Main
def main():
    global INPUT_BUCKET
    global OUTPUT_BUCKET
    INPUT_BUCKET = os.environ.get('INPUT_BUCKET', INPUT_BUCKET)
    OUTPUT_BUCKET = os.environ.get('OUTPUT_BUCKET', OUTPUT_BUCKET)
    AWS_BATCH_JOB_ID = os.environ.get('AWS_BATCH_JOB_ID', 'local')
    sample_s3_input_path = INPUT_BUCKET.rstrip('/')
    sample_s3_output_path = OUTPUT_BUCKET.rstrip('/')

    run_sample(sample_s3_input_path, sample_s3_output_path, AWS_BATCH_JOB_ID, True)

if __name__=="__main__":
    main()
