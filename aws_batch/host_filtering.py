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

ENVIRONMENT = 'production'
INPUT_BUCKET = 's3://czbiohub-infectious-disease/UGANDA' # default to be overwritten by environment variable
FILE_TYPE = 'fastq.gz'
OUTPUT_BUCKET = 's3://czbiohub-idseq-samples-test/id-uganda'  # default to be overwritten by environment variable
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

GSNAPL_MAX_CONCURRENT = 20
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
LOGS_OUT_BASENAME = 'log'
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

def return_merged_dict(dict1, dict2):
    result = dict1.copy()
    result.update(dict2)
    return result

### job functions

class Updater(object):

    def __init__(self, update_period, update_function):
        self.update_period = update_period
        self.update_function = update_function
        self.timer_thread = None
        self.t_start = time.time()

    def relaunch(self, initial_launch=False):
        if self.timer_thread and not initial_launch:
            t_elapsed = time.time() - self.t_start
            self.update_function(t_elapsed)
        self.timer_thread = threading.Timer(self.update_period, self.relaunch)
        self.timer_thread.start()

    def __enter__(self):
        self.relaunch(initial_launch=True)
        return self

    def __exit__(self, *args):
        self.timer_thread.cancel()


class CommandTracker(Updater):

    lock = threading.RLock()
    count = 0

    def __init__(self, update_period=15):
        super(CommandTracker, self).__init__(update_period, self.print_update)
        with CommandTracker.lock:
            self.id = CommandTracker.count
            CommandTracker.count += 1

    def print_update(self, t_elapsed):
        print "Command %d still running after %3.1f seconds." % (self.id, t_elapsed)
        sys.stdout.flush()


class ProgressFile(object):

    def __init__(self, progress_file):
        self.progress_file = progress_file
        self.tail_subproc = None

    def __enter__(self):
        # TODO:  Do something else here. Tail gets confused if the file pre-exists.  Also need to rate-limit.
        if self.progress_file:
            self.tail_subproc = subprocess.Popen("touch {pf} ; tail -f {pf}".format(pf=self.progress_file), shell=True)
        return self

    def __exit__(self, *args):
        if self.tail_subproc:
            self.tail_subproc.kill()


def execute_command_with_output(command, progress_file=None):
    with CommandTracker() as ct:
        print "Command {}: {}".format(ct.id, command)
        with ProgressFile(progress_file):
            return subprocess.check_output(command, shell=True)


def execute_command_realtime_stdout(command, progress_file=None):
    with CommandTracker() as ct:
        print "Command {}: {}".format(ct.id, command)
        with ProgressFile(progress_file):
            subprocess.check_call(command, shell=True)


def execute_command(command, progress_file=None):
    execute_command_realtime_stdout(command, progress_file)

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

def percent_str(percent):
    try:
        return "%3.1f" % percent
    except:
        return str(percent)

def run_and_log(logparams, func_name, *args):
    logger = logging.getLogger()
    logger.info("========== %s ==========" % logparams.get("title"))
    # copy log file -- start
    logger.handlers[0].flush()
    execute_command("aws s3 cp %s %s/;" % (logger.handlers[0].baseFilename, logparams["sample_s3_output_path"]))
    # produce the output
    func_return = func_name(*args)
    if func_return == 1:
        logger.info("output exists, lazy run")
    else:
        logger.info("uploaded output")
    # copy log file -- after work is done
    execute_command("aws s3 cp %s %s/;" % (logger.handlers[0].baseFilename, logparams["sample_s3_output_path"]))
    # count records
    required_params = ["before_file_name", "before_file_type", "after_file_name", "after_file_type"]
    if all(param in logparams for param in required_params):
        records_before = count_reads(logparams["before_file_name"], logparams["before_file_type"])
        records_after = count_reads(logparams["after_file_name"], logparams["after_file_type"])
        if logparams["count_reads"]:
            if int(records_before) > 0:
                percent_removed = (100.0 * (records_before - records_after)) / records_before
            else:
                percent_removed = 0.0
            logger.info("%s %% of reads dropped out, %s reads remaining" % (percent_str(percent_removed), str(records_after)))
            STATS.append({'task': func_name.__name__, 'reads_before': records_before, 'reads_after': records_after})
        # function-specific logs
        if func_name.__name__ == "run_cdhitdup":
            compression_ratio = (1.0 * records_before) / records_after
            logger.info("duplicate compression ratio: %s" % str(compression_ratio))
        if func_name.__name__ == "run_priceseqfilter":
            pass_percentage = (100.0 * records_after) / records_before
            logger.info("percentage of reads passing QC filter: %s %%" % str(pass_percentage))
    # copy log file -- end
    logger.handlers[0].flush()
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
               aws_batch_job_id, environment, lazy_run = True):

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
    stats_file = os.path.join(result_dir, STATS_OUT)
    STATS.append({'total_reads': get_total_initial_reads(fastq_files[0], initial_file_type_for_log, stats_file)})

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
    global FILTER_HOST_FLAG
    global ENVIRONMENT

    INPUT_BUCKET = os.environ.get('INPUT_BUCKET', INPUT_BUCKET)
    FILE_TYPE = os.environ.get('FILE_TYPE', FILE_TYPE)
    OUTPUT_BUCKET = os.environ.get('OUTPUT_BUCKET', OUTPUT_BUCKET)
    STAR_GENOME = os.environ.get('STAR_GENOME', STAR_GENOME)
    BOWTIE2_GENOME = os.environ.get('BOWTIE2_GENOME', BOWTIE2_GENOME)
    DB_SAMPLE_ID = os.environ['DB_SAMPLE_ID']
    AWS_BATCH_JOB_ID = os.environ.get('AWS_BATCH_JOB_ID', 'local')
    FILTER_HOST_FLAG = int(os.environ.get('FILTER_HOST_FLAG', FILTER_HOST_FLAG))
    ENVIRONMENT = os.environ.get('ENVIRONMENT', ENVIRONMENT)

    sample_s3_input_path = INPUT_BUCKET.rstrip('/')
    sample_s3_output_path = OUTPUT_BUCKET.rstrip('/')
    key_s3_path = "" # remove this later

    run_sample(sample_s3_input_path, FILE_TYPE, FILTER_HOST_FLAG, sample_s3_output_path,
               STAR_GENOME, BOWTIE2_GENOME,
               key_s3_path, key_s3_path, ACCESSION2TAXID,
               DEUTEROSTOME_TAXIDS, TAXID_TO_INFO, DB_SAMPLE_ID,
               AWS_BATCH_JOB_ID, ENVIRONMENT, True)

if __name__=="__main__":
    main()
