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
FILE_TYPE = 'fastq.gz'
OUTPUT_BUCKET = 's3://czbiohub-idseq-samples-test/id-uganda'  # default to be overwritten by environment variable
KEY_S3_PATH = 's3://czbiohub-infectious-disease/idseq-alpha.pem'
ROOT_DIR = '/mnt'
DEST_DIR = ROOT_DIR + '/idseq/data' # generated data go here
REF_DIR  = ROOT_DIR + '/idseq/ref' # referene genome / ref databases go here

FILTER_HOST_FLAG = 1

STAR="STAR"
HTSEQ="htseq-count"
SAMTOOLS="samtools"
PRICESEQ_FILTER="PriceSeqFilter"
CDHITDUP="cd-hit-dup"
BOWTIE2="bowtie2"


LZW_FRACTION_CUTOFF = 0.45
GSNAPL_INSTANCE_IP = '34.211.67.166'
RAPSEARCH2_INSTANCE_IP = '54.191.193.210'

GSNAPL_MAX_CONCURRENT = 5
RAPSEARCH2_MAX_CONCURRENT = 5

STAR_GENOME = 's3://czbiohub-infectious-disease/references/human/STAR_genome.tar.gz'
BOWTIE2_GENOME = 's3://czbiohub-infectious-disease/references/human/bowtie2_genome.tar.gz'
ACCESSION2TAXID = 's3://czbiohub-infectious-disease/references/accession2taxid.db.gz'
DEUTEROSTOME_TAXIDS = 's3://czbiohub-infectious-disease/references/lineages-2017-03-17_deuterostome_taxIDs.txt'
TAXID_TO_INFO = 's3://czbiohub-infectious-disease/references/taxon_info.db'

TAX_LEVEL_SPECIES = 1
TAX_LEVEL_GENUS = 2

#output files
STAR_OUT1 = 'unmapped.star.1.fq'
STAR_OUT2 = 'unmapped.star.2.fq'
PRICESEQFILTER_OUT1 = 'priceseqfilter.unmapped.star.1.fq'
PRICESEQFILTER_OUT2 = 'priceseqfilter.unmapped.star.2.fq'
FQ2FA_OUT1 = 'priceseqfilter.unmapped.star.1.fasta'
FQ2FA_OUT2 = 'priceseqfilter.unmapped.star.2.fasta'
CDHITDUP_OUT1 = 'cdhitdup.priceseqfilter.unmapped.star.1.fasta'
CDHITDUP_OUT2 = 'cdhitdup.priceseqfilter.unmapped.star.2.fasta'
LZW_OUT1 = 'lzw.cdhitdup.priceseqfilter.unmapped.star.1.fasta'
LZW_OUT2 = 'lzw.cdhitdup.priceseqfilter.unmapped.star.2.fasta'
BOWTIE2_OUT = 'bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.sam'
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
LOGS_OUT_BASENAME = 'log.txt'
STATS_OUT = 'stats.json'

#global statistics log
STATS = []

### convenience functions
def count_reads(file_name, file_type):
    count = 0
    if file_name[-3:] == '.gz':
        f = gzip.open(file_name)
    else:
        f = open(file_name)
    for line in f:
        if file_type == "fastq_paired":
            count += 2./4
        elif file_type == "fasta_paired":
            if line.startswith('>'):
                count += 2
        elif file_type == "fasta":
            if line.startswith('>'):
                count += 1
        elif file_type == "m8" and line[0] == '#':
            continue
        else:
            count += 1
    f.close()
    return int(count)

def get_total_initial_reads(fastq_file_1, initial_file_type_for_log, stats_file):
    # If "total_reads" is present in stats file, get that value, otherwise get value from input file.
    # Slightly hacky, but allows us to take into account actual initial read number in the case where
    # input files are already pre-filtered -- just put it in a stats file in the preload folder as:
    # [{"total_reads": <value>}]
    if os.path.isfile(stats_file):
        with open(stats_file) as f:
            existing_stats = json.load(f)
        total_reads_entry = [item for item in existing_stats if "total_reads" in item]
        if len(total_reads_entry) > 0:
            return total_reads_entry[0]["total_reads"]
    return count_reads(fastq_file_1, initial_file_type_for_log)

def clean_direct_gsnapl_input(fastq_files, file_type, sample_s3_output_path):
    # unzip files if necessary 
    if ".gz" in file_type:
        subprocess.check_output(" ".join(["gunzip"] + fastq_files), shell=True)
        cleaned_files = [os.path.splitext(f) for f in fastq_files]
    else:
        cleaned_files = fastq_files
    # generate file type for log
    file_type_trimmed = file_type.split(".gz")[0]
    file_type_for_log = file_type_trimmed
    if len(fastq_files)==2:
        file_type_for_log += "_paired"
    # copy files to S3
    for f in cleaned_files:
        execute_command("aws s3 cp %s %s/" % (f, sample_s3_output_path))
    return cleaned_files, file_type_for_log

def lzw_fraction(sequence):
    if sequence == "":
        return 0.0
    sequence = sequence.upper()
    dict_size = 0
    dictionary = {}
    # Initialize dictionary with single char
    for c in sequence:
       dict_size += 1
       dictionary[c] = dict_size

    word = ""
    results = []
    for c in sequence:
        wc = word + c
        if dictionary.get(wc):
            word = wc
        else:
            results.append(dictionary[word])
            dict_size += 1
            dictionary[wc] = dict_size
            word = c
    if word != "":
        results.append(dictionary[word])
    return float(len(results))/len(sequence)

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
    while len(sequence_name) > 0 and len(sequence_data) > 0:
        read_id = sequence_name.rstrip().lstrip('>')
        accession = read_to_accession_id.get(read_id, '')
        new_read_name = annotation_prefix + ':' + accession + ':' + read_id
        output_fasta_f.write(">%s\n" % new_read_name)
        output_fasta_f.write(sequence_data)
        sequence_name = input_fasta_f.readline()
        sequence_data = input_fasta_f.readline()
    input_fasta_f.close()
    output_fasta_f.close()

def generate_lzw_filtered_paired(fasta_file_1, fasta_file_2, output_prefix, cutoff_fraction):
    output_read_1 = open(output_prefix + '.1.fasta', 'wb')
    output_read_2 = open(output_prefix + '.2.fasta', 'wb')
    read_1 = open(fasta_file_1, 'rb')
    read_2 = open(fasta_file_2, 'rb')
    count = 0
    filtered = 0
    while True:
        line_r1_header   = read_1.readline()
        line_r1_sequence = read_1.readline()
        line_r2_header   = read_2.readline()
        line_r2_sequence = read_2.readline()
        if line_r1_header and line_r1_sequence and line_r2_header and line_r2_sequence:
            fraction_1 = lzw_fraction(line_r1_sequence.rstrip())
            fraction_2 = lzw_fraction(line_r2_sequence.rstrip())
            count += 1
            if fraction_1 > cutoff_fraction and fraction_2 > cutoff_fraction:
                output_read_1.write(line_r1_header)
                output_read_1.write(line_r1_sequence)
                output_read_2.write(line_r2_header)
                output_read_2.write(line_r2_sequence)
            else:
                filtered += 1
        else:
            break
    print "LZW filter: total reads: %d, filtered reads: %d, kept ratio: %f" % (count, filtered, 1 - float(filtered)/count)
    output_read_1.close()
    output_read_2.close()

def generate_unmapped_pairs_from_sam(sam_file, output_prefix):
    output_read_1 = open(output_prefix + '.1.fasta', 'wb')
    output_read_2 = open(output_prefix + '.2.fasta', 'wb')
    output_merged_read = open(output_prefix + '.merged.fasta', 'wb')
    header = True
    with open(sam_file, 'rb') as samf:
        line = samf.readline()
        while(line[0] == '@'):
            line = samf.readline() # skip headers
        read1 = line
        read2 = samf.readline()
        while (len(read1) > 0 and len(read2) >0):
            parts1 = read1.split("\t")
            parts2 = read2.split("\t")
            if (parts1[1] == "77" and parts2[1] == "141"): # both parts unmapped
                output_read_1.write(">%s\n%s\n" %(parts1[0], parts1[9]))
                output_read_2.write(">%s\n%s\n" %(parts2[0], parts2[9]))
                output_merged_read.write(">%s/1\n%s\n" %(parts1[0], parts1[9]))
                output_merged_read.write(">%s/2\n%s\n" %(parts2[0], parts2[9]))
            else: # parts mapped
                print "Matched HG38 -----"
                print read1
                print read2
            read1 = samf.readline()
            read2 = samf.readline()
    output_read_1.close()
    output_read_2.close()
    output_merged_read.close()

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


def generate_tax_counts_from_m8(m8_file, e_value_type, output_file):
    # uses m8 file with read names beginning as: "taxid<taxon ID>:"
    taxid_count_map = {}
    taxid_percent_identity_map = {}
    taxid_alignment_length_map = {}
    taxid_e_value_map = {}
    with open(m8_file, 'rb') as m8f:
        for line in m8f:
            taxid = (line.split("taxid"))[1].split(":")[0]
            #"taxid9606:NB501961:14:HM7TLBGX2:1:12104:15431..."
            percent_identity = float(line.split("\t")[2])
            alignment_length = float(line.split("\t")[3])
            e_value = float(line.split("\t")[10])
            if e_value_type != 'log10':
                e_value = math.log10(e_value)
            #m8 format (Blast format 8): query, subject, %id, alignment length, mismatches, gap openings, query start, query end,
            #                            subject start, subject end, E value (log10 if rapsearch2 output), bit score
            # E value is a negative power of 10. GSNAPL outputs raw e-value, RAPSearch2 outputs log10(e-value).
            # Whenever we use "e_value" it refers to log10(e-value), which is easier to handle.
            taxid_count_map[taxid] = taxid_count_map.get(taxid, 0) + 1
            taxid_percent_identity_map[taxid] = taxid_percent_identity_map.get(taxid, 0) + percent_identity
            taxid_alignment_length_map[taxid] = taxid_alignment_length_map.get(taxid, 0) + alignment_length
            taxid_e_value_map[taxid] = taxid_e_value_map.get(taxid, 0) + e_value
    with open(output_file, 'w') as f:
        for taxid in taxid_count_map.keys():
            count = taxid_count_map[taxid]
            avg_percent_identity = taxid_percent_identity_map[taxid] / count
            avg_alignment_length = taxid_alignment_length_map[taxid] / count
            avg_e_value = taxid_e_value_map[taxid] / count
            f.write(",".join([str(taxid), str(count), str(avg_percent_identity), str(avg_alignment_length), str(avg_e_value) + '\n']))

def generate_rpm_from_taxid_counts(taxidCountsInputPath, taxid2infoPath, speciesOutputPath, genusOutputPath):
    total_reads = (item for item in STATS if item["task"] == "run_star").next().get("reads_before")
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

def generate_json_from_taxid_counts(sample, taxidCountsInputPath,
                                    taxid2infoPath, jsonOutputPath, countType, dbSampleId):
    # produce json in Ryan's output format (https://github.com/chanzuckerberg/idseq-web/blob/master/test/output.json)
    taxid2info_map = shelve.open(taxid2infoPath)
    total_reads = (item for item in STATS if item["task"] == "run_star").next().get("reads_before")
    taxon_counts_attributes = []
    remaining_reads = (item for item in STATS if item["task"] == "run_bowtie2").next().get("reads_after")

    genus_to_count = {}
    genus_to_name = {}
    species_to_count = {}
    species_to_name = {}
    species_to_percent_identity = {}
    species_to_alignment_length = {}
    species_to_e_value = {}
    with open(taxidCountsInputPath) as f:
        for line in f:
            tok = line.rstrip().split(",")
            taxid = tok[0]
            count = float(tok[1])
            percent_identity = float(tok[2])
            alignment_length = float(tok[3])
            e_value = float(tok[4])
            species_taxid, genus_taxid, scientific_name = taxid2info_map.get(taxid, ("-1", "-2", "NA"))
            genus_to_count[genus_taxid] = genus_to_count.get(genus_taxid, 0) + count
            genus_to_name[genus_taxid]  = scientific_name.split(" ")[0]
            species_to_count[species_taxid] = species_to_count.get(species_taxid, 0) + count
            species_to_name[species_taxid] = scientific_name
            species_to_percent_identity[species_taxid] = species_to_percent_identity.get(species_taxid, 0) + count * percent_identity
            species_to_alignment_length[species_taxid] = species_to_alignment_length.get(species_taxid, 0) + count * alignment_length
            species_to_e_value[species_taxid] = species_to_e_value.get(species_taxid, 0) + count * e_value

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
                                        "count_type": countType})

    '''
    for (taxid, count) in genus_to_count.iteritems():
        genus_name = genus_to_name[taxid]
        taxon_counts_attributes.append({"tax_id": taxid,
                                        "tax_level": TAX_LEVEL_GENUS,
                                        "count": count,
                                        "name": genus_name,
                                        "count_type": countType})
    '''

    output_dict = {
        "pipeline_output": {
            "total_reads": total_reads,
            "remaining_reads": remaining_reads,
            "sample_id": dbSampleId,
            "taxon_counts_attributes": taxon_counts_attributes
      }
    }
    with open(jsonOutputPath, 'wb') as outf:
        json.dump(output_dict, outf)

def combine_json(project_name, sample_name, inputPath1, inputPath2, outputPath):
    with open(inputPath1) as inf1:
        input1 = json.load(inf1).get("pipeline_output")
    with open(inputPath2) as inf2:
        input2 = json.load(inf2).get("pipeline_output")
    total_reads = max(input1.get("total_reads"),
                      input2.get("total_reads"))
    remaining_reads = max(input1.get("remaining_reads"),
                          input2.get("remaining_reads"))
    taxon_counts_attributes = (input1.get("taxon_counts_attributes")
                              + input2.get("taxon_counts_attributes"))
    pipeline_output_dict = {
        "project_name": project_name,
        "sample_name": sample_name,
        "total_reads": total_reads,
        "remaining_reads": remaining_reads,
        "taxon_counts_attributes": taxon_counts_attributes
    }
    rest_entries = {field: input1[field] for field in input1.keys() if field not in ["total_reads", "remaining_reads", "taxon_counts_attributes", "project_name", "sample_name"]}
    pipeline_output_dict.update(rest_entries)
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
            read_name = parts[0] # Example: HWI-ST640:828:H917FADXX:2:1108:8883:88679/1/1',
            accession_id = parts[1] # Example: CP000671.1',
            accession_id_short = accession_id.split(".")[0]
            new_line = "taxid" + accession2taxid_dict.get(accession_id_short, "NA") + ":" + line
            outf.write(new_line)
    outf.close()

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
    while len(sequence_name) > 0 and len(sequence_data) > 0:
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

### job functions

def execute_command(command):
    print command
    output = subprocess.check_output(command, shell=True)
    return output

def wait_for_server(service_name, command, max_concurrent):
    while True:
        output = execute_command(command).rstrip().split("\n")
        if len(output) <= max_concurrent:
            print "%s server has capacity. Kicking off " % service_name
            return
        else:
            wait_seconds = random.randint(30, 60)
            print "%s server busy. %d processes running. Wait for %d seconds" % \
                  (service_name, len(output), wait_seconds)
            time.sleep(wait_seconds)

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
    # count records
    required_params = ["before_file_name", "before_file_type", "after_file_name", "after_file_type"]
    if all(param in logparams for param in required_params):
        records_before = count_reads(logparams["before_file_name"], logparams["before_file_type"])
        records_after = count_reads(logparams["after_file_name"], logparams["after_file_type"])
        if logparams["count_reads"]:
            percent_removed = (100.0 * (records_before - records_after)) / records_before
            logger.info("%s %% of reads dropped out, %s reads remaining" % (str(percent_removed), str(records_after)))
            STATS.append({'task': func_name.__name__, 'reads_before': records_before, 'reads_after': records_after})
        # function-specific logs
        if func_name.__name__ == "run_cdhitdup":
            compression_ratio = (1.0 * records_before) / records_after
            logger.info("duplicate compression ratio: %s" % str(compression_ratio))
        if func_name.__name__ == "run_priceseqfilter":
            pass_percentage = (100.0 * records_after) / records_before
            logger.info("percentage of reads passing QC filter: %s %%" % str(pass_percentage))
    # copy log file
    execute_command("aws s3 cp %s %s/;" % (logger.handlers[0].baseFilename, logparams["sample_s3_output_path"]))
    # write stats
    stats_path = logparams["stats_file"]
    with open(stats_path, 'wb') as f:
        json.dump(STATS, f)
    execute_command("aws s3 cp %s %s/;" % (stats_path, logparams["sample_s3_output_path"]))

def run_sample(sample_s3_input_path, file_type, filter_host_flag, sample_s3_output_path,
               star_genome_s3_path, bowtie2_genome_s3_path,
               gsnap_ssh_key_s3_path, rapsearch_ssh_key_s3_path, accession2taxid_s3_path,
               deuterostome_list_s3_path, taxid2info_s3_path, db_sample_id,
               aws_batch_job_id, lazy_run = True):

    sample_s3_output_path = sample_s3_output_path.rstrip('/')
    sample_name = sample_s3_input_path[5:].rstrip('/').replace('/','-')
    sample_dir = DEST_DIR + '/' + sample_name
    fastq_dir = sample_dir + '/fastqs'
    result_dir = sample_dir + '/results'
    scratch_dir = sample_dir + '/scratch'
    execute_command("mkdir -p %s %s %s %s" % (sample_dir, fastq_dir, result_dir, scratch_dir))
    execute_command("mkdir -p %s " % REF_DIR);

    # configure logger
    log_file = "%s/%s.%s" % (result_dir, LOGS_OUT_BASENAME, aws_batch_job_id)
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    handler = logging.FileHandler(log_file)
    formatter = logging.Formatter("%(asctime)s (%(time_since_last)ss elapsed): %(message)s")
    handler.addFilter(TimeFilter())
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    DEFAULT_LOGPARAMS = {"sample_s3_output_path": sample_s3_output_path,
                         "stats_file": os.path.join(result_dir, STATS_OUT)}

    # Download fastqs
    command = "aws s3 ls %s/ | grep '\.%s$'" % (sample_s3_input_path, file_type)
    output = execute_command(command).rstrip().split("\n")
    for line in output:
        m = re.match(".*?([^ ]*." + re.escape(file_type) + ")", line)
        if m:
            execute_command("aws s3 cp %s/%s %s/" % (sample_s3_input_path, m.group(1), fastq_dir))
        else:
            print "%s doesn't match %s" % (line, file_type)

    fastq_files = execute_command("ls %s/*.%s" % (fastq_dir, file_type)).rstrip().split("\n")

    # Identify input files and characteristics
    if filter_host_flag:
        if len(fastq_files) <= 1:
            return # only support paired reads for now
        else:
            fastq_file_1 = fastq_files[0]
            fastq_file_2 = fastq_files[1]

    if lazy_run:
       # Download existing data and see what has been done
        command = "aws s3 cp %s %s --recursive" % (sample_s3_output_path, result_dir)
        print execute_command(command)

    # Record total number of input reads
    initial_file_type_for_log = "fastq_paired" if "fastq" in file_type else "fasta_paired"
    stats_file = os.path.join(result_dir, STATS_OUT)
    STATS.append({'total_reads': get_total_initial_reads(fastq_files[0], initial_file_type_for_log, stats_file)})

    # run host filtering
    if filter_host_flag:
        run_host_filtering(sample_name, fastq_file_1, fastq_file_2, file_type, initial_file_type_for_log, star_genome_s3_path, bowtie2_genome_s3_path,
                           DEFAULT_LOGPARAMS, result_dir, scratch_dir, sample_s3_output_path, lazy_run)

    # run gsnap remotely
    if filter_host_flag:
        gsnapl_input_files = [EXTRACT_UNMAPPED_FROM_SAM_OUT1, EXTRACT_UNMAPPED_FROM_SAM_OUT2]
        before_file_name_for_log = os.path.join(result_dir, EXTRACT_UNMAPPED_FROM_SAM_OUT1)
        before_file_type_for_log = "fasta_paired"
    else:
        cleaned_files, before_file_type_for_log = clean_direct_gsnapl_input(fastq_files, file_type, sample_s3_output_path)
        before_file_name_for_log = cleaned_files[0]
        gsnapl_input_files = [os.path.basename(f) for f in cleaned_files]

    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "GSNAPL", "count_reads": True,
        "before_file_name": before_file_name_for_log,
        "before_file_type": before_file_type_for_log,
        "after_file_name": os.path.join(result_dir, GSNAPL_OUT),
        "after_file_type": "m8"})
    run_and_log(logparams, run_gsnapl_remotely,
        sample_name, gsnapl_input_files,
        gsnap_ssh_key_s3_path,
        result_dir, sample_s3_output_path, lazy_run)

    # run_annotate_gsnapl_m8_with_taxids
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "annotate gsnapl m8 with taxids",
        "count_reads": False})
    run_and_log(logparams, run_annotate_m8_with_taxids,
        sample_name, os.path.join(result_dir, GSNAPL_DEDUP_OUT),
        os.path.join(result_dir, ANNOTATE_GSNAPL_M8_WITH_TAXIDS_OUT),
        accession2taxid_s3_path,
        result_dir, sample_s3_output_path, False)

    # run_generate_taxid_annotated_fasta_from_m8
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "generate taxid annotated fasta from m8",
        "count_reads": False})
    run_and_log(logparams, run_generate_taxid_annotated_fasta_from_m8,
        sample_name, os.path.join(result_dir, GSNAPL_DEDUP_OUT),
        os.path.join(result_dir, EXTRACT_UNMAPPED_FROM_SAM_OUT3),
        os.path.join(result_dir, GENERATE_TAXID_ANNOTATED_FASTA_FROM_M8_OUT),
        'NT', result_dir, sample_s3_output_path, False)

    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "filter deuterostomes from m8", "count_reads": True,
        "before_file_name": os.path.join(result_dir, ANNOTATE_GSNAPL_M8_WITH_TAXIDS_OUT),
        "before_file_type": "m8",
        "after_file_name": os.path.join(result_dir, FILTER_DEUTEROSTOMES_FROM_NT_M8_OUT),
        "after_file_type": "m8"})
    run_and_log(logparams, run_filter_deuterostomes_from_m8,
        sample_name, os.path.join(result_dir, ANNOTATE_GSNAPL_M8_WITH_TAXIDS_OUT),
        os.path.join(result_dir, FILTER_DEUTEROSTOMES_FROM_NT_M8_OUT),
        deuterostome_list_s3_path, result_dir, sample_s3_output_path, False)

    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "generate taxid outputs from m8",
        "count_reads": False})
    run_and_log(logparams, run_generate_taxid_outputs_from_m8,
        sample_name, os.path.join(result_dir, FILTER_DEUTEROSTOMES_FROM_NT_M8_OUT),
        os.path.join(result_dir, NT_M8_TO_TAXID_COUNTS_FILE_OUT),
        os.path.join(result_dir, NT_TAXID_COUNTS_TO_JSON_OUT),
        os.path.join(result_dir, NT_TAXID_COUNTS_TO_SPECIES_RPM_OUT),
        os.path.join(result_dir, NT_TAXID_COUNTS_TO_GENUS_RPM_OUT),
        taxid2info_s3_path, 'NT', 'raw', db_sample_id,
        result_dir, sample_s3_output_path, False)

    # run rapsearch remotely
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "filter deuterostomes from FASTA",
        "count_reads": False})
    run_and_log(logparams, run_filter_deuterostomes_from_fasta,
        sample_name, os.path.join(result_dir, GENERATE_TAXID_ANNOTATED_FASTA_FROM_M8_OUT),
        os.path.join(result_dir, FILTER_DEUTEROSTOME_FROM_TAXID_ANNOTATED_FASTA_OUT),
        accession2taxid_s3_path, deuterostome_list_s3_path, 'NT',
        result_dir, sample_s3_output_path, False)

    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "RAPSearch2", "count_reads": True,
        "before_file_name": os.path.join(result_dir, FILTER_DEUTEROSTOME_FROM_TAXID_ANNOTATED_FASTA_OUT),
        "before_file_type": "fasta",
        "after_file_name": os.path.join(result_dir, RAPSEARCH2_OUT),
        "after_file_type": "m8"})
    run_and_log(logparams, run_rapsearch2_remotely,
        sample_name, FILTER_DEUTEROSTOME_FROM_TAXID_ANNOTATED_FASTA_OUT,
        rapsearch_ssh_key_s3_path,
        result_dir, sample_s3_output_path, lazy_run)

    # run_annotate_m8_with_taxids
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "annotate m8 with taxids",
        "count_reads": False})
    run_and_log(logparams, run_annotate_m8_with_taxids,
        sample_name, os.path.join(result_dir, RAPSEARCH2_OUT),
        os.path.join(result_dir, ANNOTATE_RAPSEARCH2_M8_WITH_TAXIDS_OUT),
        accession2taxid_s3_path,
        result_dir, sample_s3_output_path, False)

    # run_generate_taxid_annotated_fasta_from_m8
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "generate taxid annotated fasta from m8",
        "count_reads": False})
    run_and_log(logparams, run_generate_taxid_annotated_fasta_from_m8,
        sample_name, result_dir + '/' + RAPSEARCH2_OUT,
        result_dir + '/' + FILTER_DEUTEROSTOME_FROM_TAXID_ANNOTATED_FASTA_OUT,
        result_dir + '/' + GENERATE_TAXID_ANNOTATED_FASTA_FROM_RAPSEARCH2_M8_OUT,
        'NR', result_dir, sample_s3_output_path, False)

    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "filter deuterostomes from m8", "count_reads": True,
        "before_file_name": os.path.join(result_dir, ANNOTATE_RAPSEARCH2_M8_WITH_TAXIDS_OUT),
        "before_file_type": "m8",
        "after_file_name": os.path.join(result_dir, FILTER_DEUTEROSTOMES_FROM_NR_M8_OUT),
        "after_file_type": "m8"})
    run_and_log(logparams, run_filter_deuterostomes_from_m8,
        sample_name, os.path.join(result_dir, ANNOTATE_RAPSEARCH2_M8_WITH_TAXIDS_OUT),
        os.path.join(result_dir, FILTER_DEUTEROSTOMES_FROM_NR_M8_OUT),
        deuterostome_list_s3_path, result_dir, sample_s3_output_path, False)

    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "generate taxid outputs from m8",
        "count_reads": False})
    run_and_log(logparams, run_generate_taxid_outputs_from_m8,
        sample_name, os.path.join(result_dir, FILTER_DEUTEROSTOMES_FROM_NR_M8_OUT),
        os.path.join(result_dir, NR_M8_TO_TAXID_COUNTS_FILE_OUT),
        os.path.join(result_dir, NR_TAXID_COUNTS_TO_JSON_OUT),
        os.path.join(result_dir, NR_TAXID_COUNTS_TO_SPECIES_RPM_OUT),
        os.path.join(result_dir, NR_TAXID_COUNTS_TO_GENUS_RPM_OUT),
        taxid2info_s3_path, 'NR', 'log10', db_sample_id,
        result_dir, sample_s3_output_path, False)

    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "combine JSON outputs",
        "count_reads": False})
    run_and_log(logparams, run_combine_json_outputs,
        sample_name, result_dir + '/' + NT_TAXID_COUNTS_TO_JSON_OUT,
        result_dir + '/' + NR_TAXID_COUNTS_TO_JSON_OUT,
        result_dir + '/' + COMBINED_JSON_OUT,
        result_dir, sample_s3_output_path, False)

    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "generate FASTA of unidentified reads", "count_reads": True,
        "before_file_name": os.path.join(result_dir, GENERATE_TAXID_ANNOTATED_FASTA_FROM_RAPSEARCH2_M8_OUT),
        "before_file_type": "fasta",
        "after_file_name": os.path.join(result_dir, UNIDENTIFIED_FASTA_OUT),
        "after_file_type": "fasta"})
    run_and_log(logparams, run_generate_unidentified_fasta,
        sample_name, result_dir + '/' + GENERATE_TAXID_ANNOTATED_FASTA_FROM_RAPSEARCH2_M8_OUT,
        result_dir + '/' + UNIDENTIFIED_FASTA_OUT,
        result_dir, sample_s3_output_path, False)

def run_host_filtering(sample_name, fastq_file_1, fastq_file_2, file_type, initial_file_type_for_log, star_genome_s3_path, bowtie2_genome_s3_path,
                       DEFAULT_LOGPARAMS, result_dir, scratch_dir, sample_s3_output_path, lazy_run):
    # run STAR
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "STAR", "count_reads": True,
        "before_file_name": fastq_file_1,
        "before_file_type": initial_file_type_for_log,
        "after_file_name": os.path.join(result_dir, STAR_OUT1),
        "after_file_type": initial_file_type_for_log})
    run_and_log(logparams, run_star,
        sample_name, fastq_file_1, fastq_file_2, file_type, star_genome_s3_path,
        result_dir, scratch_dir, sample_s3_output_path, lazy_run)

    # run priceseqfilter
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "PriceSeqFilter", "count_reads": True,
        "before_file_name": os.path.join(result_dir, STAR_OUT1),
        "before_file_type": initial_file_type_for_log,
        "after_file_name": os.path.join(result_dir, PRICESEQFILTER_OUT1),
        "after_file_type": initial_file_type_for_log})
    run_and_log(logparams, run_priceseqfilter,
        sample_name, os.path.join(result_dir, STAR_OUT1),
        os.path.join(result_dir, STAR_OUT2), file_type,
        result_dir, sample_s3_output_path, lazy_run)

    # run fastq to fasta
    if "fastq" in file_type:
        logparams = return_merged_dict(DEFAULT_LOGPARAMS,
            {"title": "FASTQ to FASTA",
            "count_reads": False})
        run_and_log(logparams, run_fq2fa,
            sample_name, os.path.join(result_dir, PRICESEQFILTER_OUT1),
            os.path.join(result_dir, PRICESEQFILTER_OUT2),
            result_dir, sample_s3_output_path, lazy_run)
        next_input_1 = FQ2FA_OUT1
        next_input_2 = FQ2FA_OUT2
    else:
        next_input_1 = PRICESEQFILTER_OUT1
        next_input_2 = PRICESEQFILTER_OUT2

    # run cdhitdup
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "CD-HIT-DUP", "count_reads": True,
        "before_file_name": os.path.join(result_dir, next_input_1),
        "before_file_type": "fasta_paired",
        "after_file_name": os.path.join(result_dir, CDHITDUP_OUT1),
        "after_file_type": "fasta_paired"})
    run_and_log(logparams, run_cdhitdup,
        sample_name, os.path.join(result_dir, next_input_1),
        os.path.join(result_dir, next_input_2),
        result_dir, sample_s3_output_path, lazy_run)

    # run lzw filter
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "LZW filter", "count_reads": True,
        "before_file_name": os.path.join(result_dir, CDHITDUP_OUT1),
        "before_file_type": "fasta_paired",
        "after_file_name": os.path.join(result_dir, LZW_OUT1),
        "after_file_type": "fasta_paired"})
    run_and_log(logparams, run_lzw,
        sample_name, os.path.join(result_dir, CDHITDUP_OUT1),
        os.path.join(result_dir, CDHITDUP_OUT2),
        result_dir, sample_s3_output_path, lazy_run)

    # run bowtie
    logparams = return_merged_dict(DEFAULT_LOGPARAMS,
        {"title": "bowtie2", "count_reads": True,
        "before_file_name": os.path.join(result_dir, LZW_OUT1),
        "before_file_type": "fasta_paired",
        "after_file_name": os.path.join(result_dir, EXTRACT_UNMAPPED_FROM_SAM_OUT1),
        "after_file_type": "fasta_paired"})
    run_and_log(logparams, run_bowtie2,
        sample_name, os.path.join(result_dir, LZW_OUT1),
        os.path.join(result_dir, LZW_OUT2),
        bowtie2_genome_s3_path, result_dir, sample_s3_output_path, lazy_run)


def run_star(sample_name, fastq_file_1, fastq_file_2, file_type, star_genome_s3_path,
             result_dir, scratch_dir, sample_s3_output_path, lazy_run):
    if lazy_run:
        # check if output already exists
        output1 = "%s/%s" % (result_dir, STAR_OUT1)
        output2 = "%s/%s" % (result_dir, STAR_OUT2)
        if os.path.isfile(output1) and os.path.isfile(output2):
            return 1
    # check if genome downloaded already
    genome_file = os.path.basename(star_genome_s3_path)
    if not os.path.isfile("%s/%s" % (REF_DIR, genome_file)):
        execute_command("aws s3 cp %s %s/" % (star_genome_s3_path, REF_DIR))
        execute_command("cd %s; tar xvfz %s" % (REF_DIR, genome_file))
        logging.getLogger().info("downloaded index")
    star_command_params = ['cd', scratch_dir, ';', STAR,
                           '--outFilterMultimapNmax', '99999',
                           '--outFilterScoreMinOverLread', '0.5',
                           '--outFilterMatchNminOverLread', '0.5',
                           '--outReadsUnmapped', 'Fastx',
                           '--outFilterMismatchNmax', '999',
                           '--outSAMmode', 'None',
                           '--clip3pNbases', '0',
                           '--runThreadN', str(multiprocessing.cpu_count()),
                           '--genomeDir', REF_DIR + '/STAR_genome',
                           '--readFilesIn', fastq_file_1, fastq_file_2]
    if ".gz" in file_type:
        star_command_params.extend(['--readFilesCommand', 'zcat'])
    execute_command(" ".join(star_command_params))
    logging.getLogger().info("finished job")
    # extract out unmapped files
    execute_command("cp %s/%s %s/%s;" % (scratch_dir, 'Unmapped.out.mate1', result_dir, STAR_OUT1))
    execute_command("cp %s/%s %s/%s;" % (scratch_dir, 'Unmapped.out.mate2', result_dir, STAR_OUT2))
    # copy back to aws
    execute_command("aws s3 cp %s/%s %s/;" % (result_dir, STAR_OUT1, sample_s3_output_path))
    execute_command("aws s3 cp %s/%s %s/;" % (result_dir, STAR_OUT2, sample_s3_output_path))
    # cleanup
    execute_command("cd %s; rm -rf *" % scratch_dir)

def run_priceseqfilter(sample_name, input_fq_1, input_fq_2, file_type,
                       result_dir, sample_s3_output_path, lazy_run):
    if lazy_run:
        # check if output already exists
        output1 = "%s/%s" % (result_dir, PRICESEQFILTER_OUT1)
        output2 = "%s/%s" % (result_dir, PRICESEQFILTER_OUT2)
        if os.path.isfile(output1) and os.path.isfile(output2):
            return 1
    priceseq_params = [PRICESEQ_FILTER,
                       '-a','12',
                       '-fp',input_fq_1 , input_fq_2,
                       '-op',
                       result_dir +'/' + PRICESEQFILTER_OUT1,
                       result_dir +'/' + PRICESEQFILTER_OUT2,
                       '-rnf','90',
                       '-log','c']
    if "fastq" in file_type:
        priceseq_params.extend(['-rqf','85','0.98'])
    execute_command(" ".join(priceseq_params))
    logging.getLogger().info("finished job")
    # copy back to aws
    execute_command("aws s3 cp %s/%s %s/;" % (result_dir, PRICESEQFILTER_OUT1, sample_s3_output_path))
    execute_command("aws s3 cp %s/%s %s/;" % (result_dir, PRICESEQFILTER_OUT2, sample_s3_output_path))

def run_fq2fa(sample_name, input_fq_1, input_fq_2,
              result_dir, sample_s3_output_path, lazy_run):
    if lazy_run:
        # check if output already exists
        output1 = "%s/%s" % (result_dir, FQ2FA_OUT1)
        output2 = "%s/%s" % (result_dir, FQ2FA_OUT2)
        if os.path.isfile(output1) and os.path.isfile(output2):
            return 1
    execute_command("sed -n '1~4s/^@/>/p;2~4p' <%s >%s/%s" % (input_fq_1, result_dir, FQ2FA_OUT1))
    execute_command("sed -n '1~4s/^@/>/p;2~4p' <%s >%s/%s" % (input_fq_2, result_dir, FQ2FA_OUT2))
    logging.getLogger().info("finished job")
    # copy back to aws
    execute_command("aws s3 cp %s/%s %s/;" % (result_dir, FQ2FA_OUT1, sample_s3_output_path))
    execute_command("aws s3 cp %s/%s %s/;" % (result_dir, FQ2FA_OUT2, sample_s3_output_path))

def run_cdhitdup(sample_name, input_fa_1, input_fa_2,
                 result_dir, sample_s3_output_path, lazy_run):
    if lazy_run:
        # check if output already exists
        output1 = "%s/%s" % (result_dir, CDHITDUP_OUT1)
        output2 = "%s/%s" % (result_dir, CDHITDUP_OUT2)
        if os.path.isfile(output1) and os.path.isfile(output2):
            return 1
    cdhitdup_params = [CDHITDUP,
                       '-i',  input_fa_1,
                       '-i2', input_fa_2,
                       '-o',  result_dir + '/' + CDHITDUP_OUT1,
                       '-o2', result_dir + '/' + CDHITDUP_OUT2,
                       '-e',  '0.05', '-u', '70']
    execute_command(" ".join(cdhitdup_params))
    logging.getLogger().info("finished job")
    # copy back to aws
    execute_command("aws s3 cp %s/%s %s/;" % (result_dir, CDHITDUP_OUT1, sample_s3_output_path))
    execute_command("aws s3 cp %s/%s %s/;" % (result_dir, CDHITDUP_OUT2, sample_s3_output_path))

def run_lzw(sample_name, input_fa_1, input_fa_2,
            result_dir, sample_s3_output_path, lazy_run):
    if lazy_run:
        # check if output already exists
        output1 = "%s/%s" % (result_dir, LZW_OUT1)
        output2 = "%s/%s" % (result_dir, LZW_OUT2)
        if os.path.isfile(output1) and os.path.isfile(output2):
            return 1
    output_prefix = result_dir + '/' + LZW_OUT1[:-8]
    generate_lzw_filtered_paired(input_fa_1, input_fa_2, output_prefix, LZW_FRACTION_CUTOFF)
    logging.getLogger().info("finished job")
    # copy back to aws
    execute_command("aws s3 cp %s/%s %s/;" % (result_dir, LZW_OUT1, sample_s3_output_path))
    execute_command("aws s3 cp %s/%s %s/;" % (result_dir, LZW_OUT2, sample_s3_output_path))

def run_bowtie2(sample_name, input_fa_1, input_fa_2, bowtie2_genome_s3_path,
                result_dir, sample_s3_output_path, lazy_run):
    if lazy_run:
        # check if output already exists
        output1 = "%s/%s" % (result_dir, BOWTIE2_OUT)
        output2 = "%s/%s" % (result_dir, EXTRACT_UNMAPPED_FROM_SAM_OUT1)
        output3 = "%s/%s" % (result_dir, EXTRACT_UNMAPPED_FROM_SAM_OUT2)
        output4 = "%s/%s" % (result_dir, EXTRACT_UNMAPPED_FROM_SAM_OUT3)
        if os.path.isfile(output1) and os.path.isfile(output2) and \
           os.path.isfile(output3) and os.path.isfile(output4):
            return 1
    # Doing the work
    # check if genome downloaded already
    genome_file = os.path.basename(bowtie2_genome_s3_path)
    if not os.path.isfile("%s/%s" % (REF_DIR, genome_file)):
        execute_command("aws s3 cp %s %s/" % (bowtie2_genome_s3_path, REF_DIR))
        execute_command("cd %s; tar xvfz %s" % (REF_DIR, genome_file))
        logging.getLogger().info("downloaded index")
    local_genome_dir_ls =  execute_command("ls %s/bowtie2_genome/*.bt2*" % REF_DIR)
    genome_basename = local_genome_dir_ls.split("\n")[0][:-6]
    if genome_basename[-1] == '.':
        genome_basename = genome_basename[:-1]
    bowtie2_params = [BOWTIE2,
                     '-p', str(multiprocessing.cpu_count()),
                     '-x', genome_basename,
                     '--very-sensitive-local',
                     '-f', '-1', input_fa_1, '-2', input_fa_2,
                     '-S', result_dir + '/' + BOWTIE2_OUT]
    execute_command(" ".join(bowtie2_params))
    logging.getLogger().info("finished alignment")
    # extract out unmapped files from sam
    output_prefix = result_dir + '/' + EXTRACT_UNMAPPED_FROM_SAM_OUT1[:-8]
    generate_unmapped_pairs_from_sam(result_dir + '/' + BOWTIE2_OUT, output_prefix)
    logging.getLogger().info("extracted unmapped pairs from SAM file")
    # copy back to aws
    execute_command("aws s3 cp %s/%s %s/;" % (result_dir, BOWTIE2_OUT, sample_s3_output_path))
    execute_command("aws s3 cp %s/%s %s/;" % (result_dir, EXTRACT_UNMAPPED_FROM_SAM_OUT1, sample_s3_output_path))
    execute_command("aws s3 cp %s/%s %s/;" % (result_dir, EXTRACT_UNMAPPED_FROM_SAM_OUT2, sample_s3_output_path))
    execute_command("aws s3 cp %s/%s %s/;" % (result_dir, EXTRACT_UNMAPPED_FROM_SAM_OUT3, sample_s3_output_path))

def run_gsnapl_remotely(sample, input_files,
                        gsnap_ssh_key_s3_path,
                        result_dir, sample_s3_output_path, lazy_run):
    if lazy_run:
        # check if output already exists
        output = "%s/%s" % (result_dir, GSNAPL_OUT)
        if os.path.isfile(output):
            return 1
    key_name = os.path.basename(gsnap_ssh_key_s3_path)
    execute_command("aws s3 cp %s %s/" % (gsnap_ssh_key_s3_path, REF_DIR))
    key_path = REF_DIR +'/' + key_name
    execute_command("chmod 400 %s" % key_path)
    remote_username = "ubuntu"
    remote_home_dir = "/home/%s" % remote_username
    remote_work_dir = "%s/batch-pipeline-workdir/%s" % (remote_home_dir, sample)
    remote_index_dir = "%s/share" % remote_home_dir
    commands =  "mkdir -p %s;" % remote_work_dir
    for input_fa in input_files:
        commands += "aws s3 cp %s/%s %s/ ; " % \
                 (sample_s3_output_path, input_fa, remote_work_dir)
    commands += " ".join([remote_home_dir+'/bin/gsnapl',
                          '-A', 'm8', '--batch=2',
                          '--gmap-mode=none', '--npaths=1', '--ordered',
                          '-t', '32',
                          '--maxsearch=5', '--max-mismatches=20',
                          '-D', remote_index_dir, '-d', 'nt_k16']
                          + [remote_work_dir+'/'+input_fa for input_fa in input_files]
                          + ['> '+remote_work_dir+'/'+GSNAPL_OUT, ';'])
    commands += "aws s3 cp %s/%s %s/;" % \
                 (remote_work_dir, GSNAPL_OUT, sample_s3_output_path)
    # check if remote machins has enough capacity
    check_command = 'ssh -o "StrictHostKeyChecking no" -i %s %s@%s "ps aux|grep gsnapl|grep -v bash"' % (key_path, remote_username, GSNAPL_INSTANCE_IP)
    logging.getLogger().info("waiting for server")
    wait_for_server('GSNAPL', check_command, GSNAPL_MAX_CONCURRENT)
    logging.getLogger().info("starting alignment")
    remote_command = 'ssh -o "StrictHostKeyChecking no" -i %s %s@%s "%s"' % (key_path, remote_username, GSNAPL_INSTANCE_IP, commands)
    execute_command(remote_command)
    # move gsnapl output back to local
    time.sleep(10)
    logging.getLogger().info("finished alignment")
    execute_command("aws s3 cp %s/%s %s/" % (sample_s3_output_path, GSNAPL_OUT, result_dir))
    # Deduplicate m8 input. Sometimes GSNAPL outputs multiple consecutive lines for same original read and same accession id. Count functions expect only 1 (top hit).
    deduplicate_m8(os.path.join(result_dir, GSNAPL_OUT), os.path.join(result_dir, GSNAPL_DEDUP_OUT))
    execute_command("aws s3 cp %s/%s %s/" % (result_dir, GSNAPL_DEDUP_OUT, sample_s3_output_path))

def run_annotate_m8_with_taxids(sample_name, input_m8, output_m8,
                                accession2taxid_s3_path,
                                result_dir, sample_s3_output_path, lazy_run):
    if lazy_run:
        # check if output already exists
        if os.path.isfile(output_m8):
            return 1
    accession2taxid_gz = os.path.basename(accession2taxid_s3_path)
    accession2taxid_path = REF_DIR + '/' + accession2taxid_gz[:-3]
    if not os.path.isfile(accession2taxid_path):
        execute_command("aws s3 cp %s %s/" % (accession2taxid_s3_path, REF_DIR))
        execute_command("cd %s; gunzip %s" % (REF_DIR, accession2taxid_gz))
        logging.getLogger().info("downloaded accession-to-taxid map")
    generate_taxid_annotated_m8(input_m8, output_m8, accession2taxid_path)
    logging.getLogger().info("finished annotation")
    # move the output back to S3
    execute_command("aws s3 cp %s %s/" % (output_m8, sample_s3_output_path))

def run_filter_deuterostomes_from_m8(sample_name, input_m8, output_m8,
                                     deuterostome_list_s3_path,
                                     result_dir, sample_s3_output_path, lazy_run):
    if lazy_run:
        # check if output already exists
        if os.path.isfile(output_m8):
            return 1
    deuterostome_file_basename = os.path.basename(deuterostome_list_s3_path)
    deuterostome_file = os.path.join(REF_DIR, deuterostome_file_basename)
    if not os.path.isfile(deuterostome_file):
        execute_command("aws s3 cp %s %s/" % (deuterostome_list_s3_path, REF_DIR))
        logging.getLogger().info("downloaded deuterostome list")
    filter_deuterostomes_from_m8(input_m8, output_m8, deuterostome_file)
    logging.getLogger().info("finished job")
    # move the output back to S3
    execute_command("aws s3 cp %s %s/" % (output_m8, sample_s3_output_path))

def run_generate_taxid_annotated_fasta_from_m8(sample_name, input_m8, input_fasta,
    output_fasta, annotation_prefix, result_dir, sample_s3_output_path, lazy_run):
    if lazy_run:
        # check if output already exists
        if os.path.isfile(output_fasta):
            return 1
    generate_taxid_annotated_fasta_from_m8(input_fasta, input_m8, output_fasta, annotation_prefix)
    logging.getLogger().info("finished job")
    # move the output back to S3
    execute_command("aws s3 cp %s %s/" % (output_fasta, sample_s3_output_path))

def run_filter_deuterostomes_from_fasta(sample_name, input_fa, output_fa,
    accession2taxid_s3_path, deuterostome_list_s3_path, annotation_prefix,
    result_dir, sample_s3_output_path, lazy_run):
    if lazy_run:
        # check if output already exists
        if os.path.isfile(output_fa):
            return 1
    accession2taxid_gz = os.path.basename(accession2taxid_s3_path)
    accession2taxid_path = REF_DIR + '/' + accession2taxid_gz[:-3]
    if not os.path.isfile(accession2taxid_path):
        execute_command("aws s3 cp %s %s/" % (accession2taxid_s3_path, REF_DIR))
        execute_command("cd %s; gunzip %s" % (REF_DIR, accession2taxid_gz))
        logging.getLogger().info("downloaded accession-to-taxid map")
    deuterostome_file_basename = os.path.basename(deuterostome_list_s3_path)
    deuterostome_file = os.path.join(REF_DIR, deuterostome_file_basename)
    if not os.path.isfile(deuterostome_file):
        execute_command("aws s3 cp %s %s/" % (deuterostome_list_s3_path, REF_DIR))
        logging.getLogger().info("downloaded deuterostome list")
    filter_taxids_from_fasta(input_fa, output_fa, annotation_prefix, accession2taxid_path, deuterostome_file)
    logging.getLogger().info("finished job")
    # move the output back to S3
    execute_command("aws s3 cp %s %s/" % (output_fa, sample_s3_output_path))

def run_rapsearch2_remotely(sample, input_fasta,
    rapsearch_ssh_key_s3_path, result_dir, sample_s3_output_path, lazy_run):
    if lazy_run:
        # check if output already exists
        output = "%s/%s" % (result_dir, RAPSEARCH2_OUT)
        if os.path.isfile(output):
            return 1
    key_name = os.path.basename(rapsearch_ssh_key_s3_path)
    execute_command("aws s3 cp %s %s/" % (rapsearch_ssh_key_s3_path, REF_DIR))
    key_path = REF_DIR +'/' + key_name
    execute_command("chmod 400 %s" % key_path)
    remote_username = "ec2-user"
    remote_home_dir = "/home/%s" % remote_username
    remote_work_dir = "%s/batch-pipeline-workdir/%s" % (remote_home_dir, sample)
    remote_index_dir = "%s/references/nr_rapsearch" % remote_home_dir

    commands =  "mkdir -p %s;" % remote_work_dir
    commands += "aws s3 cp %s/%s %s/ ; " % \
                 (sample_s3_output_path, input_fasta, remote_work_dir)
    input_path = remote_work_dir + '/' + input_fasta
    output_path = remote_work_dir + '/' + RAPSEARCH2_OUT
    commands += " ".join(['/usr/local/bin/rapsearch',
                          '-d', remote_index_dir+'/nr_rapsearch',
                          '-e','-6',
                          '-l','10',
                          '-a','T',
                          '-b','0',
                          '-v','1',
                          '-z', str(multiprocessing.cpu_count()), # threads
                          '-q', input_path,
                          '-o', output_path[:-3],
                          ';'])
    commands += "aws s3 cp %s/%s %s/;" % \
                 (remote_work_dir, RAPSEARCH2_OUT, sample_s3_output_path)
    check_command = 'ssh -o "StrictHostKeyChecking no" -i %s %s@%s "ps aux|grep rapsearch|grep -v bash"' % (key_path, remote_username, RAPSEARCH2_INSTANCE_IP)
    logging.getLogger().info("waiting for server")
    wait_for_server('RAPSEARCH2', check_command, RAPSEARCH2_MAX_CONCURRENT)
    logging.getLogger().info("starting alignment")
    remote_command = 'ssh -o "StrictHostKeyChecking no" -i %s %s@%s "%s"' % (key_path, remote_username, RAPSEARCH2_INSTANCE_IP, commands)
    execute_command(remote_command)
    logging.getLogger().info("finished alignment")
    # move output back to local
    time.sleep(10) # wait until the data is synced
    execute_command("aws s3 cp %s/%s %s/" % (sample_s3_output_path, RAPSEARCH2_OUT, result_dir))

def run_generate_taxid_outputs_from_m8(sample_name,
    annotated_m8,
    taxon_counts_csv_file, taxon_counts_json_file,
    taxon_species_rpm_file, taxon_genus_rpm_file,
    taxinfodb_s3_path, count_type, e_value_type, db_sample_id,
    result_dir, sample_s3_output_path, lazy_run):
    # Ignore lazyrun
    # download taxoninfodb if not exist
    taxoninfo_filename = os.path.basename(taxinfodb_s3_path)
    taxoninfo_path = REF_DIR + '/' + taxoninfo_filename
    if not os.path.isfile(taxoninfo_path):
        execute_command("aws s3 cp %s %s/" % (taxinfodb_s3_path, REF_DIR))
        logging.getLogger().info("downloaded taxon info database")
    generate_tax_counts_from_m8(annotated_m8, e_value_type, taxon_counts_csv_file)
    logging.getLogger().info("generated taxon counts from m8")
    generate_json_from_taxid_counts(sample_name, taxon_counts_csv_file,
                                    taxoninfo_path, taxon_counts_json_file,
                                    count_type, db_sample_id)
    logging.getLogger().info("generated JSON file from taxon counts")
    generate_rpm_from_taxid_counts(taxon_counts_csv_file, taxoninfo_path,
                                   taxon_species_rpm_file, taxon_genus_rpm_file)
    logging.getLogger().info("calculated RPM from taxon counts")
    # move the output back to S3
    execute_command("aws s3 cp %s %s/" % (taxon_counts_csv_file, sample_s3_output_path))
    execute_command("aws s3 cp %s %s/" % (taxon_counts_json_file, sample_s3_output_path))
    execute_command("aws s3 cp %s %s/" % (taxon_species_rpm_file, sample_s3_output_path))
    execute_command("aws s3 cp %s %s/" % (taxon_genus_rpm_file, sample_s3_output_path))

def run_combine_json_outputs(sample_name, input_json_1, input_json_2, output_json,
    result_dir, sample_s3_output_path, lazy_run):
    if lazy_run:
        # check if output already exists
        if os.path.isfile(output_json):
            return 1
    project_name = os.path.basename(os.path.dirname(sample_s3_output_path))
    combine_json(project_name, sample_name, input_json_1, input_json_2, output_json)
    logging.getLogger().info("finished job")
    # move it the output back to S3
    execute_command("aws s3 cp %s %s/" % (output_json, sample_s3_output_path))

def run_generate_unidentified_fasta(sample_name, input_fa, output_fa, 
    result_dir, sample_s3_output_path, lazy_run):
    if lazy_run:
        if os.path.isfile(output_fa):
            return 1
    subprocess.check_output("grep -A 1 '>NR::NT::' %s | sed '/^--$/d' > %s" % (input_fa, output_fa), shell=True)
    logging.getLogger().info("finished job")
    execute_command("aws s3 cp %s %s/" % (output_fa, sample_s3_output_path))

### Main
def main():
    global INPUT_BUCKET
    global FILE_TYPE
    global OUTPUT_BUCKET
    global KEY_S3_PATH
    global STAR_GENOME
    global BOWTIE2_GENOME
    global FILTER_HOST_FLAG
    INPUT_BUCKET = os.environ.get('INPUT_BUCKET', INPUT_BUCKET)
    FILE_TYPE = os.environ.get('FILE_TYPE', FILE_TYPE)
    OUTPUT_BUCKET = os.environ.get('OUTPUT_BUCKET', OUTPUT_BUCKET)
    KEY_S3_PATH = os.environ.get('KEY_S3_PATH', KEY_S3_PATH)
    STAR_GENOME = os.environ.get('STAR_GENOME', STAR_GENOME)
    BOWTIE2_GENOME = os.environ.get('BOWTIE2_GENOME', BOWTIE2_GENOME)
    DB_SAMPLE_ID = os.environ['DB_SAMPLE_ID']
    AWS_BATCH_JOB_ID = os.environ.get('AWS_BATCH_JOB_ID', 'local')
    FILTER_HOST_FLAG = os.environ.get('FILTER_HOST_FLAG', FILTER_HOST_FLAG)
    sample_s3_input_path = INPUT_BUCKET.rstrip('/')
    sample_s3_output_path = OUTPUT_BUCKET.rstrip('/')

    run_sample(sample_s3_input_path, FILE_TYPE, FILTER_HOST_FLAG, sample_s3_output_path,
               STAR_GENOME, BOWTIE2_GENOME,
               KEY_S3_PATH, KEY_S3_PATH, ACCESSION2TAXID,
               DEUTEROSTOME_TAXIDS, TAXID_TO_INFO, DB_SAMPLE_ID,
               AWS_BATCH_JOB_ID, True)

if __name__=="__main__":
    main()
