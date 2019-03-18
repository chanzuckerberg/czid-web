import React from "react";
import cx from "classnames";
import PropTypes from "~/components/utils/propTypes";
import ProjectSelect from "~/components/common/ProjectSelect";
import Tabs from "~/components/ui/controls/Tabs";
import IssueGroup from "~/components/common/IssueGroup";
import { getProjects, validateSampleNames, validateSampleFiles } from "~/api";
import {
  filter,
  keys,
  pickBy,
  includes,
  flatten,
  set,
  reject,
  size,
  flow,
  values,
  mapValues,
  keyBy,
  get,
  concat,
  map,
  omit,
  zipObject,
  mapKeys,
  mergeWith,
  uniqBy
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
    remoteSamples: [],
    removedLocalFiles: [], // Invalid local files that were removed.
    sampleNamesToFiles: {}, // Needed for local samples.
    validatingSamples: false // Disable the "Continue" button while validating samples.
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
    this.state.selectedProject !== null &&
    size(this.getCurrentSamples()) > 0 &&
    !this.state.validatingSamples;

  // Modify the project_id in our samples, and validate the names and sampleNamesToFiles again.
  processSamplesForProject = async ({
    samples,
    project,
    sampleNamesToFiles
  }) => {
    const {
      samples: validatedSamples,
      sampleNamesToFiles: validatedSampleNamesToFiles
    } = await this.validateSampleNames({
      samples,
      project,
      sampleNamesToFiles
    });

    return {
      samples: map(set("project_id", get("id", project)), validatedSamples),
      sampleNamesToFiles: validatedSampleNamesToFiles
    };
  };

  handleProjectChange = async project => {
    this.setState({
      validatingSamples: true
    });

    const [
      { samples: newLocalSamples, sampleNamesToFiles: newSampleNamesToFiles },
      { samples: newRemoteSamples }
    ] = await Promise.all([
      this.processSamplesForProject({
        samples: this.state.localSamples,
        project,
        sampleNamesToFiles: this.state.sampleNamesToFiles
      }),
      this.processSamplesForProject({
        samples: this.state.remoteSamples,
        project
      })
    ]);

    this.setState({
      selectedProject: project,
      validatingSamples: false,
      localSamples: newLocalSamples,
      remoteSamples: newRemoteSamples,
      sampleNamesToFiles: newSampleNamesToFiles
    });
  };

  // Validate sample names.
  // Update sample names in 'samples' and 'sampleNamesToFiles' if needed.
  validateSampleNames = async ({ samples, project, sampleNamesToFiles }) => {
    const selectedProject = project || this.state.selectedProject;
    if (!selectedProject || size(samples) <= 0) {
      return Promise.resolve({
        samples,
        sampleNamesToFiles
      });
    }

    const validatedSampleNames = await validateSampleNames(
      get("id", selectedProject),
      map("name", samples)
    );

    const validatedNameMap = zipObject(
      map("name", samples),
      validatedSampleNames
    );

    return {
      samples: samples.map(sample => ({
        ...sample,
        name: validatedNameMap[sample.name]
      })),
      sampleNamesToFiles: mapKeys(
        name => validatedNameMap[name],
        sampleNamesToFiles
      )
    };
  };

  // Validate sample names and files
  // Remove invalid files from sampleNamesToFiles and remove samples with no valid files.
  validateSampleNamesAndFiles = async ({
    samples,
    project,
    sampleNamesToFiles
  }) => {
    if (size(samples) <= 0) {
      return Promise.resolve({
        samples,
        sampleNamesToFiles,
        removedLocalFiles: []
      });
    }

    const sampleFiles = map("name", flatten(values(sampleNamesToFiles)));

    const [
      {
        samples: validatedSamples,
        sampleNamesToFiles: validatedSampleNamesToFiles
      },
      areFilesValid
    ] = await Promise.all([
      // Call validateSampleNames to update sample names.
      this.validateSampleNames({ samples, project, sampleNamesToFiles }),
      validateSampleFiles(sampleFiles)
    ]);

    const filesValidMap = zipObject(sampleFiles, areFilesValid);

    // Filter out invalid files.
    const filteredSampleNamesToFiles = mapValues(
      files => filter(file => filesValidMap[file.name], files),
      validatedSampleNamesToFiles
    );

    // Filter out samples with no valid files.
    const emptySampleNames = keys(
      pickBy(files => files.length === 0, filteredSampleNamesToFiles)
    );
    const filteredSamples = filter(
      sample => !includes(sample.name, emptySampleNames),
      validatedSamples
    );

    return {
      samples: filteredSamples,
      sampleNamesToFiles: filteredSampleNamesToFiles,
      removedLocalFiles: keys(pickBy(fileValid => !fileValid, filesValidMap))
    };
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

  handleProjectCreate = async project => {
    this.setState({
      validatingSamples: true
    });

    const [
      { samples: newLocalSamples, sampleNamesToFiles: newSampleNamesToFiles },
      { samples: newRemoteSamples }
    ] = await Promise.all([
      this.processSamplesForProject({
        samples: this.state.localSamples,
        project,
        sampleNamesToFiles: this.state.sampleNamesToFiles
      }),
      this.processSamplesForProject({
        samples: this.state.remoteSamples,
        project
      })
    ]);

    this.setState({
      validatingSamples: false,
      projects: concat(project, this.state.projects),
      selectedProject: project,
      createProjectOpen: false,
      localSamples: newLocalSamples,
      remoteSamples: newRemoteSamples,
      sampleNamesToFiles: newSampleNamesToFiles
    });
  };

  handleTabChange = tab => {
    this.setState({ currentTab: tab });
  };

  // Merge newly added samples with the list of samples already added.
  mergeSamples = (samples, newSamples) => {
    let samplesByName = keyBy("name", samples);
    let newSamplesByName = keyBy("name", newSamples);

    // If a sample with the same name already exists, just merge their input_files_attributes.
    const mergedSamples = mergeWith(
      (newSample, sample) => {
        if (sample && newSample) {
          return set(
            "input_files_attributes",
            // Ensure that the files are all unique by looking at the source field.
            uniqBy(
              "source",
              concat(
                newSample.input_files_attributes,
                sample.input_files_attributes
              )
            ),
            sample
          );
        }
      },
      newSamplesByName,
      samplesByName
    );

    return values(mergedSamples);
  };

  handleLocalSampleChange = async (localSamples, sampleNamesToFiles) => {
    this.setState({
      validatingSamples: true,
      removedLocalFiles: []
    });

    const {
      samples: validatedLocalSamples,
      sampleNamesToFiles: validatedSampleNamesToFiles,
      removedLocalFiles
    } = await this.validateSampleNamesAndFiles({
      samples: localSamples,
      sampleNamesToFiles
    });

    this.setState({
      validatingSamples: false,
      localSamples: this.mergeSamples(
        this.state.localSamples,
        validatedLocalSamples
      ),
      sampleNamesToFiles: mergeWith(
        (newFiles, files) => {
          if (newFiles && files) {
            return uniqBy("name", concat(newFiles, files));
          }
        },
        validatedSampleNamesToFiles,
        this.state.sampleNamesToFiles
      ),
      removedLocalFiles
    });
  };

  handleRemoteSampleChange = async remoteSamples => {
    this.setState({
      validatingSamples: true
    });

    const { samples: validatedRemoteSamples } = await this.validateSampleNames({
      samples: remoteSamples
    });

    this.setState({
      validatingSamples: false,
      remoteSamples: this.mergeSamples(
        this.state.remoteSamples,
        validatedRemoteSamples
      )
    });
  };

  handleSampleRemoved = sampleName => {
    const newSamples = reject(["name", sampleName], this.getCurrentSamples());
    const newSampleNamesToFiles = omit(
      sampleName,
      this.state.sampleNamesToFiles
    );
    if (this.state.currentTab === LOCAL_UPLOAD_TAB) {
      this.setState({
        localSamples: newSamples,
        sampleNamesToFiles: newSampleNamesToFiles
      });
    }

    if (this.state.currentTab === REMOTE_UPLOAD_TAB) {
      this.setState({
        remoteSamples: newSamples,
        sampleNamesToFiles: newSampleNamesToFiles
      });
    }
  };

  handleContinue = () => {
    if (this.state.currentTab === LOCAL_UPLOAD_TAB) {
      this.props.onUploadSamples({
        samples: this.state.localSamples,
        project: this.state.selectedProject,
        sampleNamesToFiles: this.state.sampleNamesToFiles,
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
            samples={this.state.localSamples}
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
      <div className={cx(cs.uploadSampleStep, cs.uploadFlowStep)}>
        <div className={cs.flexContent}>
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
          {this.state.currentTab === LOCAL_UPLOAD_TAB &&
            this.state.removedLocalFiles.length > 0 && (
              <IssueGroup
                caption={`${
                  this.state.removedLocalFiles.length
                } files were invalid. Please check the acceptable file formats under "More Info".`}
                headers={["Invalid File Names"]}
                rows={this.state.removedLocalFiles.map(file => [file])}
                type="warning"
              />
            )}
          <BulkSampleUploadTable
            sampleNamesToFiles={this.getSampleNamesToFiles()}
            onRemoved={this.handleSampleRemoved}
            hideProgressColumn
            showCount={this.state.currentTab === REMOTE_UPLOAD_TAB}
            className={cs.uploadTable}
          />
        </div>
        <div className={cs.controls}>
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
