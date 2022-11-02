// Dropdown that fetches list of updatable projects for the current user.
import { find, sortBy } from "lodash/fp";
import React from "react";
import { Project } from "~/interface/shared";
import { SubtextDropdown } from "~ui/controls/dropdowns";

interface ProjectSelectProps {
  projects: Project[];
  value: number; // the project id
  onChange: $TSFixMeFunction; // the entire project object is returned
  disabled?: boolean;
  erred?: boolean;
  showSelectedItemSubtext: boolean; // Subtext in selected state
}

const ProjectSelect = ({
  disabled,
  erred,
  showSelectedItemSubtext = true,
  projects,
  value,
  onChange,
}: ProjectSelectProps) => {
  const getOptions = () =>
    (sortBy("name", projects) || []).map(project => ({
      value: project.id,
      text: project.name,
      subtext: project.public_access ? "Public Project" : "Private Project",
    }));

  const onProjectChange = (projectId: number) => {
    onChange(find({ id: projectId }, projects));
  };
  return (
    <SubtextDropdown
      // @ts-expect-error Property 'fluid' does not exist on type
      fluid
      options={getOptions()}
      onChange={(val: number) => onProjectChange(val)}
      initialSelectedValue={value}
      placeholder="Select project"
      search
      disabled={disabled}
      erred={erred}
      showSelectedItemSubtext={showSelectedItemSubtext}
    />
  );
};

export default ProjectSelect;
