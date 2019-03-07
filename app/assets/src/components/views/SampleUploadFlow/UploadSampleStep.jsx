// TODO(mark): Verify that sample name is not duplicate for local uploads at this step.
import React from "react";
import PropTypes from "~/components/utils/propTypes";
import ProjectSelect from "~/components/common/ProjectSelect";
import Tabs from "~/components/ui/controls/Tabs";
import { getProjects, validateSampleNames } from "~/api";
import {
  reject,
  size,
  flow,
  mapValues,
  keyBy,
  get,
  concat,
  map
} from "lodash/fp";
import BulkSampleUploadTable from "~ui/controls/BulkSampleUploadTable";
import ProjectCreationForm from "~/components/common/ProjectCreationForm";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import SecondaryButton from "~/components/ui/controls/buttons/SecondaryButton";
import LocalSampleFileUpload from "./LocalSampleFileUpload";
import RemoteSampleFileUpload from "./RemoteSampleFileUpload";
import cs from "./sample_upload_flow.scss";

const LOCAL_UPLOAD_TAB = "Upload from Your Computer";
const REMOTE_UPLOAD_TAB = "Upload from S3";

class UploadSampleStep extends React.Component {
  state = {
    selectedProject: null,
    createProjectOpen: false,
    projects: [],
    currentTab: LOCAL_UPLOAD_TAB,
    localSamples: [],
    remoteSamples: []
  };

  async componentDidMount() {
    const projects = await getProjects({
      domain: "updatable"
    });

    this.setState({
      projects
    });
  }

  getCurrentSamples = () => {
    if (this.state.currentTab === LOCAL_UPLOAD_TAB) {
      return this.state.localSamples;
    }
    if (this.state.currentTab === REMOTE_UPLOAD_TAB) {
      return this.state.remoteSamples;
    }
    return [];
  };

  isValid = () =>
    this.state.selectedProject !== null && size(this.getCurrentSamples()) > 0;

  // Modify the project_id in our samples, and validate the names again.
  processSamplesForProject = async (samples, project) => {
    const validatedSamples = await this.validateSampleNames(samples, project);
    return map(
      sample => ({
        ...sample,
        project_id: get("id", project)
      }),
      validatedSamples
    );
  };

  handleProjectChange = async project => {
    const [newLocalSamples, newRemoteSamples] = await Promise.all([
      await this.processSamplesForProject(this.state.localSamples, project),
      await this.processSamplesForProject(this.state.remoteSamples, project)
    ]);

    this.setState({
      selectedProject: project,
      localSamples: newLocalSamples,
      remoteSamples: newRemoteSamples
    });
  };

  validateSampleNames = async (samples, project) => {
    const selectedProject = project || this.state.selectedProject;
    if (!selectedProject || size(samples) <= 0) {
      return Promise.resolve(samples);
    }

    const validatedSampleNames = await validateSampleNames(
      get("id", selectedProject),
      map("name", samples)
    );

    return samples.map((sample, index) => ({
      ...sample,
      name: validatedSampleNames[index]
    }));
  };

  openCreateProject = () => {
    this.setState({
      createProjectOpen: true
    });
  };

  closeCreateProject = () => {
    this.setState({
      createProjectOpen: false
    });
  };

  handleProjectCreate = project => {
    this.setState({
      projects: concat(project, this.state.projects),
      selectedProject: project,
      createProjectOpen: false
    });
  };

  handleTabChange = tab => {
    this.setState({ currentTab: tab });
  };

  handleLocalSampleChange = async localSamples => {
    const validatedLocalSamples = await this.validateSampleNames(localSamples);
    this.setState({
      localSamples: validatedLocalSamples
    });
  };

  handleRemoteSampleChange = async remoteSamples => {
    const validatedRemoteSamples = await this.validateSampleNames(
      remoteSamples
    );
    this.setState({
      remoteSamples: validatedRemoteSamples
    });
  };

  handleSampleRemoved = sampleName => {
    const newSamples = reject(["name", sampleName], this.getCurrentSamples());
    if (this.state.currentTab === LOCAL_UPLOAD_TAB) {
      this.setState({
        localSamples: newSamples
      });
    }

    if (this.state.currentTab === REMOTE_UPLOAD_TAB) {
      this.setState({
        remoteSamples: newSamples
      });
    }
  };

  handleContinue = () => {
    if (this.state.currentTab === LOCAL_UPLOAD_TAB) {
      this.props.onUploadSamples({
        samples: this.state.localSamples,
        project: this.state.selectedProject,
        uploadType: "local"
      });
    }

    if (this.state.currentTab === REMOTE_UPLOAD_TAB) {
      this.props.onUploadSamples({
        samples: this.state.remoteSamples,
        project: this.state.selectedProject,
        uploadType: "remote"
      });
    }
  };

  getSampleNamesToFiles = () => {
    return flow(
      keyBy("name"),
      mapValues(sample => sample.input_files_attributes)
    )(this.getCurrentSamples());
  };

  renderTab = () => {
    switch (this.state.currentTab) {
      case LOCAL_UPLOAD_TAB:
        return (
          <LocalSampleFileUpload
            onChange={this.handleLocalSampleChange}
            project={this.state.selectedProject}
            sampleNamesToFiles={this.state.localSamples}
          />
        );
      case REMOTE_UPLOAD_TAB:
        return (
          <RemoteSampleFileUpload
            project={this.state.selectedProject}
            onChange={this.handleRemoteSampleChange}
          />
        );
      default:
        return <div />;
    }
  };

  render() {
    return (
      <div className={cs.uploadSampleStep}>
        <div className={cs.header}>
          <div className={cs.title}>Upload Samples</div>
          <div className={cs.subtitle}>
            Rather use our command-line interface?
            <a
              href="/cli_user_instructions"
              target="_blank"
              className={cs.cliLink}
            >
              Instructions here.
            </a>
          </div>
        </div>
        <div className={cs.projectSelect}>
          <div className={cs.label}>Project</div>
          <ProjectSelect
            projects={this.state.projects}
            value={get("id", this.state.selectedProject)}
            onChange={this.handleProjectChange}
            disabled={this.state.createProjectOpen}
          />
          {this.state.createProjectOpen ? (
            <div className={cs.projectCreationContainer}>
              <ProjectCreationForm
                onCancel={this.closeCreateProject}
                onCreate={this.handleProjectCreate}
              />
            </div>
          ) : (
            <div
              className={cs.createProjectButton}
              onClick={this.openCreateProject}
            >
              + Create Project
            </div>
          )}
        </div>
        <div className={cs.fileUpload}>
          <div className={cs.title}>Upload Files</div>
          <Tabs
            className={cs.tabs}
            tabs={[LOCAL_UPLOAD_TAB, REMOTE_UPLOAD_TAB]}
            value={this.state.currentTab}
            onChange={this.handleTabChange}
          />
          {this.renderTab()}
        </div>
        <BulkSampleUploadTable
          sampleNamesToFiles={this.getSampleNamesToFiles()}
          onRemoved={this.handleSampleRemoved}
          hideProgressColumn
          showCount={this.state.currentTab === REMOTE_UPLOAD_TAB}
        />
        <div className={cs.mainControls}>
          <PrimaryButton
            text="Continue"
            onClick={this.handleContinue}
            disabled={!this.isValid()}
            rounded={false}
            className={cs.continueButton}
          />
          <a href="/home">
            <SecondaryButton text="Cancel" rounded={false} />
          </a>
        </div>
      </div>
    );
  }
}

UploadSampleStep.propTypes = {
  onUploadSamples: PropTypes.func.isRequired
};

export default UploadSampleStep;
