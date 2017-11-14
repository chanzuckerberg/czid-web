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
from common import *

INPUT_BUCKET = 's3://czbiohub-infectious-disease/UGANDA' # default to be overwritten by environment variable
FILE_TYPE = 'fastq.gz'
OUTPUT_BUCKET = 's3://czbiohub-idseq-samples-test/id-uganda'  # default to be overwritten by environment variable
ROOT_DIR = '/mnt'
DEST_DIR = ROOT_DIR + '/idseq/data' # generated data go here
REF_DIR  = ROOT_DIR + '/idseq/ref' # referene genome / ref databases go here

STAR="STAR"
PRICESEQ_FILTER="PriceSeqFilter"
CDHITDUP="cd-hit-dup"
BOWTIE2="bowtie2"


LZW_FRACTION_CUTOFF = 0.45

GSNAPL_MAX_CONCURRENT = 20
RAPSEARCH2_MAX_CONCURRENT = 5

STAR_GENOME = 's3://czbiohub-infectious-disease/references/human/STAR_genome.tar.gz'
BOWTIE2_GENOME = 's3://czbiohub-infectious-disease/references/human/bowtie2_genome.tar.gz'

# output files
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
LOGS_OUT_BASENAME = 'log'
STATS_OUT = 'stats.json'

# global statistics log
STATS = []

### convenience functions
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
        while line[0] == '@':
            line = samf.readline() # skip headers
        read1 = line
        read2 = samf.readline()
        while read1 and read2:
            parts1 = read1.split("\t")
            parts2 = read2.split("\t")
            if parts1[1] == "77" and parts2[1] == "141": # both parts unmapped
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

### job functions
def run_stage1(sample_s3_input_path, file_type, sample_s3_output_path,
               star_genome_s3_path, bowtie2_genome_s3_path, db_sample_id,
               aws_batch_job_id, lazy_run = True):

    sample_s3_output_path = sample_s3_output_path.rstrip('/')
    sample_name = sample_s3_input_path[5:].rstrip('/').replace('/','-')
    sample_dir = DEST_DIR + '/' + sample_name
    fastq_dir = sample_dir + '/fastqs'
    result_dir = sample_dir + '/results'
    scratch_dir = sample_dir + '/scratch'
    execute_command("mkdir -p %s %s %s %s" % (sample_dir, fastq_dir, result_dir, scratch_dir))
    execute_command("mkdir -p %s " % REF_DIR)

    # configure logger
    log_file = "%s/%s.%s.txt" % (result_dir, LOGS_OUT_BASENAME, aws_batch_job_id)
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    handler = logging.FileHandler(log_file)
    formatter = logging.Formatter("%(asctime)s (%(time_since_last)ss elapsed): %(message)s")
    handler.addFilter(TimeFilter())
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    # now also echo to stdout so they get to cloudwatch
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    formatter = logging.Formatter('(%(time_since_last)ss elapsed): %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    DEFAULT_LOGPARAMS = {"sample_s3_output_path": sample_s3_output_path,
                         "stats_file": os.path.join(result_dir, STATS_OUT)}

    # Download fastqs
    command = "aws s3 ls %s/ | grep '\.%s$'" % (sample_s3_input_path, file_type)
    output = execute_command_with_output(command).rstrip().split("\n")
    for line in output:
        m = re.match(".*?([^ ]*." + re.escape(file_type) + ")", line)
        if m:
            execute_command("aws s3 cp %s/%s %s/" % (sample_s3_input_path, m.group(1), fastq_dir))
        else:
            print "%s doesn't match %s" % (line, file_type)

    fastq_files = execute_command_with_output("ls %s/*.%s" % (fastq_dir, file_type)).rstrip().split("\n")

    # Identify input files and characteristics
    if len(fastq_files) <= 1:
        return # only support paired reads for now
    else:
        fastq_file_1 = fastq_files[0]
        fastq_file_2 = fastq_files[1]

    if lazy_run:
       # Download existing data and see what has been done
        command = "aws s3 cp %s %s --recursive" % (sample_s3_output_path, result_dir)
        print execute_command_with_output(command)

    # Record total number of input reads
    initial_file_type_for_log = "fastq_paired" if "fastq" in file_type else "fasta_paired"
    STATS.append({'total_reads': count_reads(fastq_files[0], initial_file_type_for_log)})

    # run host filtering
    run_host_filtering(sample_name, fastq_file_1, fastq_file_2, file_type, initial_file_type_for_log, star_genome_s3_path, bowtie2_genome_s3_path,
                       DEFAULT_LOGPARAMS, result_dir, scratch_dir, sample_s3_output_path, lazy_run)

def run_star_part(output_dir, genome_dir, fastq_file_1, fastq_file_2):
    execute_command("mkdir -p %s" % output_dir)
    star_command_params = ['cd', output_dir, ';', STAR,
                           '--outFilterMultimapNmax', '99999',
                           '--outFilterScoreMinOverLread', '0.5',
                           '--outFilterMatchNminOverLread', '0.5',
                           '--outReadsUnmapped', 'Fastx',
                           '--outFilterMismatchNmax', '999',
                           '--outSAMmode', 'None',
                           '--clip3pNbases', '0',
                           '--runThreadN', str(multiprocessing.cpu_count()),
                           '--genomeDir', genome_dir,
                           '--readFilesIn', fastq_file_1, fastq_file_2]
    if fastq_file_1[-3:] == '.gz':
        star_command_params += ['--readFilesCommand', 'zcat']
    execute_command_realtime_stdout(" ".join(star_command_params), os.path.join(output_dir, "Log.progress.out"))

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
    # Check if parts.txt file exists, if so use the new version of (partitioned indices). Otherwise, stay put
    if os.path.isfile("%s/STAR_genome/parts.txt" % REF_DIR):
        with open("%s/STAR_genome/parts.txt" % REF_DIR, 'rb') as parts_f:
            num_parts = int(parts_f.read())
        part_idx = 0
        tmp_result_dir = "%s/star-part-%d" % (scratch_dir, part_idx)
        run_star_part(tmp_result_dir, REF_DIR + "/STAR_genome/part-%d" % part_idx, fastq_file_1, fastq_file_2)
        for i in range(1, num_parts):
            fastq_1 = "%s/Unmapped.out.mate1" % tmp_result_dir
            fastq_2 = "%s/Unmapped.out.mate2" % tmp_result_dir
            tmp_result_dir = "%s/star-part-%d" % (scratch_dir, i)
            run_star_part(tmp_result_dir, REF_DIR + "/STAR_genome/part-%d" % i, fastq_1, fastq_2)
        # extract out unmapped files
        execute_command("cp %s/%s %s/%s;" % (tmp_result_dir, 'Unmapped.out.mate1', result_dir, STAR_OUT1))
        execute_command("cp %s/%s %s/%s;" % (tmp_result_dir, 'Unmapped.out.mate2', result_dir, STAR_OUT2))
    else:
        run_star_part(scratch_dir, REF_DIR + '/STAR_genome', fastq_file_1, fastq_file_2)
        # extract out unmapped files
        execute_command("cp %s/%s %s/%s;" % (scratch_dir, 'Unmapped.out.mate1', result_dir, STAR_OUT1))
        execute_command("cp %s/%s %s/%s;" % (scratch_dir, 'Unmapped.out.mate2', result_dir, STAR_OUT2))
    # copy back to aws
    execute_command("aws s3 cp %s/%s %s/;" % (result_dir, STAR_OUT1, sample_s3_output_path))
    execute_command("aws s3 cp %s/%s %s/;" % (result_dir, STAR_OUT2, sample_s3_output_path))
    # cleanup
    execute_command("cd %s; rm -rf *" % scratch_dir)
    logging.getLogger().info("finished job")

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
    execute_command_realtime_stdout(" ".join(priceseq_params))
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
    execute_command_realtime_stdout(" ".join(cdhitdup_params))
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
    local_genome_dir_ls =  execute_command_with_output("ls %s/bowtie2_genome/*.bt2*" % REF_DIR)
    genome_basename = local_genome_dir_ls.split("\n")[0][:-6]
    if genome_basename[-1] == '.':
        genome_basename = genome_basename[:-1]
    bowtie2_params = [BOWTIE2,
                     '-q',
                     '-p', str(multiprocessing.cpu_count()),
                     '-x', genome_basename,
                     '--very-sensitive-local',
                     '-f', '-1', input_fa_1, '-2', input_fa_2,
                     '-S', result_dir + '/' + BOWTIE2_OUT]
    execute_command_realtime_stdout(" ".join(bowtie2_params))
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

### Main
def main():
    # Unbuffer stdout and redirect stderr into stdout.  This helps observe logged events in realtime.
    sys.stdout = os.fdopen(sys.stdout.fileno(), 'w', 0)
    os.dup2(sys.stdout.fileno(), sys.stderr.fileno())

    # collect environment variables
    global INPUT_BUCKET
    global FILE_TYPE
    global OUTPUT_BUCKET
    global STAR_GENOME
    global BOWTIE2_GENOME

    INPUT_BUCKET = os.environ.get('INPUT_BUCKET', INPUT_BUCKET)
    FILE_TYPE = os.environ.get('FILE_TYPE', FILE_TYPE)
    OUTPUT_BUCKET = os.environ.get('OUTPUT_BUCKET', OUTPUT_BUCKET)
    STAR_GENOME = os.environ.get('STAR_GENOME', STAR_GENOME)
    BOWTIE2_GENOME = os.environ.get('BOWTIE2_GENOME', BOWTIE2_GENOME)
    DB_SAMPLE_ID = os.environ['DB_SAMPLE_ID']
    AWS_BATCH_JOB_ID = os.environ.get('AWS_BATCH_JOB_ID', 'local')
 
    sample_s3_input_path = INPUT_BUCKET.rstrip('/')
    sample_s3_output_path = OUTPUT_BUCKET.rstrip('/')

    run_stage1(sample_s3_input_path, FILE_TYPE, sample_s3_output_path,
               STAR_GENOME, BOWTIE2_GENOME, DB_SAMPLE_ID,
               AWS_BATCH_JOB_ID, True)

if __name__=="__main__":
    main()
