#!/usr/bin/env python3

import unittest
import sys
import io
import asyncio
import json

import WDL

from scripts import parse_wdl_workflow

## Helpers
## Credit to metatoaster
## https://gist.github.com/metatoaster/64139971b53ad728dba636e34b8a5558


def stub_stdin(testcase_inst, inputs):
  stdin = sys.stdin

  def cleanup():
      sys.stdin = stdin

  testcase_inst.addCleanup(cleanup)
  sys.stdin = StringIO(inputs)


class StringIO(io.StringIO):
  """
  A "safely" wrapped version
  """
  def __init__(self, value=''):
      value = value.encode('utf8', 'backslashreplace').decode('utf8')
      io.StringIO.__init__(self, value)

  def write(self, msg):
      io.StringIO.write(self, msg.encode(
          'utf8', 'backslashreplace').decode('utf8'))


def stub_stdouts(testcase_inst):
    stderr = sys.stderr
    stdout = sys.stdout

    def cleanup():
        sys.stderr = stderr
        sys.stdout = stdout

    testcase_inst.addCleanup(cleanup)
    sys.stderr = StringIO()
    sys.stdout = StringIO()


## Test cases


class TestReadAndParseInput(unittest.TestCase):


  def test_read_stdin_result_type(self):
    stub_stdin(self, test_wdl)
    loop = asyncio.get_event_loop()
    result = loop.run_until_complete(parse_wdl_workflow.read_stdin('stdin', '', ''))
    self.assertIsInstance(result, WDL.ReadSourceResult)
    self.assertEqual(result.source_text, test_wdl)
    self.assertEqual(result.abspath, 'stdin')


  def test_read_stdin_result_parsing(self):
    stub_stdin(self, test_wdl)
    doc = WDL.load("stdin", read_source=parse_wdl_workflow.read_stdin)
    assert doc.workflow
    self.assertEqual(len(doc.tasks), 3)
    self.assertEqual(len(doc.workflow.inputs), 4)
    self.assertEqual(len(doc.workflow.body), 4)
    self.assertIsInstance(doc.workflow.body[0], WDL.Tree.Call)
    self.assertIsInstance(doc.workflow.body[1], WDL.Tree.Conditional)
    self.assertIsInstance(doc.workflow.body[2], WDL.Tree.Decl)


class TestJSONOutput(unittest.TestCase):


  def setUp(self):
    stub_stdin(self, test_wdl)
    stub_stdouts(self)
    parse_wdl_workflow.main()
    output = sys.stdout.getvalue()
    self.json = json.loads(output)
    self.step_names = frozenset(["RunValidateInput", "RunBowtie2_bowtie2_human_out", "RunGsnapFilter"])
    self.stage_inputs = ["docker_image_id", "fastqs_0", "fastqs_1", "host_genome"]
  

  def test_stage_inputs(self):
    input_types = ["String", "File", "File", "String"]
    json_inputs = self.json["inputs"]
    self.assertEqual(len(json_inputs), 4)
    for var, var_type in zip(self.stage_inputs, input_types):
      self.assertIn(var, json_inputs)
      json_type = json_inputs[var]
      self.assertEqual(var_type, json_type)


  def test_step_names(self):
    for step in self.json["step_names"]:
      self.assertIn(step, self.step_names)


  def test_step_info(self):
    # Make sure inputs not from previous steps have the StageInput prefix
    step_info = self.json["steps"]
    run_validate_inputs = step_info["RunValidateInput"]
    for prefixed_var in run_validate_inputs:
      self.assertIn(".", prefixed_var)
      prefix, var = prefixed_var.split(".")
      self.assertEqual(prefix, "StageInput")
      self.assertIn(var, self.stage_inputs)
    # Test the rest of the inputs - either they're in the stage input,
    # or one of the outputs
    valid_prefixes = set(["StageInput"]).union(self.step_names)
    valid_outputs = self.json["outputs"].values()
    for step_name, step_inputs in step_info.items():
      self.assertIn(step_name, self.step_names)
      for prefixed_var in step_inputs:
        self.assertIn(".", prefixed_var)
        prefix, var = prefixed_var.split(".")
        self.assertIn(prefix, valid_prefixes)
        if prefix == "StageInput":
          self.assertIn(var, self.stage_inputs)
        else:
          self.assertIn(prefixed_var, valid_outputs)


  def test_file_basenames_and_outputs(self):
    basenames = self.json["basenames"]
    valid_outputs = self.json["outputs"].values()
    self.assertEqual(len(basenames), len(valid_outputs))
    for key, value in basenames.items():
      self.assertIn(key, valid_outputs)
      self.assertIn(".", key)
      self.assertIn(".", value)
      step = key.split(".")[0]
      self.assertNotIn(step, value)

 
## Test document

test_wdl = '''
version 1.0

task RunValidateInput {
  input {
    String docker_image_id
    Array[File] fastqs
    String host_genome
  }
  command<<<
  idseq-dag-run-step --workflow-name host_filter \
    --step-module idseq_dag.steps.run_validate_input \
    --step-class PipelineStepRunValidateInput \
  >>>
  output {
    File validate_input_summary_json = "validate_input_summary.json"
    File valid_input1_fastq = "valid_input1.fastq"
    File? valid_input2_fastq = "valid_input2.fastq"
    File? output_read_count = "validate_input_out.count"
    File? input_read_count = "fastqs.count"
  }
  runtime {
    docker: docker_image_id
  }
}

task RunBowtie2_bowtie2_human_out {
  input {
    String docker_image_id
    Array[File] unmapped_human_fa
  }
  command<<<
  idseq-dag-run-step --workflow-name host_filter \
    --step-module idseq_dag.steps.run_bowtie2 \
    --step-class PipelineStepRunBowtie2 \
  >>>
  output {
    File bowtie2_human_1_fa = "bowtie2_human_1.fa"
    File? bowtie2_human_2_fa = "bowtie2_human_2.fa"
    File? bowtie2_human_merged_fa = "bowtie2_human_merged.fa"
    File? output_read_count = "bowtie2_human_out.count"
  }
  runtime {
    docker: docker_image_id
  }
}

task RunGsnapFilter {
  input {
    String docker_image_id
    Array[File] subsampled_fa
  }
  command<<<
  idseq-dag-run-step --workflow-name host_filter \
    --step-module idseq_dag.steps.run_gsnap_filter \
    --step-class PipelineStepRunGsnapFilter \
  >>>
  output {
    File gsnap_filter_1_fa = "gsnap_filter_1.fa"
    File? gsnap_filter_2_fa = "gsnap_filter_2.fa"
    File? gsnap_filter_merged_fa = "gsnap_filter_merged.fa"
    File? output_read_count = "gsnap_filter_out.count"
  }
  runtime {
    docker: docker_image_id
  }
}

workflow idseq_host_filter {
  input {
    String docker_image_id
    File fastqs_0
    File? fastqs_1
    String host_genome
  }

  call RunValidateInput {
    input:
      docker_image_id = docker_image_id,
      fastqs = select_all([fastqs_0, fastqs_1]),
      host_genome = host_genome,
  }

  if (host_genome != "human") {
    call RunBowtie2_bowtie2_human_out {
      input:
        docker_image_id = docker_image_id,
        unmapped_human_fa = select_all([RunValidateInput.valid_input1_fastq, RunValidateInput.valid_input2_fastq]),
    }
  }

  Array[File] gsnap_filter_input = if (host_genome == "human")
    then select_all([RunValidateInput.valid_input1_fastq, RunValidateInput.valid_input2_fastq])
    else select_all([RunBowtie2_bowtie2_human_out.bowtie2_human_1_fa, RunBowtie2_bowtie2_human_out.bowtie2_human_2_fa, RunBowtie2_bowtie2_human_out.bowtie2_human_merged_fa])

  call RunGsnapFilter {
    input:
      docker_image_id = docker_image_id,
      subsampled_fa = gsnap_filter_input,
  }

  output {
    File validate_input_out_validate_input_summary_json = RunValidateInput.validate_input_summary_json
    File validate_input_out_valid_input1_fastq = RunValidateInput.valid_input1_fastq
    File? validate_input_out_valid_input2_fastq = RunValidateInput.valid_input2_fastq
    File? validate_input_out_count = RunValidateInput.output_read_count
    File? bowtie2_human_out_bowtie2_human_1_fa = RunBowtie2_bowtie2_human_out.bowtie2_human_1_fa
    File? bowtie2_human_out_bowtie2_human_2_fa = RunBowtie2_bowtie2_human_out.bowtie2_human_2_fa
    File? bowtie2_human_out_bowtie2_human_merged_fa = RunBowtie2_bowtie2_human_out.bowtie2_human_merged_fa
    File? bowtie2_human_out_count = RunBowtie2_bowtie2_human_out.output_read_count
    File gsnap_filter_out_gsnap_filter_1_fa = RunGsnapFilter.gsnap_filter_1_fa
    File? gsnap_filter_out_gsnap_filter_2_fa = RunGsnapFilter.gsnap_filter_2_fa
    File? gsnap_filter_out_gsnap_filter_merged_fa = RunGsnapFilter.gsnap_filter_merged_fa
    File? gsnap_filter_out_count = RunGsnapFilter.output_read_count
    File? input_read_count = RunValidateInput.input_read_count
  }
}
'''
