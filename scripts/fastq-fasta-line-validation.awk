# Validates line length and checks if all characters are part of ascii set
# Required input variables:
#    max_line_length: This is the max allowed length for each line
# usage example:
#    cat somefile.fastq | awk -f "../scripts/fastq-fasta-line-validation.awk" -v max_line_length=10000
{
  if ($0 ~ /[^\x20-\x7F\x01\x09]/) {
    printf "PARSE ERROR: not an ascii file. Line %d contains non-ascii characters.\n", NR > "/dev/stderr";
    exit 1;
  }
  if (length > max_line_length) {
    printf "PARSE ERROR: invalid line length. Line %d is %d characters long, and it exceeds max line length of %d.\n",  NR, length, max_line_length > "/dev/stderr";
    exit 1;
  }
  print $0;
}
