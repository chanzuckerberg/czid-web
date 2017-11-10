#!/usr/bin/env python

import argparse
import sys
import subprocess
import json

def execute_command(command):
    print command
    output = subprocess.check_output(command, shell=True)
    return output

def main():
    parser = argparse.ArgumentParser(description = 'Get logs given a job id')
    parser.add_argument('-j', action='store', dest='job_id', help=" batch job id")
    results = parser.parse_args()
    if results.job_id:
        json_output = execute_command("aws batch describe-jobs --jobs=%s" % results.job_id)
        if json_output == '': return
        res = json.loads(json_output)
        log_stream_name = res.get("jobs", [])[0].get("container", {}).get("logStreamName")
        print log_stream_name
        if log_stream_name:
            print execute_command("aws logs  get-log-events --log-stream-name %s --log-group-name /aws/batch/job" % log_stream_name)
    else:
        parser.print_help()
        sys.exit(1)

if __name__=="__main__":
    main()
