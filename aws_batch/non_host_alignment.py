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
import threading
import shutil
from common import *

# data directories
FASTQ_BUCKET = None # bucket with initial input files
INPUT_BUCKET = None # input for this stage, i.e. result bucket from previous stage
OUTPUT_BUCKET = None
SAMPLE_S3_FASTQ_PATH = None
SAMPLE_S3_INPUT_PATH = None
SAMPLE_S3_OUTPUT_PATH = None
SAMPLE_S3_OUTPUT_CHUNKS_PATH = None
SAMPLE_NAME = None
SAMPLE_DIR = None
FASTQ_DIR = None
RESULT_DIR = None
CHUNKS_RESULT_DIR = None
ROOT_DIR = '/mnt'
DEST_DIR = ROOT_DIR + '/idseq/data' # generated data go here
REF_DIR = ROOT_DIR + '/idseq/ref' # referene genome / ref databases go here

# pipeline configuration
FILE_TYPE = 'fastq.gz'
ENVIRONMENT = 'production'

# compute capacity
GSNAPL_MAX_CONCURRENT = 5 # number of gsnapl jobs allowed to run concurrently on 1 machine
RAPSEARCH2_MAX_CONCURRENT = 3
GSNAPL_CHUNK_SIZE = 30000 # number of fasta records in a chunk
RAPSEARCH_CHUNK_SIZE = 10000
KEY_S3_PATH = None

# references
ACCESSION2TAXID = 's3://czbiohub-infectious-disease/references/accession2taxid.db.gz'
DEUTEROSTOME_TAXIDS = 's3://czbiohub-infectious-disease/references/deuterostome_taxids.txt'
TAXID_TO_INFO = 's3://czbiohub-infectious-disease/references/taxon_info.db'
LINEAGE_SHELF = 's3://czbiohub-infectious-disease/references/taxid-lineages.db'

# definitions for integration with web app
TAX_LEVEL_SPECIES = 1
TAX_LEVEL_GENUS = 2

# output files
EXTRACT_UNMAPPED_FROM_SAM_OUT1 = 'unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.1.fasta'
EXTRACT_UNMAPPED_FROM_SAM_OUT2 = 'unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.2.fasta'
EXTRACT_UNMAPPED_FROM_SAM_OUT3 = 'unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.merged.fasta'
GSNAPL_OUT = 'gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.m8'
GSNAPL_DEDUP_OUT = 'dedup.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.m8'
ANNOTATE_GSNAPL_M8_WITH_TAXIDS_OUT = 'taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.m8'
GENERATE_TAXID_ANNOTATED_FASTA_FROM_M8_OUT = 'taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.fasta'
FILTER_DEUTEROSTOME_FROM_TAXID_ANNOTATED_FASTA_OUT = 'filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.fasta'
RAPSEARCH2_OUT = 'rapsearch2.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.m8'
FILTER_DEUTEROSTOMES_FROM_NT_M8_OUT = 'filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.m8'
NT_M8_TO_TAXID_COUNTS_FILE_OUT = 'counts.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.csv'
NT_TAXID_COUNTS_TO_JSON_OUT = 'counts.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.json'
NT_TAXID_COUNTS_TO_SPECIES_RPM_OUT = 'species.rpm.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.csv'
NT_TAXID_COUNTS_TO_GENUS_RPM_OUT = 'genus.rpm.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.csv'
ANNOTATE_RAPSEARCH2_M8_WITH_TAXIDS_OUT = 'taxids.rapsearch2.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.m8'
GENERATE_TAXID_ANNOTATED_FASTA_FROM_RAPSEARCH2_M8_OUT = 'taxids.rapsearch2.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.fasta'
FILTER_DEUTEROSTOMES_FROM_NR_M8_OUT = 'filter.deuterostomes.taxids.rapsearch2.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.m8'
NR_M8_TO_TAXID_COUNTS_FILE_OUT = 'counts.filter.deuterostomes.taxids.rapsearch2.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.csv'
NR_TAXID_COUNTS_TO_JSON_OUT = 'counts.filter.deuterostomes.taxids.rapsearch2.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.json'
NR_TAXID_COUNTS_TO_SPECIES_RPM_OUT = 'species.rpm.filter.deuterostomes.taxids.rapsearch2.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.csv'
NR_TAXID_COUNTS_TO_GENUS_RPM_OUT = 'genus.rpm.filter.deuterostomes.taxids.rapsearch2.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.csv'
UNIDENTIFIED_FASTA_OUT = 'unidentified.fasta'
COMBINED_JSON_OUT = 'idseq_web_sample.json'
LOGS_OUT_BASENAME = 'log'
STATS_OUT = 'stats.json'

# statistics and logging
DEFAULT_LOGPARAMS = {}
TARGET_OUTPUTS = None
AWS_BATCH_JOB_ID = None

# convenience functions
def concatenate_files(file_list, output_file):
    with open(output_file, 'wb') as outf:
        for f in file_list:
            with open(f, 'rb') as fd:
                shutil.copyfileobj(fd, outf)

def generate_taxid_annotated_fasta_from_m8(input_fasta_file, m8_file, output_fasta_file, annotation_prefix):
    '''Tag reads based on the m8 output'''
    # Example:  generate_annotated_fasta_from_m8('filter.unmapped.merged.fasta',
    #  'bowtie.unmapped.star.gsnapl-nt-k16.m8', 'NT-filter.unmapped.merged.fasta', 'NT')
    # Construct the m8_hash
    read_to_accession_id = {}
    with open(m8_file, 'rb') as m8f:
        for line in m8f:
            if line[0] == '#':
                continue
            parts = line.split("\t")
            log_corrupt(len(parts) < 12, m8_file, line)
            read_name = parts[0]
            read_name_parts = read_name.split("/")
            if len(read_name_parts) > 1:
                output_read_name = read_name_parts[0] + '/' + read_name_parts[-1]
            else:
                output_read_name = read_name
            accession_id = parts[1]
            read_to_accession_id[output_read_name] = accession_id
    # Go through the input_fasta_file to get the results and tag reads
    input_fasta_f = open(input_fasta_file, 'rb')
    output_fasta_f = open(output_fasta_file, 'wb')
    sequence_name = input_fasta_f.readline()
    sequence_data = input_fasta_f.readline()
    while sequence_name and sequence_data:
        read_id = sequence_name.rstrip().lstrip('>')
        accession = read_to_accession_id.get(read_id, '')
        new_read_name = annotation_prefix + ':' + accession + ':' + read_id
        output_fasta_f.write(">%s\n" % new_read_name)
        output_fasta_f.write(sequence_data)
        sequence_name = input_fasta_f.readline()
        sequence_data = input_fasta_f.readline()
    input_fasta_f.close()
    output_fasta_f.close()

def deduplicate_m8(input_m8, output_m8):
    outf = open(output_m8, "wb")
    previous_read_name = ''
    with open(input_m8, "rb") as m8f:
        for line in m8f:
            if line[0] == '#':
                continue
            parts = line.split("\t")
            read_name = parts[0] # Example: HWI-ST640:828:H917FADXX:2:1108:8883:88679/1/1'
            if read_name == previous_read_name:
                continue
            outf.write(line)
            previous_read_name = read_name
    outf.close()

def log_corrupt(is_corrupt, m8_file, line):
    if is_corrupt:
        write_to_log(m8_file + " is corrupt at line:\n" + line + "\n----> delete it and its corrupt ancestors before restarting run")
        raise AssertionError

def generate_tax_counts_from_m8(m8_file, e_value_type, output_file, lineage_map):
    taxid_count_map = {}
    taxid_percent_identity_map = {}
    taxid_alignment_length_map = {}
    taxid_e_value_map = {}
    read_to_taxid = {}

    with open(m8_file, 'rb') as m8f:
        for line in m8f:

            # Get taxid:
            line_columns = line.split("\t")
            # If file is corrupt, log it:
            log_corrupt(len(line_columns) < 12, m8_file, line)
            # Otherwise continue processing:
            read_id_column = line_columns[0]
            taxid = (read_id_column.split("taxid"))[1].split(":")[0]
            species_taxid, genus_taxid, family_taxid = lineage_map.get(taxid, ("-100", "-200", "-300"))

            # Get raw read ID without our annotations:
            # If m8 is from gsnap (case 1), 1 field has been prepended (taxid field).
            # If m8 is from rapsearch in an old version of the pipeline (case 2), 3 fields have been prepended (taxid, 'NT', NT accession ID).
            # If m8 is from rapsearch in a newer version of the pipeline (case 3), many fields have been prepended (taxid, alignment info fields),
            # but the delimiter ":read_id:" marks the beginning of the raw read ID.
            read_id_column = read_id_column.split(":", 1)[1] # remove taxid field (all cases)
            if ":read_id:" in read_id_column: # case 3
                raw_read_id = read_id_column.split(":read_id:")[1]
            elif read_id_column.startswith("NT:"): # case 2
                raw_read_id = read_id_column.split(":", 2)[2]
            else: # case 1
                raw_read_id = read_id_column

            # Get alignment quality metrics from m8 format (blast format 8):
            #   %id, alignment length, mismatches, gap openings, query start, query end,
            #   subject start, subject end, E value (log10 if rapsearch2 output), bit score
            # E value is a negative power of 10. GSNAPL outputs raw e-value, RAPSearch2 outputs log10(e-value).
            # Whenever we use "e_value" it refers to log10(e-value), which is easier to handle.
            percent_identity = float(line_columns[2])
            alignment_length = float(line_columns[3])
            e_value = float(line_columns[10])
            if e_value_type != 'log10':
                e_value = math.log10(e_value)
            taxid_count_map[taxid] = taxid_count_map.get(taxid, 0) + 1
            taxid_percent_identity_map[taxid] = taxid_percent_identity_map.get(taxid, 0) + percent_identity
            taxid_alignment_length_map[taxid] = taxid_alignment_length_map.get(taxid, 0) + alignment_length
            taxid_e_value_map[taxid] = taxid_e_value_map.get(taxid, 0) + e_value

            # Keep mapping of read ids to taxids in order to determine pair concordance later:
            read_to_taxid[raw_read_id] = (species_taxid, genus_taxid, family_taxid)

    # Write results:
    with open(output_file, 'w') as f:
        for taxid in taxid_count_map.keys():
            count = taxid_count_map[taxid]
            avg_percent_identity = taxid_percent_identity_map[taxid] / count
            avg_alignment_length = taxid_alignment_length_map[taxid] / count
            avg_e_value = taxid_e_value_map[taxid] / count
            f.write(",".join([str(taxid), str(count), str(avg_percent_identity), str(avg_alignment_length), str(avg_e_value) + '\n']))
    # Determine pair concordance:
    return check_pair_concordance(read_to_taxid)

def check_pair_concordance(read_to_taxid):
    species_taxid_concordance_map = {}
    genus_taxid_concordance_map = {}
    family_taxid_concordance_map = {}
    read_1_ids = [read_id for read_id in read_to_taxid.keys() if "/1" in read_id]
    for read_1_id in read_1_ids:
        read_2_id = read_1_id.replace("/1", "/2", 1)
        if read_2_id not in read_to_taxid:
            continue
        species_taxid_1, genus_taxid_1, family_taxid_1 = read_to_taxid[read_1_id]
        species_taxid_2, genus_taxid_2, family_taxid_2 = read_to_taxid[read_2_id]
        if species_taxid_1 == species_taxid_2: # add both reads to the concordance count
            species_taxid_concordance_map[species_taxid_1] = species_taxid_concordance_map.get(species_taxid_1, 0) + 2
        if genus_taxid_1 == genus_taxid_2:
            genus_taxid_concordance_map[genus_taxid_1] = genus_taxid_concordance_map.get(genus_taxid_1, 0) + 2
        if family_taxid_1 == family_taxid_2:
            family_taxid_concordance_map[family_taxid_1] = family_taxid_concordance_map.get(family_taxid_1, 0) + 2
    return species_taxid_concordance_map, genus_taxid_concordance_map, family_taxid_concordance_map

def generate_rpm_from_taxid_counts(taxidCountsInputPath, taxid2infoPath, speciesOutputPath, genusOutputPath):
    total_reads = get_total_reads_from_stats()
    taxid2info_map = shelve.open(taxid2infoPath)
    species_rpm_map = {}
    genus_rpm_map = {}
    species_name_map = {}
    genus_name_map = {}
    with open(taxidCountsInputPath) as f:
        for line in f:
            tok = line.rstrip().split(",")
            taxid = tok[0]
            count = float(tok[1])
            species_taxid, genus_taxid, scientific_name = taxid2info_map.get(taxid, ("NA", "NA", "NA"))
            species_rpm_map[species_taxid] = float(species_rpm_map.get(species_taxid, 0)) + count/total_reads*1000000.0
            genus_rpm_map[genus_taxid] = float(genus_rpm_map.get(genus_taxid, 0)) + count/total_reads*1000000.0
            species_name_map[species_taxid] = scientific_name
            genus_name_map[genus_taxid] = scientific_name.split()[0]
    species_outf = open(speciesOutputPath, 'w')
    species_taxids = species_rpm_map.keys()
    for species_taxid in sorted(species_taxids, key=lambda species_taxid: species_rpm_map.get(species_taxid), reverse=True):
        species_name = species_name_map.get(species_taxid, "NA")
        rpm = species_rpm_map.get(species_taxid)
        species_outf.write("%s,%s,%s\n" % (species_taxid, species_name, rpm))
    species_outf.close()
    genus_outf = open(genusOutputPath, 'w')
    genus_taxids = genus_rpm_map.keys()
    for genus_taxid in sorted(genus_taxids, key=lambda genus_taxid: genus_rpm_map.get(genus_taxid), reverse=True):
        genus_name = genus_name_map.get(genus_taxid, "NA")
        rpm = genus_rpm_map.get(genus_taxid)
        genus_outf.write("%s,%s,%s\n" % (genus_taxid, genus_name, rpm))
    genus_outf.close()

def generate_json_from_taxid_counts(taxidCountsInputPath, taxid2infoPath, jsonOutputPath, countType, lineage_map,
                                    species_total_concordant, genus_total_concordant, family_total_concordant):
    taxid2info_map = shelve.open(taxid2infoPath)
    total_reads = get_total_reads_from_stats()
    taxon_counts_attributes = []
    remaining_reads = get_remaining_reads_from_stats()

    species_to_count = {}
    species_to_name = {}
    species_to_percent_identity = {}
    species_to_alignment_length = {}
    species_to_e_value = {}
    species_to_species_level_concordance = {}
    species_to_genus_level_concordance = {}
    species_to_family_level_concordance = {}
    with open(taxidCountsInputPath) as f:
        for line in f:
            tok = line.rstrip().split(",")
            taxid = tok[0]
            count = float(tok[1])
            percent_identity = float(tok[2])
            alignment_length = float(tok[3])
            e_value = float(tok[4])
            _species_taxid, _genus_taxid, scientific_name = taxid2info_map.get(taxid, ("-1", "-2", "NA"))
            species_taxid, genus_taxid, family_taxid = lineage_map.get(taxid, ("-100", "-200", "-300"))
            species_to_count[species_taxid] = species_to_count.get(species_taxid, 0) + count
            species_to_name[species_taxid] = scientific_name
            species_to_percent_identity[species_taxid] = species_to_percent_identity.get(species_taxid, 0) + count * percent_identity
            species_to_alignment_length[species_taxid] = species_to_alignment_length.get(species_taxid, 0) + count * alignment_length
            species_to_e_value[species_taxid] = species_to_e_value.get(species_taxid, 0) + count * e_value
            species_to_species_level_concordance[species_taxid] = species_total_concordant.get(species_taxid, 0)
            species_to_genus_level_concordance[species_taxid] = genus_total_concordant.get(genus_taxid, 0)
            species_to_family_level_concordance[species_taxid] = family_total_concordant.get(family_taxid, 0)

    for taxid in species_to_count.keys():
        species_name = species_to_name[taxid]
        count = species_to_count[taxid]
        avg_percent_identity = species_to_percent_identity[taxid] / count
        avg_alignment_length = species_to_alignment_length[taxid] / count
        avg_e_value = species_to_e_value[taxid] / count
        taxon_counts_attributes.append({"tax_id": taxid,
                                        "tax_level": TAX_LEVEL_SPECIES,
                                        "count": count,
                                        "percent_identity": avg_percent_identity,
                                        "alignment_length": avg_alignment_length,
                                        "e_value": avg_e_value,
                                        "name": species_name,
                                        "count_type": countType,
                                        "percent_concordant": (100.0 * species_to_species_level_concordance[taxid]) / count,
                                        # Not very elegant, but until such time as we propagate alignment information at the level of
                                        # individual reads to the web app's database, we have to do the concordance aggregation here:
                                        "species_total_concordant": species_to_species_level_concordance[taxid],
                                        "genus_total_concordant": species_to_genus_level_concordance[taxid],
                                        "family_total_concordant": species_to_family_level_concordance[taxid]})

    output_dict = {
        "pipeline_output": {
            "total_reads": total_reads,
            "remaining_reads": remaining_reads,
            "taxon_counts_attributes": taxon_counts_attributes
      }
    }
    with open(jsonOutputPath, 'wb') as outf:
        json.dump(output_dict, outf)

def combine_pipeline_output_json(inputPath1, inputPath2, outputPath):
    total_reads = get_total_reads_from_stats()
    remaining_reads = get_remaining_reads_from_stats()
    with open(inputPath1) as inf1:
        input1 = json.load(inf1).get("pipeline_output")
    with open(inputPath2) as inf2:
        input2 = json.load(inf2).get("pipeline_output")
    taxon_counts_attributes = (input1.get("taxon_counts_attributes")
                              + input2.get("taxon_counts_attributes"))
    pipeline_output_dict = {
        "total_reads": total_reads,
        "remaining_reads": remaining_reads,
        "taxon_counts_attributes": taxon_counts_attributes
    }
    output_dict = {
        "pipeline_output": pipeline_output_dict
    }
    with open(outputPath, 'wb') as outf:
        json.dump(output_dict, outf)

def generate_taxid_annotated_m8(input_m8, output_m8, accession2taxid_db):
    accession2taxid_dict = shelve.open(accession2taxid_db)
    outf = open(output_m8, "wb")
    with open(input_m8, "rb") as m8f:
        for line in m8f:
            if line[0] == '#':
                continue
            parts = line.split("\t")
            log_corrupt(len(parts) < 12, input_m8, line)
            read_name = parts[0] # Example: HWI-ST640:828:H917FADXX:2:1108:8883:88679/1/1',
            accession_id = parts[1] # Example: CP000671.1',
            accession_id_short = accession_id.split(".")[0]
            new_line = "taxid" + accession2taxid_dict.get(accession_id_short, "NA") + ":" + line
            outf.write(new_line)
    outf.close()

def generate_merged_fasta(input_files, output_file):
    with open(output_file, 'w') as outfile:
        for fname in input_files:
            idx = input_files.index(fname) + 1
            with open(fname) as infile:
                for line in infile:
                    if line.startswith(">") and not "/" in line:
                        suffix = "/" + str(idx)
                    else:
                        suffix = ""
                    outfile.write(line.rstrip() + suffix + "\n")

def read_file_into_list(file_name):
    with open(file_name) as f:
        L = [x.rstrip() for x in f if x]
    return L

def filter_deuterostomes_from_m8(input_m8, output_m8, deuterostome_file):
    taxids_toremove = read_file_into_list(deuterostome_file)
    output_f = open(output_m8, 'wb')
    with open(input_m8, "rb") as input_f:
        for line in input_f:
            taxid = (line.split("taxid"))[1].split(":")[0]
            #"taxid9606:NB501961:14:HM7TLBGX2:1:12104:15431:..."
            if not taxid in taxids_toremove:
                output_f.write(line)
    output_f.close()

def filter_taxids_from_fasta(input_fa, output_fa, annotation_prefix, accession2taxid_path, deuterostome_file):
    taxids_toremove = read_file_into_list(deuterostome_file)
    accession2taxid_dict = shelve.open(accession2taxid_path)
    input_f = open(input_fa, 'rb')
    output_f = open(output_fa, 'wb')
    sequence_name = input_f.readline()
    sequence_data = input_f.readline()
    while sequence_name and sequence_data:
        read_id = sequence_name.rstrip().lstrip('>') # example read_id: "NR::NT:CP010376.2:NB501961:14:HM7TLBGX2:1:23109:12720:8743/2"
        split_on = annotation_prefix + ":"
        if not read_id.startswith(annotation_prefix):
            split_on = ":" + split_on # avoid any possible "NT:" where the NT could be part of the accession follwing "NR:"
        accession_id = (read_id.split(split_on))[1].split(":")[0]
        accession_id_short = accession_id.split(".")[0]
        taxid = accession2taxid_dict.get(accession_id_short, "NA")
        if not taxid in taxids_toremove:
            output_f.write(sequence_name)
            output_f.write(sequence_data)
        sequence_name = input_f.readline()
        sequence_data = input_f.readline()
    input_f.close()
    output_f.close()

def return_merged_dict(dict1, dict2):
    result = dict1.copy()
    result.update(dict2)
    return result

def environment_for_aligners(environment):
    return "production" ## temporary fix since we only have "production" gsnap/rapsearch machines right now

def get_key_path(environment):
    return "s3://czbiohub-infectious-disease/idseq-%s.pem" % environment_for_aligners(environment)

def wait_for_server(service_name, command, max_concurrent):
    while True:
        output = execute_command_with_output(command).rstrip().split("\n")
        if len(output) <= max_concurrent:
            print "%s server has capacity. Kicking off " % service_name
            return
        else:
            wait_seconds = random.randint(30, 60)
            print "%s server busy. %d processes running. Wait for %d seconds" % \
                  (service_name, len(output), wait_seconds)
            time.sleep(wait_seconds)

def get_server_ips(service_name, environment):
    tag = "service"
    value = "%s-%s" % (service_name, environment_for_aligners(environment))
    describe_json = json.loads(execute_command_with_output("aws ec2 describe-instances --filters 'Name=tag:%s,Values=%s' 'Name=instance-state-name,Values=running'" % (tag, value)))
    server_ips = []
    for reservation in describe_json["Reservations"]:
        for instance in reservation["Instances"]:
            server_ips += [instance["NetworkInterfaces"][0]["Association"]["PublicIp"]]
    return server_ips

def wait_for_server_ip(service_name, key_path, remote_username, environment, max_concurrent):
    instance_ips = get_server_ips(service_name, environment)
    i = 1
    while True:
        if i % 10 == 0: instance_ips = get_server_ips(service_name, environment)
        ip_nproc_dict = {}
        for ip in instance_ips:
            command = 'ssh -o "StrictHostKeyChecking no" -i %s %s@%s "ps aux|grep %s|grep -v bash" || echo "error"' % (key_path, remote_username, ip, service_name)
            output = execute_command_with_output(command).rstrip().split("\n")
            if output != ["error"]: ip_nproc_dict[ip] = len(output) - 1
        if not ip_nproc_dict:
            have_capacity = False
        else:
            min_nproc_ip = min(ip_nproc_dict, key=ip_nproc_dict.get)
            min_nproc = ip_nproc_dict[min_nproc_ip]
            have_capacity = (min_nproc <= max_concurrent)
        if have_capacity:
            print "%s server %s has capacity. Kicking off " % (service_name, min_nproc_ip)
            return min_nproc_ip
        else:
            wait_seconds = random.randint(30, 60)
            print "%s servers busy. Wait for %d seconds" % \
                  (service_name, wait_seconds)
            time.sleep(wait_seconds)
            i += 1

def check_s3_file_presence(s3_path):
    command = "aws s3 ls %s | wc -l" % s3_path
    try:
      return int(execute_command_with_output(command).rstrip())
    except:
      return 0

# job functions
def chunk_input(input_files_basenames, chunk_nlines, part_suffix):
    part_lists = []
    for input_file in input_files_basenames:
        input_file_full_local_path = os.path.join(RESULT_DIR, input_file)
        out_prefix = os.path.join(CHUNKS_RESULT_DIR, input_file) + part_suffix
        out_prefix_base = os.path.basename(out_prefix)
        execute_command("split --numeric-suffixes -l %d %s %s" % (chunk_nlines, input_file_full_local_path, out_prefix))
        execute_command("aws s3 cp %s/ %s/ --recursive --exclude '*' --include '%s*'" % (CHUNKS_RESULT_DIR, SAMPLE_S3_OUTPUT_CHUNKS_PATH, out_prefix_base))
        partial_files = [os.path.basename(partial_file) for partial_file in execute_command_with_output("ls %s*" % out_prefix).rstrip().split("\n")]
        part_lists.append(partial_files)
    input_chunks = [list(part) for part in zip(*part_lists)]
    # e.g. [["input_R1.fasta-part-1", "input_R2.fasta-part-1"],["input_R1.fasta-part-2", "input_R2.fasta-part-2"],["input_R1.fasta-part-3", "input_R2.fasta-part-3"],...]
    return input_chunks

def remove_whitespace_from_files(input_files, replacement, output_files):
    for idx, input_file in enumerate(input_files):
        output_file = output_files[idx]
        execute_command("sed 's/[[:blank:]]/%s/g' %s > %s" % (replacement, input_file, output_file))

def clean_direct_gsnapl_input(fastq_files):
    # unzip files if necessary
    if ".gz" in FILE_TYPE:
        subprocess.check_output(" ".join(["gunzip"] + fastq_files), shell=True)
        unzipped_files = [os.path.splitext(f)[0] for f in fastq_files]
    else:
        unzipped_files = fastq_files
    # convert to fasta if necessary
    file_type_trimmed = FILE_TYPE.split(".gz")[0]
    if file_type_trimmed == "fastq":
        file_prefixes = [os.path.splitext(f)[0] for f in unzipped_files]
        for file_prefix in file_prefixes:
            execute_command("sed -n '1~4s/^@/>/p;2~4p' <%s.fastq >%s.fasta" % (file_prefix, file_prefix))
        cleaned_files = [f + ".fasta" for f in file_prefixes]
    else:
        cleaned_files = unzipped_files
    # generate file type for log
    file_type_for_log = "fasta"
    if len(fastq_files) == 2:
        file_type_for_log += "_paired"
    # copy files to S3
    for f in cleaned_files:
        execute_command("aws s3 cp %s %s/" % (f, SAMPLE_S3_OUTPUT_PATH))
    return cleaned_files, file_type_for_log

def run_gsnapl_chunk(part_suffix, remote_home_dir, remote_index_dir, remote_work_dir, remote_username,
                     input_files, key_path, lazy_run):
        chunk_id = input_files[0].split(part_suffix)[-1]
        outfile_basename = 'gsnapl-out' + part_suffix + chunk_id
        dedup_outfile_basename = 'dedup-' + outfile_basename
        remote_outfile = os.path.join(remote_work_dir, outfile_basename)
        commands = "mkdir -p %s;" % remote_work_dir
        for input_fa in input_files:
            commands += "aws s3 cp %s/%s %s/ ; " % \
                     (SAMPLE_S3_OUTPUT_CHUNKS_PATH, input_fa, remote_work_dir)
        commands += " ".join([remote_home_dir+'/bin/gsnapl',
                              '-A', 'm8', '--batch=0', '--use-shared-memory=0',
                              '--gmap-mode=none', '--npaths=1', '--ordered',
                              '-t', '32',
                              '--maxsearch=5', '--max-mismatches=20',
                              '-D', remote_index_dir, '-d', 'nt_k16']
                              + [remote_work_dir+'/'+input_fa for input_fa in input_files]
                              + ['> '+remote_outfile, ';'])
        if not lazy_run or not check_s3_file_presence(os.path.join(SAMPLE_S3_OUTPUT_CHUNKS_PATH, dedup_outfile_basename)):
            correct_number_of_output_columns = 12
            min_column_number = 0
            max_tries = 2
            try_number = 1
            while (min_column_number != correct_number_of_output_columns and try_number <= max_tries):
                write_to_log("waiting for server")
                gsnapl_instance_ip = wait_for_server_ip('gsnap', key_path, remote_username, ENVIRONMENT, GSNAPL_MAX_CONCURRENT)
                write_to_log("starting alignment for chunk %s on machine %s" % (chunk_id, gsnapl_instance_ip))
                execute_command(remote_command(commands, key_path, remote_username, gsnapl_instance_ip))
                # check if every row has correct number of columns (12) in the output file on the remote machine
                verification_command = "awk '{print NF}' %s | sort -nu | head -n 1" % remote_outfile
                min_column_number = float(execute_command_with_output(remote_command(verification_command, key_path, remote_username, gsnapl_instance_ip)))
                write_to_log("Try no. %d: Smallest number of columns observed in any line was %d" % (try_number, min_column_number))
                try_number += 1
            # move output from remote machine to s3
            assert min_column_number == correct_number_of_output_columns, "Chunk %s output corrupt; not copying to S3. Re-start pipeline to try again." % chunk_id
            upload_command = "echo '' >> %s;" % remote_outfile # add a blank line at the end of the file so S3 copy doesn't fail if output is empty
            upload_command += "aws s3 cp %s %s/;" % (remote_outfile, SAMPLE_S3_OUTPUT_CHUNKS_PATH)
            execute_command(remote_command(upload_command, key_path, remote_username, gsnapl_instance_ip))
        # move gsnapl output from s3 to local
        time.sleep(10)
        write_to_log("finished alignment for chunk %s" % chunk_id)
        execute_command("aws s3 cp %s/%s %s/" % (SAMPLE_S3_OUTPUT_CHUNKS_PATH, outfile_basename, CHUNKS_RESULT_DIR))
        # Deduplicate m8 input. Sometimes GSNAPL outputs multiple consecutive lines for same original read and same accession id. Count functions expect only 1 (top hit).
        deduplicate_m8(os.path.join(CHUNKS_RESULT_DIR, outfile_basename), os.path.join(CHUNKS_RESULT_DIR, dedup_outfile_basename))
        execute_command("aws s3 cp %s/%s %s/" % (CHUNKS_RESULT_DIR, dedup_outfile_basename, SAMPLE_S3_OUTPUT_CHUNKS_PATH))
        execute_command("sed -i '$ {/^$/d;}' %s" % os.path.join(CHUNKS_RESULT_DIR, dedup_outfile_basename)) # remove blank line from end of file
        return os.path.join(CHUNKS_RESULT_DIR, dedup_outfile_basename)

def run_gsnapl_remotely(input_files, lazy_run):
    key_name = os.path.basename(KEY_S3_PATH)
    execute_command("aws s3 cp %s %s/" % (KEY_S3_PATH, REF_DIR))
    key_path = REF_DIR +'/' + key_name
    execute_command("chmod 400 %s" % key_path)
    remote_username = "ubuntu"
    remote_home_dir = "/home/%s" % remote_username
    remote_work_dir = "%s/batch-pipeline-workdir/%s" % (remote_home_dir, SAMPLE_NAME)
    remote_index_dir = "%s/share" % remote_home_dir
    # split file:
    chunk_nlines = 2*GSNAPL_CHUNK_SIZE
    part_suffix = "-chunksize-%d-part-" % GSNAPL_CHUNK_SIZE
    input_chunks = chunk_input(input_files, chunk_nlines, part_suffix)
    # process chunks:
    chunk_output_files = []
    for chunk_input_files in input_chunks:
        chunk_output_files += [run_gsnapl_chunk(part_suffix, remote_home_dir, remote_index_dir, remote_work_dir, remote_username,
                                                chunk_input_files, key_path, lazy_run)]
    # merge output chunks:
    concatenate_files(chunk_output_files, os.path.join(RESULT_DIR, GSNAPL_DEDUP_OUT))
    execute_command("aws s3 cp %s/%s %s/" % (RESULT_DIR, GSNAPL_DEDUP_OUT, SAMPLE_S3_OUTPUT_PATH))

def run_annotate_m8_with_taxids(input_m8, output_m8):
    accession2taxid_gz = os.path.basename(ACCESSION2TAXID)
    accession2taxid_path = REF_DIR + '/' + accession2taxid_gz[:-3]
    if not os.path.isfile(accession2taxid_path):
        execute_command("aws s3 cp %s %s/" % (ACCESSION2TAXID, REF_DIR))
        execute_command("cd %s; gunzip %s" % (REF_DIR, accession2taxid_gz))
        write_to_log("downloaded accession-to-taxid map")
    generate_taxid_annotated_m8(input_m8, output_m8, accession2taxid_path)
    write_to_log("finished annotation")
    # move the output back to S3
    execute_command("aws s3 cp %s %s/" % (output_m8, SAMPLE_S3_OUTPUT_PATH))

def run_filter_deuterostomes_from_m8(input_m8, output_m8):
    deuterostome_file_basename = os.path.basename(DEUTEROSTOME_TAXIDS)
    deuterostome_file = os.path.join(REF_DIR, deuterostome_file_basename)
    if not os.path.isfile(deuterostome_file):
        execute_command("aws s3 cp %s %s/" % (DEUTEROSTOME_TAXIDS, REF_DIR))
        write_to_log("downloaded deuterostome list")
    filter_deuterostomes_from_m8(input_m8, output_m8, deuterostome_file)
    write_to_log("finished job")
    # move the output back to S3
    execute_command("aws s3 cp %s %s/" % (output_m8, SAMPLE_S3_OUTPUT_PATH))

def run_generate_taxid_annotated_fasta_from_m8(input_m8, input_fasta,
    output_fasta, annotation_prefix):
    generate_taxid_annotated_fasta_from_m8(input_fasta, input_m8, output_fasta, annotation_prefix)
    write_to_log("finished job")
    # move the output back to S3
    execute_command("aws s3 cp %s %s/" % (output_fasta, SAMPLE_S3_OUTPUT_PATH))

def run_filter_deuterostomes_from_fasta(input_fa, output_fa, annotation_prefix):
    accession2taxid_gz = os.path.basename(ACCESSION2TAXID)
    accession2taxid_path = REF_DIR + '/' + accession2taxid_gz[:-3]
    if not os.path.isfile(accession2taxid_path):
        execute_command("aws s3 cp %s %s/" % (ACCESSION2TAXID, REF_DIR))
        execute_command("cd %s; gunzip %s" % (REF_DIR, accession2taxid_gz))
        write_to_log("downloaded accession-to-taxid map")
    deuterostome_file_basename = os.path.basename(DEUTEROSTOME_TAXIDS)
    deuterostome_file = os.path.join(REF_DIR, deuterostome_file_basename)
    if not os.path.isfile(deuterostome_file):
        execute_command("aws s3 cp %s %s/" % (DEUTEROSTOME_TAXIDS, REF_DIR))
        write_to_log("downloaded deuterostome list")
    filter_taxids_from_fasta(input_fa, output_fa, annotation_prefix, accession2taxid_path, deuterostome_file)
    write_to_log("finished job")
    # move the output back to S3
    execute_command("aws s3 cp %s %s/" % (output_fa, SAMPLE_S3_OUTPUT_PATH))

def run_rapsearch_chunk(part_suffix, remote_home_dir, remote_index_dir, remote_work_dir, remote_username,
                        input_fasta, key_path, lazy_run):
    chunk_id = input_fasta.split(part_suffix)[-1]
    commands = "mkdir -p %s;" % remote_work_dir
    commands += "aws s3 cp %s/%s %s/ ; " % \
                 (SAMPLE_S3_OUTPUT_CHUNKS_PATH, input_fasta, remote_work_dir)
    input_path = remote_work_dir + '/' + input_fasta
    outfile_basename = 'rapsearch2-out' + part_suffix + chunk_id + '.m8'
    output_path = os.path.join(remote_work_dir, outfile_basename)
    commands += " ".join(['/usr/local/bin/rapsearch',
                          '-d', remote_index_dir+'/nr_rapsearch',
                          '-e','-6',
                          '-l','10',
                          '-a','T',
                          '-b','0',
                          '-v','1',
                          '-z','24',
                          '-q', input_path,
                          '-o', output_path[:-3],
                          ';'])
    commands += "aws s3 cp %s %s/;" % (output_path, SAMPLE_S3_OUTPUT_CHUNKS_PATH)
    if not lazy_run or not check_s3_file_presence(os.path.join(SAMPLE_S3_OUTPUT_CHUNKS_PATH, outfile_basename)):
        write_to_log("waiting for server")
        instance_ip = wait_for_server_ip('rapsearch', key_path, remote_username, ENVIRONMENT, RAPSEARCH2_MAX_CONCURRENT)
        write_to_log("starting alignment for chunk %s on machine %s" % (chunk_id, instance_ip))
        remote_command = 'ssh -o "StrictHostKeyChecking no" -i %s %s@%s "%s"' % (key_path, remote_username, instance_ip, commands)
        execute_command_realtime_stdout(remote_command)
        write_to_log("finished alignment for chunk %s" % chunk_id)
    # move output back to local
    time.sleep(10) # wait until the data is synced
    execute_command("aws s3 cp %s/%s %s/" % (SAMPLE_S3_OUTPUT_CHUNKS_PATH, outfile_basename, CHUNKS_RESULT_DIR))
    return os.path.join(CHUNKS_RESULT_DIR, outfile_basename)

def run_rapsearch2_remotely(input_fasta, lazy_run):
    key_name = os.path.basename(KEY_S3_PATH)
    execute_command("aws s3 cp %s %s/" % (KEY_S3_PATH, REF_DIR))
    key_path = REF_DIR +'/' + key_name
    execute_command("chmod 400 %s" % key_path)
    remote_username = "ec2-user"
    remote_home_dir = "/home/%s" % remote_username
    remote_work_dir = "%s/data/batch-pipeline-workdir/%s" % (remote_home_dir, SAMPLE_NAME)
    remote_index_dir = "%s/references/nr_rapsearch" % remote_home_dir
    # split file:
    chunk_nlines = 2*RAPSEARCH_CHUNK_SIZE
    part_suffix = "-chunksize-%d-part-" % RAPSEARCH_CHUNK_SIZE
    input_chunks = chunk_input([input_fasta], chunk_nlines, part_suffix)
    # process chunks:
    chunk_output_files = []
    for chunk_input_file in input_chunks:
        chunk_output_files += [run_rapsearch_chunk(part_suffix, remote_home_dir, remote_index_dir, remote_work_dir, remote_username,
                                                   chunk_input_file[0], key_path, lazy_run)]
    # merge output chunks:
    concatenate_files(chunk_output_files, os.path.join(RESULT_DIR, RAPSEARCH2_OUT))
    execute_command("aws s3 cp %s/%s %s/" % (RESULT_DIR, RAPSEARCH2_OUT, SAMPLE_S3_OUTPUT_PATH))

def run_generate_taxid_outputs_from_m8(annotated_m8, taxon_counts_csv_file, taxon_counts_json_file,
    taxon_species_rpm_file, taxon_genus_rpm_file, count_type, e_value_type):

    # download taxoninfodb if not exist
    taxoninfo_filename = os.path.basename(TAXID_TO_INFO)
    taxoninfo_path = REF_DIR + '/' + taxoninfo_filename
    if not os.path.isfile(taxoninfo_path):
        execute_command("aws s3 cp %s %s/" % (TAXID_TO_INFO, REF_DIR))
        write_to_log("downloaded taxon info database")

    # download lineage db if not exist
    lineage_filename = os.path.basename(LINEAGE_SHELF)
    lineage_path = REF_DIR + '/' + lineage_filename
    if not os.path.isfile(lineage_path):
        execute_command("aws s3 cp %s %s/" % (LINEAGE_SHELF, REF_DIR))
        logging.getLogger().info("downloaded taxid-lineage shelf")
    lineage_map = shelve.open(lineage_path)

    species_concordant, genus_concordant, family_concordant = generate_tax_counts_from_m8(annotated_m8, e_value_type,
                                                                                          taxon_counts_csv_file, lineage_map)
    write_to_log("generated taxon counts from m8")
    generate_json_from_taxid_counts(taxon_counts_csv_file, taxoninfo_path, taxon_counts_json_file, count_type,
                                    lineage_map, species_concordant, genus_concordant, family_concordant)
    write_to_log("generated JSON file from taxon counts")
    generate_rpm_from_taxid_counts(taxon_counts_csv_file, taxoninfo_path,
                                   taxon_species_rpm_file, taxon_genus_rpm_file)
    write_to_log("calculated RPM from taxon counts")
    # move the output back to S3
    execute_command("aws s3 cp %s %s/" % (taxon_counts_csv_file, SAMPLE_S3_OUTPUT_PATH))
    execute_command("aws s3 cp %s %s/" % (taxon_counts_json_file, SAMPLE_S3_OUTPUT_PATH))
    execute_command("aws s3 cp %s %s/" % (taxon_species_rpm_file, SAMPLE_S3_OUTPUT_PATH))
    execute_command("aws s3 cp %s %s/" % (taxon_genus_rpm_file, SAMPLE_S3_OUTPUT_PATH))

def run_combine_json_outputs(input_json_1, input_json_2, output_json):
    combine_pipeline_output_json(input_json_1, input_json_2, output_json)
    write_to_log("finished job")
    # move it the output back to S3
    execute_command("aws s3 cp %s %s/" % (output_json, SAMPLE_S3_OUTPUT_PATH))

def run_generate_unidentified_fasta(input_fa, output_fa):
    subprocess.check_output("grep -A 1 '>NR::NT::' %s | sed '/^--$/d' > %s" % (input_fa, output_fa), shell=True)
    write_to_log("finished job")
    execute_command("aws s3 cp %s %s/" % (output_fa, SAMPLE_S3_OUTPUT_PATH))

def run_stage2(lazy_run = True):
    # make local directories
    execute_command("mkdir -p %s %s %s %s %s" % (SAMPLE_DIR, FASTQ_DIR, RESULT_DIR, CHUNKS_RESULT_DIR, REF_DIR))

    # configure logger
    log_file = "%s/%s.%s.txt" % (RESULT_DIR, LOGS_OUT_BASENAME, AWS_BATCH_JOB_ID)
    configure_logger(log_file)

    # Download input files
    input1_s3_path = os.path.join(SAMPLE_S3_INPUT_PATH, EXTRACT_UNMAPPED_FROM_SAM_OUT1)
    input2_s3_path = os.path.join(SAMPLE_S3_INPUT_PATH, EXTRACT_UNMAPPED_FROM_SAM_OUT2)
    input3_s3_path = os.path.join(SAMPLE_S3_INPUT_PATH, EXTRACT_UNMAPPED_FROM_SAM_OUT3)
    input1_present = check_s3_file_presence(input1_s3_path)
    input2_present = check_s3_file_presence(input2_s3_path)
    input3_present = check_s3_file_presence(input3_s3_path)
    if input1_present and input2_present and input3_present:
        # output of previous stage
        if SAMPLE_S3_INPUT_PATH != SAMPLE_S3_OUTPUT_PATH:
            execute_command("aws s3 cp %s %s/" % (input1_s3_path, SAMPLE_S3_OUTPUT_PATH))
            execute_command("aws s3 cp %s %s/" % (input2_s3_path, SAMPLE_S3_OUTPUT_PATH))
            execute_command("aws s3 cp %s %s/" % (input3_s3_path, SAMPLE_S3_OUTPUT_PATH))
        _gsnapl_input_files = [EXTRACT_UNMAPPED_FROM_SAM_OUT1, EXTRACT_UNMAPPED_FROM_SAM_OUT2]
        before_file_name_for_log = os.path.join(RESULT_DIR, EXTRACT_UNMAPPED_FROM_SAM_OUT1)
        before_file_type_for_log = "fasta_paired"
    else:
        # in case where previous stage was skipped, go back to original input
        command = "aws s3 ls %s/ | grep '\.%s$'" % (SAMPLE_S3_FASTQ_PATH, FILE_TYPE)
        output = execute_command_with_output(command).rstrip().split("\n")
        for line in output:
            m = re.match(".*?([^ ]*." + re.escape(FILE_TYPE) + ")", line)
            if m:
                execute_command("aws s3 cp %s/%s %s/" % (SAMPLE_S3_FASTQ_PATH, m.group(1), FASTQ_DIR))
            else:
                print "%s doesn't match %s" % (line, FILE_TYPE)
        fastq_files = execute_command_with_output("ls %s/*.%s" % (FASTQ_DIR, FILE_TYPE)).rstrip().split("\n")
        # prepare files for gsnap
        cleaned_files, before_file_type_for_log = clean_direct_gsnapl_input(fastq_files)
        before_file_name_for_log = cleaned_files[0]
        _gsnapl_input_files = [os.path.basename(f) for f in cleaned_files]
        # make combined fasta needed later
        _merged_fasta = os.path.join(RESULT_DIR, EXTRACT_UNMAPPED_FROM_SAM_OUT3)
        generate_merged_fasta(cleaned_files, _merged_fasta)
        execute_command("aws s3 cp %s %s/" % (_merged_fasta, SAMPLE_S3_OUTPUT_PATH))

    # Make sure there are no tabs in sequence names, since tabs are used as a delimiter in m8 files
    files_to_collapse_basenames = _gsnapl_input_files + [EXTRACT_UNMAPPED_FROM_SAM_OUT3]
    collapsed_files = ["%s/nospace.%s" % (RESULT_DIR, f) for f in files_to_collapse_basenames]
    for file_basename in files_to_collapse_basenames:
        execute_command("aws s3 cp %s/%s %s/" % (SAMPLE_S3_OUTPUT_PATH, file_basename, RESULT_DIR))
    remove_whitespace_from_files([os.path.join(RESULT_DIR, file_basename) for file_basename in files_to_collapse_basenames],
                                  ";", collapsed_files)
    for filename in collapsed_files:
        execute_command("aws s3 cp %s %s/" % (filename, SAMPLE_S3_OUTPUT_PATH))
    gsnapl_input_files = [os.path.basename(f) for f in collapsed_files[:-1]]
    merged_fasta = collapsed_files[-1]

    if lazy_run:
        # Download existing data and see what has been done
        ## NOTE: OUTPUT_BUCKETS for all the stages need to be distinct for this to work properly.
        command = "aws s3 cp %s %s --recursive" % (SAMPLE_S3_OUTPUT_PATH, RESULT_DIR)
        print execute_command_with_output(command)

    # Import existing job stats
    stats_s3_path = os.path.join(SAMPLE_S3_INPUT_PATH, STATS_OUT)
    if check_s3_file_presence(stats_s3_path):
        execute_command("aws s3 cp %s/%s %s/" % (SAMPLE_S3_INPUT_PATH, STATS_OUT, RESULT_DIR))
        stats_file = os.path.join(RESULT_DIR, STATS_OUT)
        load_existing_stats(stats_file)

    # run gsnap remotely
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "GSNAPL", "count_reads": True,
        "before_file_name": before_file_name_for_log, "before_file_type": before_file_type_for_log,
        "after_file_name": os.path.join(RESULT_DIR, GSNAPL_DEDUP_OUT), "after_file_type": "m8"})
    run_and_log(logparams, TARGET_OUTPUTS["run_gsnapl_remotely"], lazy_run, run_gsnapl_remotely, gsnapl_input_files, lazy_run)

    # run_annotate_gsnapl_m8_with_taxids
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "annotate gsnapl m8 with taxids", "count_reads": False})
    run_and_log(logparams, TARGET_OUTPUTS["run_annotate_m8_with_taxids__1"], False, run_annotate_m8_with_taxids,
        os.path.join(RESULT_DIR, GSNAPL_DEDUP_OUT), os.path.join(RESULT_DIR, ANNOTATE_GSNAPL_M8_WITH_TAXIDS_OUT))

    # run_generate_taxid_annotated_fasta_from_m8
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "generate taxid annotated fasta from m8", "count_reads": False})
    run_and_log(logparams, TARGET_OUTPUTS["run_generate_taxid_annotated_fasta_from_m8__1"], False,
        run_generate_taxid_annotated_fasta_from_m8, os.path.join(RESULT_DIR, GSNAPL_DEDUP_OUT),
        merged_fasta, os.path.join(RESULT_DIR, GENERATE_TAXID_ANNOTATED_FASTA_FROM_M8_OUT), 'NT')

    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "filter deuterostomes from m8__1", "count_reads": True,
        "before_file_name": os.path.join(RESULT_DIR, ANNOTATE_GSNAPL_M8_WITH_TAXIDS_OUT), "before_file_type": "m8",
        "after_file_name": os.path.join(RESULT_DIR, FILTER_DEUTEROSTOMES_FROM_NT_M8_OUT), "after_file_type": "m8"})
    run_and_log(logparams, TARGET_OUTPUTS["run_filter_deuterostomes_from_m8__1"], False,
        run_filter_deuterostomes_from_m8,
        os.path.join(RESULT_DIR, ANNOTATE_GSNAPL_M8_WITH_TAXIDS_OUT),
        os.path.join(RESULT_DIR, FILTER_DEUTEROSTOMES_FROM_NT_M8_OUT))

    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "generate taxid outputs from m8", "count_reads": False})
    run_and_log(logparams, TARGET_OUTPUTS["run_generate_taxid_outputs_from_m8__1"], False,
        run_generate_taxid_outputs_from_m8,
        os.path.join(RESULT_DIR, FILTER_DEUTEROSTOMES_FROM_NT_M8_OUT),
        os.path.join(RESULT_DIR, NT_M8_TO_TAXID_COUNTS_FILE_OUT),
        os.path.join(RESULT_DIR, NT_TAXID_COUNTS_TO_JSON_OUT),
        os.path.join(RESULT_DIR, NT_TAXID_COUNTS_TO_SPECIES_RPM_OUT),
        os.path.join(RESULT_DIR, NT_TAXID_COUNTS_TO_GENUS_RPM_OUT), 'NT', 'raw')

    # filter deuterostomes
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "filter deuterostomes from FASTA", "count_reads": False})
    run_and_log(logparams, TARGET_OUTPUTS["run_filter_deuterostomes_from_fasta"], False,
        run_filter_deuterostomes_from_fasta,
        os.path.join(RESULT_DIR, GENERATE_TAXID_ANNOTATED_FASTA_FROM_M8_OUT),
        os.path.join(RESULT_DIR, FILTER_DEUTEROSTOME_FROM_TAXID_ANNOTATED_FASTA_OUT), 'NT')

    # run rapsearch
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "RAPSearch2", "count_reads": True,
        "before_file_name": os.path.join(RESULT_DIR, FILTER_DEUTEROSTOME_FROM_TAXID_ANNOTATED_FASTA_OUT),
        "before_file_type": "fasta",
        "after_file_name": os.path.join(RESULT_DIR, RAPSEARCH2_OUT), "after_file_type": "m8"})
    run_and_log(logparams, TARGET_OUTPUTS["run_rapsearch2_remotely"], lazy_run, run_rapsearch2_remotely,
        FILTER_DEUTEROSTOME_FROM_TAXID_ANNOTATED_FASTA_OUT, lazy_run)

    # run_annotate_m8_with_taxids
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "annotate m8 with taxids", "count_reads": False})
    run_and_log(logparams, TARGET_OUTPUTS["run_annotate_m8_with_taxids__2"], False, run_annotate_m8_with_taxids,
        os.path.join(RESULT_DIR, RAPSEARCH2_OUT), os.path.join(RESULT_DIR, ANNOTATE_RAPSEARCH2_M8_WITH_TAXIDS_OUT))

    # run_generate_taxid_annotated_fasta_from_m8
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "generate taxid annotated fasta from m8", "count_reads": False})
    run_and_log(logparams, TARGET_OUTPUTS["run_generate_taxid_annotated_fasta_from_m8__2"], False,
        run_generate_taxid_annotated_fasta_from_m8,
        RESULT_DIR + '/' + RAPSEARCH2_OUT,
        RESULT_DIR + '/' + FILTER_DEUTEROSTOME_FROM_TAXID_ANNOTATED_FASTA_OUT,
        RESULT_DIR + '/' + GENERATE_TAXID_ANNOTATED_FASTA_FROM_RAPSEARCH2_M8_OUT,
        'NR')

    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "filter deuterostomes from m8", "count_reads": True,
        "before_file_name": os.path.join(RESULT_DIR, ANNOTATE_RAPSEARCH2_M8_WITH_TAXIDS_OUT), "before_file_type": "m8",
        "after_file_name": os.path.join(RESULT_DIR, FILTER_DEUTEROSTOMES_FROM_NR_M8_OUT), "after_file_type": "m8"})
    run_and_log(logparams, TARGET_OUTPUTS["run_filter_deuterostomes_from_m8__2"], False,
        run_filter_deuterostomes_from_m8,
        os.path.join(RESULT_DIR, ANNOTATE_RAPSEARCH2_M8_WITH_TAXIDS_OUT),
        os.path.join(RESULT_DIR, FILTER_DEUTEROSTOMES_FROM_NR_M8_OUT))

    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "generate taxid outputs from m8", "count_reads": False})
    run_and_log(logparams, TARGET_OUTPUTS["run_generate_taxid_outputs_from_m8__2"], False,
        run_generate_taxid_outputs_from_m8,
        os.path.join(RESULT_DIR, FILTER_DEUTEROSTOMES_FROM_NR_M8_OUT),
        os.path.join(RESULT_DIR, NR_M8_TO_TAXID_COUNTS_FILE_OUT),
        os.path.join(RESULT_DIR, NR_TAXID_COUNTS_TO_JSON_OUT),
        os.path.join(RESULT_DIR, NR_TAXID_COUNTS_TO_SPECIES_RPM_OUT),
        os.path.join(RESULT_DIR, NR_TAXID_COUNTS_TO_GENUS_RPM_OUT), 'NR','log10')

    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "combine JSON outputs", "count_reads": False})
    run_and_log(logparams, TARGET_OUTPUTS["run_combine_json_outputs"], False,
        run_combine_json_outputs,
        RESULT_DIR + '/' + NT_TAXID_COUNTS_TO_JSON_OUT, RESULT_DIR + '/' + NR_TAXID_COUNTS_TO_JSON_OUT,
        RESULT_DIR + '/' + COMBINED_JSON_OUT)

    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "generate FASTA of unidentified reads", "count_reads": True,
        "before_file_name": os.path.join(RESULT_DIR, GENERATE_TAXID_ANNOTATED_FASTA_FROM_RAPSEARCH2_M8_OUT),
        "before_file_type": "fasta",
        "after_file_name": os.path.join(RESULT_DIR, UNIDENTIFIED_FASTA_OUT), "after_file_type": "fasta"})
    run_and_log(logparams, TARGET_OUTPUTS["run_generate_unidentified_fasta"], False,
        run_generate_unidentified_fasta,
        RESULT_DIR + '/' + GENERATE_TAXID_ANNOTATED_FASTA_FROM_RAPSEARCH2_M8_OUT,
        RESULT_DIR + '/' + UNIDENTIFIED_FASTA_OUT)

# Main
def main():
    # Unbuffer stdout and redirect stderr into stdout.  This helps observe logged events in realtime.
    sys.stdout = os.fdopen(sys.stdout.fileno(), 'w', 0)
    os.dup2(sys.stdout.fileno(), sys.stderr.fileno())

    # collect environment variables and set global variables
    global INPUT_BUCKET
    global FASTQ_BUCKET
    global FILE_TYPE
    global OUTPUT_BUCKET
    global ENVIRONMENT
    global SAMPLE_S3_INPUT_PATH
    global SAMPLE_S3_OUTPUT_PATH
    global FASTQ_DIR
    global RESULT_DIR
    global SAMPLE_DIR
    global DEFAULT_LOGPARAMS
    global AWS_BATCH_JOB_ID
    global KEY_S3_PATH
    global TARGET_OUTPUTS
    global SAMPLE_NAME
    global SAMPLE_S3_FASTQ_PATH
    global SAMPLE_S3_OUTPUT_CHUNKS_PATH
    global CHUNKS_RESULT_DIR

    FASTQ_BUCKET = os.environ.get('FASTQ_BUCKET', FASTQ_BUCKET)
    INPUT_BUCKET = os.environ.get('INPUT_BUCKET', INPUT_BUCKET)
    FILE_TYPE = os.environ.get('FILE_TYPE', FILE_TYPE)
    OUTPUT_BUCKET = os.environ.get('OUTPUT_BUCKET', OUTPUT_BUCKET)
    AWS_BATCH_JOB_ID = os.environ.get('AWS_BATCH_JOB_ID', 'local')
    ENVIRONMENT = os.environ.get('ENVIRONMENT', ENVIRONMENT)

    SAMPLE_S3_FASTQ_PATH = FASTQ_BUCKET.rstrip('/')
    SAMPLE_S3_INPUT_PATH = INPUT_BUCKET.rstrip('/')
    SAMPLE_S3_OUTPUT_PATH = OUTPUT_BUCKET.rstrip('/')
    SAMPLE_S3_OUTPUT_CHUNKS_PATH = os.path.join(SAMPLE_S3_OUTPUT_PATH, "chunks")
    SAMPLE_NAME = SAMPLE_S3_INPUT_PATH[5:].rstrip('/').replace('/','-')
    SAMPLE_DIR = DEST_DIR + '/' + SAMPLE_NAME
    FASTQ_DIR = SAMPLE_DIR + '/fastqs'
    RESULT_DIR = SAMPLE_DIR + '/results'
    CHUNKS_RESULT_DIR = os.path.join(RESULT_DIR, "chunks")
    DEFAULT_LOGPARAMS = {"sample_s3_output_path": SAMPLE_S3_OUTPUT_PATH,
                         "stats_file": os.path.join(RESULT_DIR, STATS_OUT)}
    KEY_S3_PATH = get_key_path(ENVIRONMENT)

    # target outputs by task
    TARGET_OUTPUTS = { "run_gsnapl_remotely": [os.path.join(RESULT_DIR, GSNAPL_DEDUP_OUT)],
                       "run_annotate_m8_with_taxids__1": [os.path.join(RESULT_DIR, ANNOTATE_GSNAPL_M8_WITH_TAXIDS_OUT)],
                       "run_generate_taxid_annotated_fasta_from_m8__1": [os.path.join(RESULT_DIR, GENERATE_TAXID_ANNOTATED_FASTA_FROM_M8_OUT)],
                       "run_filter_deuterostomes_from_m8__1": [os.path.join(RESULT_DIR, FILTER_DEUTEROSTOMES_FROM_NT_M8_OUT)],
                       "run_generate_taxid_outputs_from_m8__1": [os.path.join(RESULT_DIR, NT_TAXID_COUNTS_TO_JSON_OUT)],
                       "run_filter_deuterostomes_from_fasta": [os.path.join(RESULT_DIR, FILTER_DEUTEROSTOME_FROM_TAXID_ANNOTATED_FASTA_OUT)],
                       "run_rapsearch2_remotely": [os.path.join(RESULT_DIR, RAPSEARCH2_OUT)],
                       "run_annotate_m8_with_taxids__2": [os.path.join(RESULT_DIR, ANNOTATE_RAPSEARCH2_M8_WITH_TAXIDS_OUT)],
                       "run_generate_taxid_annotated_fasta_from_m8__2": [os.path.join(RESULT_DIR, GENERATE_TAXID_ANNOTATED_FASTA_FROM_RAPSEARCH2_M8_OUT)],
                       "run_filter_deuterostomes_from_m8__2": [os.path.join(RESULT_DIR, FILTER_DEUTEROSTOMES_FROM_NR_M8_OUT)],
                       "run_generate_taxid_outputs_from_m8__2": [os.path.join(RESULT_DIR, NR_TAXID_COUNTS_TO_JSON_OUT)],
                       "run_combine_json_outputs": [os.path.join(RESULT_DIR, COMBINED_JSON_OUT)],
                       "run_generate_unidentified_fasta": [os.path.join(RESULT_DIR, UNIDENTIFIED_FASTA_OUT)] }

    # execute the pipeline stage
    run_stage2(True)

if __name__=="__main__":
    main()
