#!/usr/bin/env python3

# This script parses WDL files, takes information on inputs and outputs useful for
# pipeline visualization, and outputs this information in JSON format.
#
# To use, just pass the full text of a WDL file through stdin - e.g. using Open3
# for Ruby.
#
# The JSON output is as follows:
# {
#   'inputs': [], array of strings, external input variables for the WDL workflow
#   'task_names': [], array of strings, names of each task called by the WDL workflow
#   'task_inputs': { 'task_name': ['input_names'] }, a dict where each key is a task name
#            and each value is an array of input variables for that task
#   'basenames': { 'task_output_name': 'filename' }, a dict where each key is the name of a task output
#            and each value is the name of the file as found on disk/s3
#   'outputs': { 'output_name' : 'internal.name' }, a dict where each key is the name
#            of an output variable and the value is the name of the variable internally
#            in the workflow
# }
#
# Variables that are files output by a task in the workflow are named according to the scheme
# 'TaskName.variable_name'. Workflow inputs and outputs do not have a dot in the name, they are
# simply 'words_separated_by_underscores'. For consistency and to be explicit about where
# they come from, this script prefixes those inputs as well: 'WorkflowInput.variable_name'. This is
# useful to signal to the Rails backend that this input may come from a task defined in a
# previous WDL workflow in the run.

import sys
import WDL
import json

# function names we can parse for Apply expressions
SELECT_ALL = "select_all"
DEFINED = "defined"
GLOB = "glob"


class NoWorkflowError(Exception):
    def __init__(self, msg):
        super(NoWorkflowError, self).__init__(msg)
        self.msg = msg


# We use this custom source reader to pass in input from stdin
# Expects the entire text of the WDL file in stdin
# 'path' and 'importer' are required args for a function
# passed in as the 'read_source' argument when calling WDL.load(),
# but we don't need them for our use case.
async def read_stdin(uri, _path, _importer):
    wdl = sys.stdin.read()
    return WDL.ReadSourceResult(wdl, uri)


def insert_declarations(task_inputs, decls):
    """ Replace the reference to a variable declared in the workflow (e.g. gsnap_filter_input)
    with all the possible inputs. """
    for decl, inputs in decls.items():
        for task in task_inputs.keys():
            if f"WorkflowInput.{decl}" in task_inputs[task]:
                task_inputs[task].remove(f"WorkflowInput.{decl}")
                task_inputs[task].extend(inputs)
    return task_inputs


def get_workflow_input_information(inputs):
    input_info = {}
    for workflow_input in inputs:
        input_name = workflow_input.name
        input_type = str(workflow_input.type).rstrip("?")  # Some inputs are optional, but we don't care
        input_info[input_name] = input_type
    return input_info


def get_task_information(workflow):
    task_inputs = {}
    task_names = []
    declarations = {}
    for task in workflow:
        # each object in doc.workflow.body is a task
        task_information = parse_workflow_task(task)
        for info in task_information:
            if info["type"] == WDL.Tree.Decl:
                declarations[info["name"]] = info["inputs"]
            else:
                task_inputs[info["name"]] = info["inputs"]
                task_names.append(info["name"])
    return task_inputs, task_names, declarations


def parse_workflow_task(task):
    if isinstance(task, WDL.Tree.Call):
        return read_call_task(task)
    elif isinstance(task, WDL.Tree.Conditional):
        return read_conditional_task(task)
    elif isinstance(task, WDL.Tree.Decl):
        return read_declaration_task(task)


def read_call_task(call):
    task = {}
    task["name"] = call.name
    task["inputs"] = []
    task["type"] = type(call)
    for short_name, reference in call.inputs.items():
        reference_strings = parse_input_item(reference)
        for reference_string in reference_strings:
            expression_components = reference_string.split(".")
            output_var = None
            output_from = None

            if len(expression_components) > 1:  # The file comes from another task in this stage
                output_from = expression_components[0]
                output_var = expression_components[1]
            else:
                output_from = "WorkflowInput"
                output_var = reference_string

            # add to files list
            key = ".".join([output_from, output_var])
            task["inputs"].append(key)
    return [task]


def read_conditional_task(conditional):
    tasks = []
    for item in conditional.body:
        tasks.extend(parse_workflow_task(item))
    return tasks


def read_declaration_task(declaration):
    decl = {}
    decl["name"] = declaration.name
    decl["inputs"] = []
    decl["type"] = type(declaration)
    expression = declaration.expr
    if type(expression) == WDL.Expr.IfThenElse:
        decl["inputs"].extend(parse_input_item(expression.consequent))
        decl["inputs"].extend(parse_input_item(expression.alternative))
    return [decl]


def parse_input_item(reference):
    if isinstance(reference, WDL.Expr.Get):
        return parse_get_expression(reference)
    elif isinstance(reference, WDL.Expr.Apply):
        return parse_apply_expression(reference)


def parse_get_expression(get_exp):
    expression = get_exp.expr
    if isinstance(expression, WDL.Expr.Ident):
        return [str(expression.name)]


def parse_apply_expression(apply_exp):
    function_name = str(apply_exp.function_name)
    if function_name == SELECT_ALL:
        items = []
        array = apply_exp.arguments[0]
        for item in array.children:
            items.extend(parse_input_item(item))
        return items
    elif function_name == DEFINED:
        return []


def get_file_basenames(task_inputs):
    # collect filenames
    basenames = {}
    for task in task_inputs:
        # add parsing for globs
        output_name_mapping = [
            (output.name, output.expr.parts[1]) for output in task.outputs if isinstance(output.type, WDL.Type.File)
        ]
        output_name_mapping.extend(
            [
                (output.name, output.expr.arguments[0].parts[1])
                for output in task.outputs
                if isinstance(output.type, WDL.Type.Array) and output.expr.function_name == GLOB
            ]
        )
        for var_name, filename in output_name_mapping:
            key = ".".join([task.name, var_name])
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


def main():
    # load WDL document
    doc = WDL.load("stdin", read_source=read_stdin)
    if not doc.workflow:
        raise NoWorkflowError("No valid WDL workflow found.")
    # collect stage inputs
    workflow_inputs = get_workflow_input_information(doc.workflow.inputs)
    # collect task names and inputs
    task_inputs, task_names, declarations = get_task_information(doc.workflow.body)
    # insert declarations into task inputs
    task_inputs = insert_declarations(task_inputs, declarations)
    file_basenames = get_file_basenames(doc.tasks)
    outputs = get_output_aliases(doc.workflow.outputs)
    parsed = {
        "inputs": workflow_inputs,
        "task_names": task_names,
        "task_inputs": task_inputs,
        "basenames": file_basenames,
        "outputs": outputs,
    }
    # Return to stdout
    print(json.dumps(parsed))


if __name__ == "__main__":
    main()
