import React from "react";
import cs from "./admin_sample.scss";

interface AdminSampleProps {
  sampleId: string;
}

export const AdminSample = ({ sampleId }: AdminSampleProps) => {
  return (
    <div
      className={cs.wrapper}
    >{`Placeholder page for sample ${sampleId}`}</div>
  );
};
