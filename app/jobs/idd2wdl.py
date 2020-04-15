#!/usr/bin/env python3

import os
import json
import argparse
import collections

parser = argparse.ArgumentParser("idd2wdl", description="Convert an idseq-dag DAG to a WDL workflow")
parser.add_argument("dag")
parser.add_argument("--name")
parser.add_argument("--output-prefix")
parser.add_argument("--aws-account-id", default=os.environ.get("AWS_ACCOUNT_ID"))
parser.add_argument("--deployment-env", default=os.environ.get("DEPLOYMENT_ENVIRONMENT"))
parser.add_argument("--aws-region", default=os.environ.get("AWS_DEFAULT_REGION"))
parser.add_argument("--wdl-version", default=os.environ.get("WDL_VERSION", "0"))
parser.add_argument("--dag-version", default=os.environ.get("DAG_VERSION", "0"))
parser.add_argument("--dag-branch", help="Branch of idseq-dag to install at runtime (pipeline_branch/pipeline_commit)")
args = parser.parse_args()
workflow_name = args.name or os.path.basename(args.dag).replace(".json", "")

with open(args.dag) as fh:
    dag = json.load(fh)

if args.output_prefix is None:
    args.output_prefix = dag["output_dir_s3"]

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
        return target + "_" + str(index)
    else:
        return target + "_" + file_path_to_name(dag["targets"][target][index])


count_input_reads = """
    input_read_count = idseq_dag.util.count.reads_in_group(
      step_instance.input_files_local[0],
      max_fragments=max_fragments
    )
    counts_dict = dict(fastqs=input_read_count)
    if input_read_count == len(step_instance.input_files_local) * max_fragments:
      counts_dict["truncated"] = input_read_count
    with open("fastqs.count", "w") as count_file:
      json.dump(counts_dict, count_file)"""

custom_idseq_dag_url = "https://github.com/chanzuckerberg/idseq-dag/archive/{}.tar.gz".format(args.dag_branch)
pip_install_template = 'subprocess.check_call(["pip3", "install", "--upgrade", "{}"], stdout=sys.stderr.buffer)'
install_custom_idseq_dag_version = pip_install_template.format(custom_idseq_dag_url)

unaccounted_workflow_outputs = []

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
            wdl_step_input.append("    File " + input_name)
            input_files[-1].append(None)
            input_files_local[-1].append("~{" + input_name + "}")
    wdl_step_input = "\n".join(wdl_step_input)
    input_files_local = json.dumps(input_files_local)
    idd_step_output = dag["targets"][step["out"]]
    wdl_step_output = "\n".join('    File {} = "{}"'.format(file_path_to_name(name), name) for name in idd_step_output)
    wdl_step_output += '\n    File? output_read_count = "{}.count"'.format(step["out"])
    s3_wd_uri = os.path.join(args.output_prefix,
                             "idseq-{}-main-1".format(args.deployment_env),
                             "wdl-" + args.wdl_version,
                             "dag-" + args.dag_version)
    nha_cluster_ssh_key_uri = ""
    if "environment" in step["additional_attributes"]:
        nha_cluster_ssh_key_uri = "s3://idseq-secrets/idseq-{}.pem".format(step["additional_attributes"]["environment"])

    if task_name(step) == "RunValidateInput":
        wdl_step_output += '\n    File? input_read_count = "fastqs.count"'
        unaccounted_workflow_outputs.append("    File? input_read_count = RunValidateInput.input_read_count")
    elif task_name(step) == "RunStar":
        for attr_name, attr_value in step["additional_attributes"].items():
            if attr_name.startswith("output_") and attr_name.endswith("_file"):
                wdl_step_output += '\n    File? {} = "{}"'.format(attr_name, attr_value)
                unaccounted_workflow_outputs.append("    File? {name} = RunStar.{name}".format(name=attr_name))
    print("""
task {task_name} {{
  runtime {{
    docker: "{AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/idseq-workflows:{DEPLOYMENT_ENVIRONMENT}"
  }}
  input {{
{wdl_step_input}
  }}
  command<<<
  python3 <<CODE
  import os, sys, json, contextlib, importlib, threading, logging, subprocess, traceback
  os.environ.update(KEY_PATH_S3="{nha_cluster_ssh_key_uri}", AWS_DEFAULT_REGION="{AWS_DEFAULT_REGION}")
  {install_custom_idseq_dag_version}
  import idseq_dag, idseq_dag.util.s3, idseq_dag.util.count
  logging.basicConfig(level=logging.INFO)
  idseq_dag.util.s3.config["REF_DIR"] = os.getcwd()
  max_fragments = {max_fragments}
  step = importlib.import_module("{step_module}")
  step_instance = step.{step_class}(
    name="{step_name}",
    input_files={input_files},
    output_files={idd_step_output},
    output_dir_local=os.getcwd(),
    output_dir_s3="{s3_wd_uri}",
    ref_dir_local=idseq_dag.util.s3.config["REF_DIR"],
    additional_files={step_additional_files},
    additional_attributes={step_additional_attributes},
    step_status_local="{workflow_name}_status.json",
    step_status_lock=contextlib.suppress()
  )
  step_instance.input_files_local = {input_files_local}
  with open(step_instance.step_status_local, "w") as status_file:
    json.dump(dict(), status_file)
  try:
    {count_input_reads}
    step_instance.update_status_json_file("running")
    step_instance.run()
    step_instance.count_reads()
    step_instance.save_counts()
    step_instance.update_status_json_file("finished_running")
  except Exception as e:
    traceback.print_exc()
    exit(json.dumps(dict(wdl_error_message=True, error=type(e).__name__, cause=str(e))))
  CODE
  >>>
  output {{
{wdl_step_output}
  }}
}}""".format(task_name=task_name(step),
             AWS_ACCOUNT_ID=args.aws_account_id,
             DEPLOYMENT_ENVIRONMENT=args.deployment_env,
             wdl_step_input=wdl_step_input,
             nha_cluster_ssh_key_uri=nha_cluster_ssh_key_uri,
             AWS_DEFAULT_REGION=args.aws_region,
             install_custom_idseq_dag_version=install_custom_idseq_dag_version if args.dag_branch else "",
             max_fragments=dag["given_targets"].get("fastqs", {}).get("max_fragments"),
             step_module=step["module"],
             step_class=step["class"],
             step_name=step["out"],
             input_files=input_files,
             idd_step_output=idd_step_output,
             s3_wd_uri=s3_wd_uri,
             step_additional_files=step["additional_files"],
             step_additional_attributes=step["additional_attributes"],
             workflow_name=workflow_name,
             input_files_local=input_files_local,
             count_input_reads=count_input_reads if task_name(step) == "RunValidateInput" else "",
             wdl_step_output=wdl_step_output))

print("\nworkflow idseq_{} {{".format(workflow_name))
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
                step_inputs.append(name + " = " + name)
            else:
                name = file_path_to_name(filename)
                step_inputs.append("{name} = {task_name}.{name}".format(name=name,
                                                                        task_name=task_name(targets_to_steps[target])))
    step_inputs = ",\n      ".join(step_inputs)
    if step_inputs:
        print("""
  call {task_name} {{
    input:
      {step_inputs}
  }}""".format(task_name=task_name(step), step_inputs=step_inputs))
    else:
        print("  call " + task_name(step))
print("\n  output {")
for target, files in dag["targets"].items():
    if target in dag["given_targets"]:
        continue
    for i, filename in enumerate(files):
        name = file_path_to_name(filename)
        print("    File {} = {}.{}".format(target_filename(target, i), task_name(targets_to_steps[target]), name))
    print("    File? {}_count = {}.output_read_count".format(target, task_name(targets_to_steps[target])))
for output in unaccounted_workflow_outputs:
    print(output)
print("  }")
print("}")
