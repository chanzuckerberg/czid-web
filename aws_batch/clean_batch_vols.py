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
    ebs_list=json.loads(execute_command("aegea ebs ls --json"))
    for vol in ebs_list:
        if vol['state'] == 'available' and vol['volume_type'] == 'st1':
            execute_command("aegea rm %s -f; echo %s" % (vol['id'], vol['tags']))


if __name__=="__main__":
    main()
