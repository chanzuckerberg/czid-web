#!/usr/bin/env python
import shelve
import subprocess
import os
import gzip
import sys

ACCESSION2TAXID_DB_PATH = '/mnt/idseq/ref/accession2taxid.db'
INPUT_FASTA_S3 = 's3://czbiohub-ncbi-store/blast/db/FASTA/vector.gz'
ROOT_DIR = '/mnt/idseq'

### Functions
def execute_command(command):
    print >>sys.stderr, command
    output = subprocess.check_output(command, shell=True)
    return output

def main():
    global INPUT_FASTA_S3
    INPUT_FASTA_S3 = os.environ.get('INPUT_FASTA_S3', INPUT_FASTA_S3)
    accession2taxid_dict = shelve.open(ACCESSION2TAXID_DB_PATH)
    execute_command("mkdir -p %s/data; aws s3 cp %s %s/data/" %(ROOT_DIR, INPUT_FASTA_S3, ROOT_DIR))
    input_gz_file = "%s/data/%s" % (ROOT_DIR, os.path.basename(INPUT_FASTA_S3))
    with gzip.open(input_gz_file, 'rb') as f:
        for line in f:
            if line[0] == '>':
                accession_id = line.split('|')[3]
                accession_main = accession_id.split('.')[0]
                taxon_id = accession2taxid_dict.get(accession_main, '-1')
                print ",".join([accession_id, taxon_id])


if __name__=="__main__":
    main()
