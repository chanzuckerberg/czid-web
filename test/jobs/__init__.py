import os
import sys

# This is not a python package, so we need some hack to import class under test
project_root_dir_name = os.path.realpath(os.path.dirname(os.path.realpath(__file__)) + "/../../")
python_file_dir_name = project_root_dir_name + "/app/jobs" 
sys.path.append(python_file_dir_name)