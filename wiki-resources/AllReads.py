#!/usr/bin/env python
import sys
import os

def main():
  if len(sys.argv) < 2:
    script_name = os.path.basename(sys.argv[0])
    print("\n%s shows both reads in a paired-end read for every read that mapped to a "
          "particular taxon (even if only one of the reads mapped to that taxon).\n\n"
          "Usage: ./%s <taxon_specific_file> <all_reads_file>\n\n" % (script_name, script_name))
    return

  id_dict = {}
  taxon_specific_file = open(sys.argv[1], 'r')
  while True:
    line = taxon_specific_file.readline()
    read = taxon_specific_file.readline()
    if not line or not read:
      break
    identifier = line.split(':', 16)[-1] # get rid of IDseq's taxonomic prefix
    identifier = identifier[:-3] # get rid of read number suffix and newline
    id_dict[identifier] = 1
    
  all_reads_file = open(sys.argv[2], 'r')
  while True:
    line = all_reads_file.readline()
    read = all_reads_file.readline()
    if not line or not read:
      break
    identifier = line.split(':', 4)[-1] # get rid of IDseq prefix
    identifier = identifier[:-3] # get rid of read number suffix and newline
    if identifier in id_dict:
      print(line[:-1])
      print(read[:-1])

if __name__ == "__main__":
  main()
