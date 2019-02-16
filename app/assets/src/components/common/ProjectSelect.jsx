// Dropdown that fetches list of updatable projects for the current user.
import React from "react";
import { find, sortBy } from "lodash/fp";
import { Dropdown } from "~ui/controls/dropdowns";
import PropTypes from "~/components/utils/propTypes";

class ProjectSelect extends React.Component {
  getOptions = () =>
    (sortBy("name", this.props.projects) || []).map(project => ({
      value: project.id,
      text: project.name
    }));

  onChange = projectId => {
    this.props.onChange(find({ id: projectId }, this.props.projects));
  };

  render() {
    return (
      <Dropdown
        fluid
        options={this.getOptions()}
        onChange={val => this.onChange(val)}
        value={this.props.value}
        placeholder="Select project"
        search
        disabled={this.props.disabled}
      />
    );
  }
}

ProjectSelect.propTypes = {
  projects: PropTypes.arrayOf(PropTypes.Project),
  value: PropTypes.number, // the project id
  onChange: PropTypes.func.isRequired, // the entire project object is returned
  disabled: PropTypes.bool
};

export default ProjectSelect;
