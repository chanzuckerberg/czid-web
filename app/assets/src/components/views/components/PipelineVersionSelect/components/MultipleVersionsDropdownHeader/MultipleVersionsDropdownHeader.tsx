import React from "react";
import { Popup } from "semantic-ui-react";
import BareDropdown from "~/components/ui/controls/dropdowns/BareDropdown";
import cs from "./multiple_versions_dropdown_header.scss";

interface MultipleVersionsDropdownHeaderProps {
  otherPipelineVersions: string[];
  onPipelineVersionSelect: (newPipelineVersion: string) => void;
  currentPipelineString: string;
  versionInfoString: string;
}

export const MultipleVersionsDropdownHeader = ({
  otherPipelineVersions,
  onPipelineVersionSelect,
  currentPipelineString,
  versionInfoString,
}: MultipleVersionsDropdownHeaderProps) => {
  const options = otherPipelineVersions.map(version => ({
    text: `Pipeline v${version} `,
    value: version,
  }));

  return (
    <>
      <Popup
        content={"Select pipeline version."}
        position={"top center"}
        inverted={true}
        trigger={
          <BareDropdown
            className={cs.pipelineVersionDropdown}
            trigger={
              <span className={cs.pipelineVersionDropdown}>
                {currentPipelineString}
              </span>
            }
            options={options}
            onChange={(version: string) => onPipelineVersionSelect(version)}
            smallArrow={true}
            arrowInsideTrigger={false}
            data-testid="pipeline-version-select"
          />
        }
      />
      <span className={cs.pipelineVersion}>{versionInfoString}</span>
    </>
  );
};
