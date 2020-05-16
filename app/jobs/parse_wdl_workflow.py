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

    # collect step inputs and outputs
    steps = []
    files = {}
    for task in doc.tasks:
        steps.append(task.name)
        # collect inputs - they don't have filenames
        input_names = [task_input.name for task_input in task.inputs if type(task_input.type) == WDL.Type.File]
        for input_name in input_names:
            if input_name in files:
                current_inputs = files[input_name]['input_to']
                current_inputs.append(task.name)
                files[input_name]['input_to'] = current_inputs
            else:
                files[input_name] = {
                    'input_to': [task.name]
                }
        # collect outputs
        output_name_mapping = [(output.name, output.expr.parts) for output in task.outputs if type(output.type) == WDL.Type.File]
        for output_name, filename_parts in output_name_mapping:
            if output_name in files:
                files[output_name]['file'] = filename_parts[1] # WDL separates the string into quote chars and the actual path
                files[output_name]['output_from'] = task.name
            else:
                files[output_name] = {
                    'file': filename_parts[1],
                    'output_from': task.name,
                    'input_to': []
                }

    # translate internal variable names to output names
    outputs = {}
    for output in doc.workflow.outputs:
        internal_location = output.expr.expr.name
        internal_name = internal_location.split('.')[1]
        outputs[output.name] = internal_name

    parsed = { 'steps': steps, 'files': files, 'outputs': outputs }

    # Return to stdout
    print(json.dumps(parsed))


if __name__ == "__main__":
    main()