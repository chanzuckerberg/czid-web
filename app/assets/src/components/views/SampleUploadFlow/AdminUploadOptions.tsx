import { set } from "lodash/fp";
import React, { useState } from "react";
import HelpIcon from "~ui/containers/HelpIcon";
import Input from "~ui/controls/Input";
import cs from "./admin_upload_options.scss";

const ADMIN_OPTIONS = {
  max_input_fragments: {
    helpText:
      "The maximum number of fragments permitted in an input file from S3. Additional fragments will be truncated.",
    placeholder: 75000000,
  },
  subsample: {
    helpText:
      "The number of fragments to randomly subsample to after host filtering.",
    placeholder: 1000000,
  },
  pipeline_branch: {
    helpText: "The pipeline_version to run the samples on.",
    placeholder: "6.9.1",
  },
  alignment_config_name: {
    helpText: "The name of the alignment config to use for these samples.",
    placeholder: "2019-01-01",
  },
  s3_preload_result_path: {
    helpText:
      "The contents of this s3 folder will be copied to the sample result folder prior to pipeline start.",
    placeholder: "s3://yunfang-workdir/id-rr004/RR004_water_2_S23/",
  },
  alignment_scalability: {
    helpText: "Use the new alignment scalability flow (true|false)",
    placeholder: "false",
  },
};

interface AdminUploadOptionsProps {
  adminOptions: Record<string, string>;
  onAdminOptionsChanged: $TSFixMeFunction;
}

const AdminUploadOptions = ({
  adminOptions,
  onAdminOptionsChanged,
}: AdminUploadOptionsProps) => {
  const [showOptions, setShowOptions] = useState(false);

  const handleChange = (key: string, newValue: $TSFixMe) => {
    onAdminOptionsChanged(set(key, newValue, adminOptions));
  };

  const renderAdminOption = (key: string) => {
    const optionMetadata = ADMIN_OPTIONS[key];

    return (
      <div className={cs.field} key={key}>
        <div className={cs.label}>
          {key}
          <HelpIcon text={optionMetadata.helpText} className={cs.helpIcon} />
        </div>
        <Input
          className={cs.input}
          onChange={(val: $TSFixMe) => handleChange(key, val)}
          value={adminOptions[key] || ""}
          placeholder={optionMetadata.placeholder}
        />
      </div>
    );
  };

  return (
    <div>
      <div className={cs.subheader}>
        Admin options
        <span
          className={cs.toggleLink}
          onClick={() => setShowOptions(!showOptions)}>
          {showOptions ? "Hide" : "Show"} options
        </span>
      </div>
      {showOptions && (
        <div className={cs.adminUploadOptions}>
          {Object.keys(ADMIN_OPTIONS).map(option => renderAdminOption(option))}
        </div>
      )}
    </div>
  );
};

export default AdminUploadOptions;
