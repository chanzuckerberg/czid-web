import React, { useState } from "react";
import { setWorkflowVersion } from "~/api/index";
import { AppConfigType } from "../../AdminSettings";
import cs from "../../admin_settings.scss";

interface WorkflowVersionsProps {
  workflowVersions: AppConfigType[];
}

export const WorkflowVersions = ({
  workflowVersions,
}: WorkflowVersionsProps) => {
  const [requestResult, setRequestResult] = useState<string>("");
  const handleSetWorkflows = async (event: React.SyntheticEvent) => {
    event.preventDefault(); // prevents redirect behaviour
    const workflow = event.target[0].value;
    const version = event.target[1].value;
    const { status } = await setWorkflowVersion(workflow, version);
    setRequestResult(status);
  };

  return (
    <div className={cs.adminActionContainer}>
      <h2 className={cs.title}>Set Workflow Versions</h2>
      {workflowVersions.map((workflow: AppConfigType) => (
        <form key={workflow["key"]} onSubmit={handleSetWorkflows}>
          <textarea
            className={cs.textarea}
            cols={30}
            rows={1}
            value={workflow["key"]}
            readOnly={true}
          />
          <textarea
            className={cs.textarea}
            cols={20}
            rows={1}
            defaultValue={workflow["value"]}
          />
          <input
            className={cs.submit}
            name="commit"
            type="submit"
            value={"Update " + workflow["key"].replace("-version", "")}
          />
        </form>
      ))}
      <span>{requestResult}</span>
    </div>
  );
};
