#!/usr/bin/env python3

import sys
import WDL
import json


# We use this custom source reader to pass in input from stdin
async def read_stdin(uri, path, importer):
    if uri != "stdin":
        raise ValueError("This script only handles input from stdin.")
    wdl = ""
    for line in sys.stdin:
        wdl += line
    return WDL.ReadSourceResult(wdl, uri)


def main():
    # load WDL document
    doc = WDL.load("stdin", read_source=read_stdin)
    assert doc.workflow, "No workflow in WDL document"


    # collect stage inputs
    stage_inputs = set()
    for input_file in doc.workflow.inputs:
        stage_inputs.add(input_file.name)

    # collect step names and inputs
    steps = []
    files = {}
    for step in doc.workflow.body:
        # each object in doc.workflow.body, a WDL.Tree.Call object, is a step
        steps.append(step.name)
        for short_name, reference in step.inputs.items():
            reference_string = str(reference.expr.name) # some references evaluate to a Token
            expression_components = reference_string.split('.')
            output_var = None
            output_from = None

            if len(expression_components) > 1: # The file comes from another step in this stage
                output_from = expression_components[0]
                output_var = expression_components[1]
            elif reference_string in stage_inputs: # The file comes from a previous stage
                output_from = 'StageInput'
                output_var = reference_string
            else:
                output_from = 'External'
                output_var = reference_string

            # add to files list
            key = '.'.join([output_from, output_var])
            if key in files:
                files[key]['input_to'].extend([step.name])
            else:
                files[key] = {
                    'output_from': output_from,
                    'input_to': [step.name],
                    'var_name': output_var
                }

    # collect filenames
    for task in doc.tasks:
        output_name_mapping = [(output.name, output.expr.parts[1]) for output in task.outputs if type(output.type) == WDL.Type.File]
        for var_name, filename in output_name_mapping:
            key = '.'.join([task.name, var_name])
            if key in files:
                files[key]['filename'] = filename
            else:
                files[key] = {
                    'output_from': task.name,
                    'var_name': var_name,
                    'filename': filename
                }

    # collect stage output aliases
    outputs = {}
    for output_file in doc.workflow.outputs:
        outputs[output_file.name] = output_file.expr.expr.name

    parsed = { 'steps': steps, 'files': files, 'outputs': outputs }
    # Return to stdout
    print(json.dumps(parsed))


if __name__ == "__main__":
    main()