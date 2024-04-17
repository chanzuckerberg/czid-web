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
          <Link to="/admin/admin_settings">/admin/admin_settings</Link>
        </li>
        <li>
          <Link to="/admin/projects/123">{`/admin/projects/{projectId}`}</Link>
        </li>
        <li>
          <Link to="/admin/samples/123">{`/admin/samples/{sampleId}`}</Link>
        </li>
      </ul>
    </div>
  );
};
