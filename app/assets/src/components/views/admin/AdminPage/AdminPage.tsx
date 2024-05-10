import React from "react";
import { Link } from "react-router-dom";
import cs from "./admin_page.scss";

export const AdminPage = () => {
  return (
    <div className={cs.wrapper}>
      <h1>Admin Index</h1>
      <h2>Available pages</h2>
      <ul>
        <li>
          <Link to="/admin/settings">/admin/settings</Link>
        </li>
        <li>
          {/* This is not a react-router link because it's still rendered by rails */}
          <a href="/projects">/projects</a>
        </li>
        <li>
          <Link to="/admin/projects/123">{`/admin/projects/{projectId}`}</Link>
        </li>
        <li>
          {/* This is not a react-router link because it's still rendered by rails */}
          <a href="/samples/28139/pipeline_runs">{`/samples/{sampleId}/pipeline_runs`}</a>
        </li>
        <li>
          <a href="/samples/520461/pipeline_logs">{`/samples/{sampleId}/pipeline_logs`}</a>
        </li>
        <li>
          <a href="/samples/32261/raw_results_folder">{`/samples/{sampleId}/raw_results_folder`}</a>
        </li>
        <li>
          <Link to="/admin/samples/123">{`/admin/samples/{sampleId}`}</Link>
        </li>
        <li>
          {/* This is not a react-router link because it's still rendered by rails */}
          <a href="/backgrounds">{`/backgrounds`}</a>
        </li>
        <li>
          {/* This is not a react-router link because it's still rendered by rails */}
          <a href="/host_genomes">{`/host_genomes`}</a>
        </li>
      </ul>
    </div>
  );
};
