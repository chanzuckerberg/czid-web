#!/usr/bin/env python3

import os
import json
import argparse
import collections

parser = argparse.ArgumentParser("idd2wdl", description="Convert an idseq-dag DAG to a WDL workflow")
parser.add_argument("dag")
parser.add_argument("--name")
args = parser.parse_args()
workflow_name = args.name or os.path.basename(args.dag).replace(".json", "")

with open(args.dag) as fh:
    dag = json.load(fh)

print("version 1.0")

input_names = collections.OrderedDict()
targets_to_steps, step_class_count = dict(), collections.defaultdict(int)
for step in dag["steps"]:
    targets_to_steps[step["out"]] = step
    step_class_count[step["class"]] += 1


def file_path_to_name(f):
    return f.replace(".", "_").replace("/", "_").replace("-", "_")


def task_name(step):
    if step_class_count[step["class"]] < 2:
        name = step["class"]
    else:
        name = step["class"] + "_" + step["out"]
    if name.startswith("PipelineStep"):
        name = name[len("PipelineStep"):]
    return name


def target_filename(target, index):
    if target == "fastqs":
        return f"{target}_{index}"
    else:
        return f"{target}_{index}_{file_path_to_name(dag['targets'][target][index])}"


for step in dag["steps"]:
    idd_step_input, wdl_step_input, input_files, input_files_local = [], [], [], []
    for target in step["in"]:
        idd_step_input.append(dag["targets"][target])
        input_files.append([])
        input_files_local.append([])
        for i, file_target in enumerate(dag["targets"][target]):
            if target in targets_to_steps:
                input_name = file_path_to_name(file_target)
            else:
                input_name = target_filename(target, i)
                input_names[input_name] = 1
            wdl_step_input.append(f'    File {input_name}')
            input_files[-1].append(None)
            input_files_local[-1].append(f'~{{{input_name}}}')
    wdl_step_input = "\n".join(wdl_step_input)
    input_files_local = json.dumps(input_files_local)
    idd_step_output = dag["targets"][step["out"]]
    wdl_step_output = "\n".join(f'    File {file_path_to_name(name)} = "{name}"' for name in idd_step_output)
    s3_wd_uri, nha_cluster_ssh_key_uri = "", ""
    if "environment" in step["additional_attributes"]:
        s3_wd_uri = os.path.join(os.path.dirname(dag["output_dir_s3"]), "scratch")
        nha_cluster_ssh_key_uri = f"s3://idseq-secrets/idseq-{step['additional_attributes']['environment']}.pem"

    print(f"""
task {task_name(step)} {{
  runtime {{
    docker: "{os.environ["AWS_ACCOUNT_ID"]}.dkr.ecr.us-west-2.amazonaws.com/idseq-workflows"
  }}
  input {{
{wdl_step_input}
  }}
  command<<<
  python3 <<CODE
  import os, sys, json, contextlib, importlib, threading, logging, subprocess
  os.environ.update(KEY_PATH_S3="{nha_cluster_ssh_key_uri}", AWS_DEFAULT_REGION="{os.environ["AWS_DEFAULT_REGION"]}")
  subprocess.check_call(["pip3", "install", "--upgrade", "https://github.com/chanzuckerberg/idseq-dag/archive/akislyuk-no-input-clobbering.tar.gz"])
  import idseq_dag, idseq_dag.util.s3
  logging.basicConfig(level=logging.INFO)
  idseq_dag.util.s3.config["REF_DIR"] = os.getcwd()
  step = importlib.import_module("{step["module"]}")
  step_instance = step.{step["class"]}(
    name="{step["out"]}",
    input_files={input_files},
    output_files={idd_step_output},
    output_dir_local=os.getcwd(),
    output_dir_s3="{s3_wd_uri}",
    ref_dir_local=idseq_dag.util.s3.config["REF_DIR"],
    additional_files={step["additional_files"]},
    additional_attributes={step["additional_attributes"]},
    step_status_local="status.json",
    step_status_lock=contextlib.suppress()
  )
  step_instance.input_files_local = {input_files_local}
  step_instance.run()
  CODE
  >>>
  output {{
{wdl_step_output}
  }}
}}""")

print(f"\nworkflow idseq_{workflow_name} {{")
print("  input {")
for target in dag["given_targets"]:
    for input_name in input_names:
        if input_name.startswith(target + "_"):
            print("    File", input_name)
print("  }")

for step in dag["steps"]:
    step_inputs = []
    for target in step["in"]:
        for i, filename in enumerate(dag["targets"][target]):
            if target in dag["given_targets"]:
                name = target_filename(target, i)
                step_inputs.append(f'{name} = {name}')
            else:
                name = file_path_to_name(filename)
                step_inputs.append(f'{name} = {task_name(targets_to_steps[target])}.{name}')
    step_inputs = ",\n      ".join(step_inputs)
    if step_inputs:
        print(f"""
  call {task_name(step)} {{
    input:
      {step_inputs}
  }}""")
    else:
        print(f'  call {task_name(step)}')
print("\n  output {")
for target, files in dag["targets"].items():
    if target in dag["given_targets"]:
        continue
    for i, filename in enumerate(files):
        name = file_path_to_name(filename)
        print(f"    File {target_filename(target, i)} = {task_name(targets_to_steps[target])}.{name}")
print("  }")
print("}")
