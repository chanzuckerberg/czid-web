import React from "react";
import cs from "./admin_project.scss";

interface AdminSampleProps {
  projectId: string;
}

export const AdminProject = ({ projectId }: AdminSampleProps) => {
  return (
    <div
      className={cs.wrapper}
    >{`Placeholder page for sample ${projectId}`}</div>
  );
};
