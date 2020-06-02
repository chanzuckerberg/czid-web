#!/usr/bin/env python3

## This script parses WDL files, takes information on inputs and outputs useful for
## pipeline visualization, and outputs this information in JSON format.
##
## To use, just pass the full text of a WDL file through stdin - e.g. using Open3
## for Ruby.
##
## The JSON output is as follows:
## {
##   'inputs': [], array of strings, external input variables for the WDL workflow
##   'step_names': [], array of strings, names of each task called by the WDL workflow
##   'steps': { 'step_name': ['input_names'] }, a dict where each key is a step name
##            and each value is an array of input variables for that step
##   'basenames': { 'output_name': 'filename' }, a dict where each key is the name of a step output
##            and each value is the name of the file as found on disk/s3
##   'outputs': { 'stage_output_name' : 'internal.name' }, a dict where each key is the name
##            of a stage output variable and the value is the name of the variable internally
##            in the workflow
## }
##
## Variables that are files output by a step in the workflow are named according to the scheme
## 'StepName.variable_name'. Stage inputs and outputs do not have a dot in the name, they are
## simply 'words_separated_by_underscores'. For consistency and to be explicit about where
## they come from, stage inputs are prefixed as well: 'StageInput.variable_name'. This is
## useful to signal to the Rails backend that this input may come from a step defined in a 
## previous WDL workflow in the run.

import sys
import WDL
import json

# function names we can parse for Apply expressions
SELECT_ALL = 'select_all'
GLOB = 'glob'

# We use this custom source reader to pass in input from stdin
# Expects the entire text of the WDL file in stdin
# 'path' and 'importer' are required args for a function
# passed in as the 'read_source' argument when calling WDL.load(),
# but we don't need them for our use case.
async def read_stdin(uri, _path, _importer):
  if uri != "stdin":
    raise ValueError("This script only handles input from stdin.")
  wdl = ""
  for line in sys.stdin:
    wdl += line

  return WDL.ReadSourceResult(wdl, uri)


def main():
  # load WDL document
  doc = WDL.load("stdin", read_source=read_stdin)
  if not doc.workflow:
    raise NoWorkflowError("No valid WDL workflow found.")

  # collect stage inputs
  stage_inputs = get_stage_input_information(doc.workflow.inputs)

  # collect step names and inputs
  steps, step_names, declarations = get_step_information(doc.workflow.body)

  # insert declarations into step inputs
  steps = insert_declarations(steps, declarations)

  file_basenames = get_file_basenames(doc.tasks)

  outputs = get_output_aliases(doc.workflow.outputs)

  parsed = { 'inputs': stage_inputs, 'step_names': step_names, 'steps': steps, 'basenames': file_basenames, 'outputs': outputs }
  # Return to stdout
  print(json.dumps(parsed))

def insert_declarations(steps, decls):
  for decl, inputs in decls.items():
    for step in steps.keys():
      if f"StageInput.{decl}" in steps[step]:
        steps[step].remove(f"StageInput.{decl}")
        steps[step].extend(inputs)
  return steps

def get_stage_input_information(inputs):
  input_info = {}
  for stage_input in inputs:
    input_name = stage_input.name
    input_type = str(stage_input.type).rstrip('?') # Some inputs are optional, but we don't care
    input_info[input_name] = input_type
  return input_info

def get_step_information(workflow):
  steps = {}
  step_names = []
  declarations = {}
  for task in workflow:
    # each object in doc.workflow.body is a step
    step_information = parse_workflow_step(task)
    for info in step_information:
      if info['type'] == WDL.Tree.Decl:
        declarations[info['name']] = info['inputs']
      else:
        steps[info['name']] = info['inputs']
        step_names.append(info['name'])
  return steps, step_names, declarations

def parse_workflow_step(step):
  if type(step) == WDL.Tree.Call:
    return read_call_task(step)
  if type(step) == WDL.Tree.Conditional:
    return read_conditional_task(step)
  if type(step) == WDL.Tree.Decl:
    return read_declaration_task(step)

def read_call_task(call):
  step = {}
  step['name'] = call.name
  step['inputs'] = []
  step['type'] = type(call)
  for short_name, reference in call.inputs.items():
    reference_strings = parse_input_item(reference)
    for reference_string in reference_strings:
      expression_components = reference_string.split('.')
      output_var = None
      output_from = None

      if len(expression_components) > 1: # The file comes from another step in this stage
        output_from = expression_components[0]
        output_var = expression_components[1]
      else:
        output_from = 'StageInput'
        output_var = reference_string

      # add to files list
      key = '.'.join([output_from, output_var])
      step['inputs'].append(key)
  return [step]
      

def read_conditional_task(conditional):
  tasks = []
  for item in conditional.body:
    tasks.extend(parse_workflow_step(item))
  return tasks

def read_declaration_task(declaration):
  decl = {}
  decl['name'] = declaration.name
  decl['inputs'] = []
  decl['type'] = type(declaration)
  expression = declaration.expr
  if type(expression) == WDL.Expr.IfThenElse:
    decl['inputs'].extend(parse_input_item(expression.consequent))
    decl['inputs'].extend(parse_input_item(expression.alternative))
  return [decl]

def parse_input_item(reference):
  if type(reference) == WDL.Expr.Get:
    return parse_get_expression(reference)
  elif type(reference) == WDL.Expr.Apply:
    return parse_apply_expression(reference)

def parse_get_expression(get_exp):
  expression = get_exp.expr
  if type(expression) == WDL.Expr.Ident:
    return [str(expression.name)]

def parse_apply_expression(apply_exp):
  function_name = str(apply_exp.function_name)
  if function_name == SELECT_ALL:
    items = []
    array = apply_exp.arguments[0]
    for item in array.children:
      items.extend(parse_input_item(item))
    return items

def get_file_basenames(tasks):
  # collect filenames
  basenames = {}
  for task in tasks:
    # add parsing for globs
    output_name_mapping = [(output.name, output.expr.parts[1]) for output in task.outputs if type(output.type) == WDL.Type.File]
    output_name_mapping.extend([(output.name, output.expr.arguments[0].parts[1]) for output in task.outputs if type(output.type) == WDL.Type.Array and output.expr.function_name == GLOB])
    for var_name, filename in output_name_mapping:
      key = '.'.join([task.name, var_name])
      basenames[key] = filename
  return basenames

def get_output_aliases(outputs):
  # collect stage output aliases
  aliases = {}
  for output in outputs:
    # add parsing for arrays
    if type(output.type) in [WDL.Type.File, WDL.Type.Array]:
      alias = output.expr.expr.name
      aliases[output.name] = alias
  return aliases

class NoWorkflowError(Exception):
  """docstring for NoWorkflowError"""
  def __init__(self, msg):
    super(NoWorkflowError, self).__init__(msg)
    self.msg = msg
    

if __name__ == "__main__":
  main()
