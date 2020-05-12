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

    # collect step outputs
    step_info = {}
    for task in doc.tasks:
        step_outputs = {}
        file_outputs = filter(lambda output: type(output.type) == WDL.Type.File, task.outputs)
        name_mapping = map(lambda output: (output.name, output.expr.parts), file_outputs)
        for key, parts in name_mapping:
            step_outputs[key] = { 'filename': ''.join(part for part in parts if part not in ['"', '\'']) }
        step_info[task.name] = { 'outputs': step_outputs }

    # collect stage inputs
    stage_inputs = list(map(lambda workflow_input: workflow_input.name, doc.workflow.inputs))

    # collect step inputs
    for call in doc.workflow.body:
        step_inputs = {}
        for name, expression in call.inputs.items():
            if type(expression.expr) != WDL.Expr.Ident:
                continue
            # target will be in the form of "TaskName.input_name" if it's from a previous step
            # else will just be in the form "input_name" if it's from a previous stage
            target = expression.expr.name.split('.')
            source = target[0] if len(target) > 1 else 'PreviousStage'
            filename = ''
            if len(target) > 1:
                filename = step_info[source]['outputs'][name]['filename']
            step_inputs[name] = { 'filename': filename, 'source': source }
        step_info[call.name]['inputs'] = step_inputs

    parsed = { 'inputs': stage_inputs, 'steps': step_info }
    print(json.dumps(parsed))

if __name__ == "__main__":
    main()