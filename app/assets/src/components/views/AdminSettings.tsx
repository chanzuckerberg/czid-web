import React, { useState } from "react";
import { setWorkflowVersion } from "~/api/index";
import cs from "./admin_settings.scss";

interface AdminSettingsProps {
    workflows: Array<WorkflowType>
}

interface WorkflowType {
    id: string,
    key: string,
    value: string,
}

const AdminSettingsView = ({
    workflows,
    }: AdminSettingsProps) => {
    const [requestResult, setRequestResult] = useState("");
    const handleSetWorkflows = async (event: React.SyntheticEvent) => {
        event.preventDefault(); // prevents redirect behaviour
        const workflow = event.target[0].value;
        const version = event.target[1].value;
        const { status } = await setWorkflowVersion(workflow, version);
        setRequestResult(status);
    };

    return (
        <div className={cs.page}>
            <h1>Admin Settings</h1>
            <div className={cs.workflow_versions}>
                <h3>Set Workflow Versions </h3>
                    {workflows.map((workflow: WorkflowType) => (
                        <form key={workflow["key"]} onSubmit={handleSetWorkflows}>
                            <textarea className={cs.textarea} cols={30} rows={1} value={workflow["key"]} readOnly={true} />
                            <textarea className={cs.textarea} cols={20} rows={1} defaultValue={workflow["value"]} />
                            <input className={cs.submit} name="commit" type="submit" value={"Update " + workflow["key"].replace("-version", "")} />
                        </form>
                    ))}
                <span>{requestResult}</span>
            </div>
        </div>
    );
};

export default AdminSettingsView;

