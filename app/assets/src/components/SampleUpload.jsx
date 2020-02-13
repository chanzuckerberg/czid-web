import React from "react";
import QueryString from "query-string";
import ReactDOM from "react-dom";
import axios from "axios";
import $ from "jquery";
import Tipsy from "react-tipsy";
import { find } from "lodash/fp";

import { sampleNameFromFileName, joinServerError } from "~utils/sample";
import { openUrlWithTimeout } from "~utils/links";
import BeeIcon from "~ui/icons/BeeIcon";
import CatIcon from "~ui/icons/CatIcon";
import PigIcon from "~ui/icons/PigIcon";
import ERCCIcon from "~ui/icons/ERCCIcon";
import HumanIcon from "~ui/icons/HumanIcon";
import Icon from "~ui/icons/Icon";
import MosquitoIcon from "~ui/icons/MosquitoIcon";
import MouseIcon from "~ui/icons/MouseIcon";
import TickIcon from "~ui/icons/TickIcon";
import WormIcon from "~ui/icons/WormIcon";
import UploadBox from "~ui/controls/UploadBox";
import { resetUrl, parseUrlParams } from "~/helpers/url";
import { Menu, MenuItem } from "~ui/controls/Menu";
import TermsAgreement from "~ui/controls/TermsAgreement";
import { createSample } from "~/api";
import { startUploadHeartbeat } from "~/api/upload";
import { withAnalytics, logAnalyticsEvent } from "~/api/analytics";

import ObjectHelper from "../helpers/ObjectHelper";

class SampleUpload extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.handleUpload = this.handleUpload.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.csrf = props.csrf;
    this.handleProjectSubmit = this.handleProjectSubmit.bind(this);
    this.clearError = this.clearError.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleProjectChange = this.handleProjectChange.bind(this);
    this.handleHostChange = this.handleHostChange.bind(this);
    this.handleBranchChange = this.handleBranchChange.bind(this);
    this.handleResultChange = this.handleResultChange.bind(this);
    this.handleAlignmentConfigNameChange = this.handleAlignmentConfigNameChange.bind(
      this
    );
    this.toggleNewProjectInput = this.toggleNewProjectInput.bind(this);
    this.projects = props.projects || [];
    // Needed to fill in this.selected.project used on the sample /edit page.
    this.project = props.projectInfo || "";
    const urlParams = parseUrlParams();
    resetUrl();

    if (urlParams.projectId) {
      this.project = find(["id", parseInt(urlParams.projectId)], this.projects);
    }

    this.hostGenomes = props.host_genomes || [];
    this.sample = props.selectedSample || "";
    this.userDetails = props.loggedin_user;
    this.updateSampleName = this.updateSampleName.bind(this);
    const selectedHostGenomeName =
      this.hostGenomes[0] && this.hostGenomes[0].name
        ? this.hostGenomes[0].name
        : "";
    const selectedHostGenomeId =
      this.hostGenomes[0] && this.hostGenomes[0].id
        ? this.hostGenomes[0].id
        : "";
    const adminGenomes = this.hostGenomes.filter(g => {
      return g.name.toLowerCase().indexOf("test") >= 0;
    });
    this.selected = {
      name: this.sample.name || "",
      hostGenome: this.sample
        ? this.sample.host_genome_name
        : selectedHostGenomeName,
      hostGenomeId: this.sample
        ? this.sample.host_genome_id
        : selectedHostGenomeId,
      project: this.project ? this.project.name : "Select a project",
      projectId: this.project ? this.project.id : null,
      resultPath: this.sample ? this.sample.s3_preload_result_path : "",
      branch: this.sample ? this.sample.pipeline_branch : "",
      dagVars: this.sample ? this.sample.dag_vars : "{}",
      subsample: this.sample ? this.sample.subsample : "",
      maxInputFragments: this.sample ? this.sample.max_input_fragments : "",
      alignmentConfigName: this.sample ? this.sample.alignment_config_name : "",
      id: this.sample.id || "",
      inputFiles:
        props.inputFiles && props.inputFiles.length ? props.inputFiles : [],
      status: this.sample.status,
    };
    this.firstInput =
      this.selected.inputFiles.length && this.selected.inputFiles[0]
        ? this.selected.inputFiles[0].source === null
          ? ""
          : this.selected.inputFiles[0].source
        : "";
    this.secondInput =
      this.selected.inputFiles.length && this.selected.inputFiles[1]
        ? this.selected.inputFiles[1].source === null
          ? ""
          : this.selected.inputFiles[1].source
        : "";
    this.toggleCheckBox = this.toggleCheckBox.bind(this);
    this.state = {
      submitting: false,
      allProjects: this.projects || [],
      hostGenomes: this.hostGenomes || [],
      invalid: false,
      errorMessage: "",
      success: false,
      successMessage: "",
      selectedAlignmentConfigName: this.selected.alignmentConfigName || null,
      selectedHostGenome: this.selected.hostGenome || "",
      selectedHostGenomeId: this.selected.hostGenomeId || null,
      selectedProject: this.selected.project || "",
      selectedPId: this.selected.projectId || null,
      selectedResultPath: this.selected.resultPath || "",
      selectedBranch: this.selected.branch || "",
      selectedDagVars: this.selected.dagVars || "{}",
      selectedMaxInputFragments: this.selected.maxInputFragments || "",
      selectedSubsample: this.selected.subsample || "",
      id: this.selected.id,
      errors: {},
      adminGenomes,
      sampleName: this.selected.name || "",
      disableProjectSelect: false,
      publicChecked: false,
      consentChecked: false,

      // Local upload fields
      localUploadMode: true,
      localFilesToUpload: [],
      localFilesDoneUploading: [],
      localUploadShouldStart: false,
      localFileUploadURLs: ["", ""],
    };
  }

  componentDidMount() {
    $("body").addClass("background-cover");
    $(".tooltipped").tooltip({ delay: 50 });
    this.initializeSelectTag();
    $(ReactDOM.findDOMNode(this.refs.projectSelect)).on(
      "change",
      this.handleProjectChange
    );
    $(ReactDOM.findDOMNode(this.refs.hostSelect)).on(
      "change",
      this.handleHostChange
    );
    this.initializeTooltip();
  }

  parseUrlParams() {
    let urlParams = QueryString.parse(location.search, {
      arrayFormat: "bracket",
    });
    urlParams.projectId = parseInt(urlParams.projectId);
    return urlParams;
  }

  resetUrl() {
    // remove parameters from url
    window.history.replaceState({}, document.title, location.pathname);
  }

  initializeTooltip() {
    // only updating the tooltip offset when the component is loaded
    $(() => {
      const tooltipIdentifier = $("[rel='tooltip']");
      tooltipIdentifier.tooltip({
        delay: 0,
        html: true,
        placement: "top",
        offset: "0px 50px",
      });
    });
  }

  handleUpload(e) {
    e.preventDefault();
    this.clearError();
    if (!this.isFormInvalid()) {
      if (this.state.localUploadMode) {
        this.uploadSampleFromLocal();
      } else {
        this.uploadSampleFromRemote();
      }
    }
  }

  handleUpdate(e) {
    e.preventDefault();
    e.target.disabled = true;
    this.clearError();
    if (!this.isUpdateFormInvalid()) {
      this.updateSample();
    }
  }

  initializeSelectTag() {
    $("select").material_select();
  }

  clearError() {
    this.setState({
      invalid: false,
      success: false,
      errors: {},
    });
  }

  toggleCheckBox(e) {
    this.setState(
      {
        [e.target.id]: e.target.value == "true" ? false : true,
        /* Note: "[e.target.id]" indicates a "computed property name".
         This allows us to use toggleCheckBox(event) to set different state variables
         depending on the id attached to the event. */
      },
      () => {
        logAnalyticsEvent("SampleUpload_public-checkbox_toggled", {
          [e.target.id]: this.state[e.target.id],
        });
      }
    );
  }

  handleProjectSubmit(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    this.clearError();
    if (!this.isProjectInvalid()) {
      this.addProject();
    }
    logAnalyticsEvent("SampleUpload_create-project-link_clicked", {
      name: this.refs.new_project.value,
      publicChecked: this.state.publicChecked,
      isProjectInvalid: this.isProjectInvalid(),
    });
  }

  addProject() {
    var that = this;
    axios
      .post("/projects.json", {
        project: {
          name: this.refs.new_project.value,
          public_access: this.state.publicChecked ? 1 : 0,
        },
        authenticity_token: this.csrf,
      })
      .then(response => {
        var newProjectList = that.state.allProjects.slice();
        newProjectList.push(response.data);
        that.setState(
          {
            allProjects: newProjectList,
            selectedProject: response.data.name,
            selectedPId: response.data.id,
            success: true,
            successMessage: "Project added successfully",
          },
          () => {
            this.refs.new_project.value = "";
            that.initializeSelectTag();
          }
        );
      })
      .catch(error => {
        that.setState({
          invalid: true,
          errors: { selectedProject: "Project already exists or is invalid" },
        });
      });
  }

  isProjectInvalid() {
    if (
      this.refs.new_project.value === "" &&
      this.state.selectedProject === "Select a project"
    ) {
      this.setState({
        invalid: true,
        errorMessage: "Please enter valid project name",
      });
      return true;
    } else {
      return false;
    }
  }

  uploadSampleFromRemote() {
    this.setState({
      submitting: true,
    });

    const inputFiles = [
      this.refs.first_file_source.value.trim(),
      this.refs.second_file_source.value.trim(),
    ];
    createSample(
      this.state.sampleName,
      this.state.selectedProject.trim(),
      this.state.selectedHostGenomeId,
      inputFiles,
      "s3",
      this.state.selectedResultPath,
      this.state.selectedAlignmentConfigName,
      this.state.selectedBranch,
      this.state.selectedDagVars,
      this.state.selectedMaxInputFragments,
      this.state.selectedSubsample
    )
      .then(response => {
        this.setState({
          success: true,
          submitting: false,
          successMessage: "Sample created successfully",
        });
        openUrlWithTimeout(`/samples/${response.id}`);
      })
      .catch(error => {
        this.setState({
          invalid: true,
          submitting: false,
          errorMessage: joinServerError(error),
        });
      });
  }

  updateSample() {
    let that = this;
    that.setState({
      submitting: true,
    });

    axios
      .put(`/samples/${this.state.id}.json`, {
        sample: {
          name: this.state.sampleName,
          project: this.state.selectedProject,
          project_id: this.state.selectedPId,
          s3_preload_result_path: this.state.selectedResultPath,
          pipeline_branch: this.state.selectedBranch,
          dag_vars: this.state.selectedDagVars,
          max_input_fragments: this.state.selectedMaxInputFragments,
          subsample: this.state.selectedSubsample,
          alignment_config_name: this.state.selectedAlignmentConfigName,
          host_genome_id: this.state.selectedHostGenomeId,
        },
        authenticity_token: this.csrf,
      })
      .then(response => {
        that.setState({
          success: true,
          submitting: false,
          successMessage: "Sample updated successfully",
        });
        openUrlWithTimeout(`/samples/${that.state.id}`);
      })
      .catch(error => {
        that.setState({
          submitting: false,
          invalid: true,
          errorMessage: joinServerError(error.response.data),
        });
      });
  }

  filePathValid(str) {
    const regexPrefix = /s3:\/\//;
    const regexSuffix = /(\.fastq|\.fq|\.fastq.gz|\.fq.gz|\.fasta|\.fa|\.fasta.gz\.fa.gz)/gim;
    return str.match(regexPrefix) && str.match(regexSuffix);
  }

  isUpdateFormInvalid() {
    if (
      this.state.sampleName === "" &&
      this.state.selectedProject === "Select a Project" &&
      this.state.selectedHostGenome === ""
    ) {
      this.setState({
        invalid: true,
        errorMessage: "Please fill in name, host organism and select a project",
      });
      return true;
    } else if (this.state.sampleName === "") {
      this.setState({
        invalid: true,
        errorMessage: "Please fill in Sample name",
      });
      return true;
    } else if (this.state.selectedProject === "Select a Project") {
      this.setState({
        invalid: true,
        errorMessage: "Please select a project",
      });
      return true;
    } else if (this.state.selectedHostGenome === "") {
      this.setState({
        invalid: true,
        errorMessage: "Please select a host genome",
      });
      return true;
    } else {
      return false;
    }
  }

  isFormInvalid() {
    const errors = {};

    if (this.state.sampleName) {
      if (this.state.sampleName.toLowerCase() === "") {
        errors.sampleName = "Please enter a sample name";
      }
    } else {
      errors.sampleName = "Please enter a sample name";
    }

    if (this.state.selectedProject) {
      if (this.state.selectedProject.toLowerCase() === "select a project") {
        errors.selectedProject = "Please select a project";
      }
    } else {
      errors.selectedProject = "Please select a project";
    }

    if (this.state.selectedHostGenome) {
      if (this.state.selectedHostGenome === "") {
        errors.selectedHostGenome = "Please select a host genome";
      }
    } else {
      errors.selectedHostGenome = "Please select a host genome";
    }

    if (!this.state.localUploadMode) {
      if (this.refs.first_file_source) {
        const firstFileSourceValue = this.refs.first_file_source.value.trim();
        if (!this.filePathValid(firstFileSourceValue)) {
          errors.first_file_source = "Error: invalid file path";
        }
      } else {
        errors.first_file_source = "Error: invalid file path";
      }

      if (this.refs.second_file_source) {
        const secondFileSourceValue = this.refs.second_file_source.value.trim();
        if (
          secondFileSourceValue !== "" &&
          !this.filePathValid(secondFileSourceValue)
        ) {
          errors.second_file_source = "Error: invalid file path";
        }
      }
    }

    if (this.userDetails.admin) {
      // running validations for admin inputs
      if (this.refs.s3_preload_result_path) {
        const preloadPath = this.refs.s3_preload_result_path.value.trim();
        if (preloadPath !== "" && preloadPath.indexOf("s3://") < 0) {
          errors.s3_preload_result_path = "Error: invalid file path";
        }
      }
    }
    const errorLength = Object.keys(errors).length;
    if (errorLength) {
      this.setState({ invalid: true, errors });
    } else {
      this.setState({ invalid: false, errors });
    }
    return errorLength;
  }

  handleProjectChange(e) {
    if (e.target.value.trim().toLowerCase() !== "select a project") {
      const selectedIndex = e.target.selectedIndex - 1; // because the first item is Select a project
      this.setState({
        selectedProject: e.target.value.trim(),
        selectedPId: this.state.allProjects[selectedIndex].id,
        errors: Object.assign({}, this.state.errors, { selectedProject: null }),
      });
      logAnalyticsEvent("SampleUpload_project-selector_changed", {
        project: e.target.value.trim(),
        projectId: this.state.allProjects[selectedIndex].id,
        errors: Object.keys(this.state.errors).length,
      });
    }
    this.clearError();
  }

  handleHostChange(hostId, hostName) {
    this.setState({
      selectedHostGenome: hostName,
      selectedHostGenomeId: hostId,
    });
    this.clearError();
    logAnalyticsEvent("SampleUpload_host-genome_changed", {
      selectedHostGenome: hostName,
      selectedHostGenomeId: hostId,
    });
  }

  handleBranchChange(e) {
    this.setState({
      selectedBranch: e.target.value.trim(),
    });
    this.clearError();
  }

  handleDagVarsChange = e => {
    this.setState({
      selectedDagVars: e.target.value,
    });
    this.clearError();
  };

  handleSubsampleChange = e => {
    this.setState({
      selectedSubsample: e.target.value,
    });
    this.clearError();
  };

  handleMaxInputFragmentsChange = e => {
    this.setState({
      selectedMaxInputFragments: e.target.value,
    });
    this.clearError();
  };

  handleAlignmentConfigNameChange(e) {
    this.setState({
      selectedAlignmentConfigName: e.target.value.trim(),
    });
    this.clearError();
  }

  // TODO (gdingle): is this used anywhere?
  handleNameChange(e) {
    this.setState({
      sampleName: e.target.value.trim(),
    });
  }

  // TODO (gdingle): is this used anywhere?
  handleResultChange(e) {
    this.setState({
      selectedResultPath: e.target.value.trim(),
    });
  }

  toggleNewProjectInput(e) {
    this.clearError();
    $(".new-project-input").slideToggle();
    $(".new-project-input  .input-icon").slideToggle();
    $(".new-project-button").toggleClass("active");
    this.setState(
      {
        disableProjectSelect: !this.state.disableProjectSelect,
      },
      () => {
        this.initializeSelectTag();
        logAnalyticsEvent("SampleUpload_new-project-input_toggled", {
          disableProjectSelect: this.state.disableProjectSelect,
        });
      }
    );
  }

  static resolveGenomeIcon(genomeName, color) {
    if (typeof genomeName === "undefined") {
      return false;
    }
    genomeName = genomeName.toLowerCase();
    switch (genomeName) {
      case "mosquito":
        return <MosquitoIcon />;
      case "human":
        return <HumanIcon />;
      case "tick":
        return <TickIcon />;
      case "mouse":
        return <MouseIcon />;
      case "ercc only":
        return <ERCCIcon />;
      case "cat":
        return <CatIcon />;
      case "pig":
        return <PigIcon />;
      case "bee":
        return <BeeIcon />;
      case "c.elegans":
        return <WormIcon />;

      default:
        return false;
    }
  }

  updateSampleName(e, sampleField) {
    if (e) {
      let value = e.target.value.trim();
      if (value.length && value.indexOf("/")) {
        if (!this.refs.sample_name.value.trim().length) {
          const simplified = sampleNameFromFileName(value);
          this.refs.sample_name.value = simplified;
          this.setState({ sampleName: simplified });
          logAnalyticsEvent("SampleUpload_sample-name_changed", {
            sampleName: simplified,
          });
        }
      }
    } else {
      this.setState({ sampleName: sampleField });
      logAnalyticsEvent("SampleUpload_sample-name_changed", {
        sampleName: sampleField,
      });
    }
  }

  // Handle dropped files into the Dropzone uploaders
  onDrop = pos => accepted => {
    let newFiles;
    if (accepted.length > 0) {
      const fileName = accepted[0].name;

      if (accepted.length > 1) {
        // Fill in both boxes if they try to upload 2 at the same time.
        newFiles = accepted.slice(0, 2);
      } else {
        newFiles = accepted; // accepted looks like [File]
        const oldFiles = this.state.localFilesToUpload;
        if (pos === 0 && oldFiles[1]) {
          newFiles.push(oldFiles[1]);
        } else if (oldFiles[0]) {
          newFiles.unshift(oldFiles[0]);
        }
      }

      this.setState({
        localFilesToUpload: newFiles,
      });

      let sampleNameFromFile = null;

      // Set Sample Name field
      if (!this.state.sampleName) {
        sampleNameFromFile = sampleNameFromFileName(fileName);
        this.refs.sample_name.value = sampleNameFromFile;
        this.setState({ sampleName: sampleNameFromFile });
      }
      logAnalyticsEvent("SampleUpload_files_dropped", {
        pos,
        accepted: accepted.length,
        newFiles: newFiles.length,
        // eslint-disable-next-line no-undef
        sampleName: this.state.sampleName || sampleNameFromFile,
      });
      return;
    }
    logAnalyticsEvent("SampleUpload_files_dropped", {
      pos,
      accepted: accepted.length,
    });
  };

  uploadBoxHandleSuccess = file => {
    this.setState({
      localFilesDoneUploading: this.state.localFilesDoneUploading.concat(file),
    });
    if (
      this.state.localFilesToUpload.length ===
      this.state.localFilesDoneUploading.length
    ) {
      this.setState({
        submitting: false,
        successMessage: "All uploads finished!",
        success: true,
        invalid: false,
      });

      // Mark as uploaded
      axios
        .put(`/samples/${this.state.id}.json`, {
          sample: {
            id: this.state.id,
            status: "uploaded",
          },
          authenticity_token: this.csrf,
        })
        .then(() => {
          window.onbeforeunload = null;
          openUrlWithTimeout(`/samples/${this.state.id}`);
        })
        .catch(error => {
          this.setState({
            invalid: true,
            submitting: false,
            errorMessage: joinServerError(error.response.data),
          });
        });
    }
  };

  uploadBoxHandleFailure = (file, err) => {
    this.setState({
      submitting: false,
      invalid: true,
      errorMessage:
        `Upload of ${
          file.name
        } failed for some reason. Please delete the created sample and try again or ask us our team for help. ` +
        err,
    });
  };

  // Upload local files after creating the sample and getting presigned URLs
  uploadLocalFiles = createResponse => {
    if (createResponse.length > 0) {
      // Fill in presigned URL fields
      let newURLs;
      if (createResponse.length === 1) {
        newURLs = [createResponse[0].presigned_url, ""];
      } else {
        newURLs = [
          createResponse[0].presigned_url,
          createResponse[1].presigned_url,
        ];
      }

      // Tell uploaders to start
      this.setState({
        localFileUploadURLs: newURLs,
        localUploadShouldStart: true,
        submitting: true,
        invalid: true,
        errorMessage:
          "Upload in progress... Please keep this page open until completed...",
      });

      // Chrome will show a generic message and not this message.
      window.onbeforeunload = () =>
        "Uploading is in progress. Are you sure you want to exit?";
    }
  };

  uploadSampleFromLocal = () => {
    this.setState({
      submitting: true,
    });

    createSample(
      this.state.sampleName,
      this.state.selectedProject.trim(),
      this.state.selectedHostGenomeId,
      this.state.localFilesToUpload,
      "local",
      this.state.selectedResultPath,
      this.state.selectedAlignmentConfigName,
      this.state.selectedBranch,
      this.state.selectedDagVars,
      this.state.selectedMaxInputFragments,
      this.state.selectedSubsample
    )
      .then(response => {
        this.setState({
          id: response.id,
        });
        startUploadHeartbeat(response.id);
        this.uploadLocalFiles(response.input_files);
      })
      .catch(error => {
        this.setState({
          invalid: true,
          submitting: false,
          errorMessage: joinServerError(error),
        });
      });
  };

  renderSampleForm(updateExistingSample = false) {
    const submitButton = (
      <button
        type="submit"
        disabled={!this.state.consentChecked || this.state.submitting}
        className="new-button blue-button upload-samples-button"
        onClick={
          updateExistingSample
            ? withAnalytics(
                this.handleUpdate,
                "SampleUpload_update-button_clicked"
              )
            : withAnalytics(
                this.handleUpload,
                "SampleUpload_upload-button_clicked",
                {
                  localUploadMode: this.state.localUploadMode,
                }
              )
        }
      >
        {this.state.submitting ? (
          <i className="fa fa-spinner fa-spin fa-lg" />
        ) : (
          (updateExistingSample ? "Update" : "Upload") + " Sample"
        )}
      </button>
    );

    let uploadModeSwitcher;
    if (!updateExistingSample) {
      uploadModeSwitcher = (
        <div className="menu-container">
          <Menu compact>
            <MenuItem
              active={this.state.localUploadMode}
              onClick={withAnalytics(
                () => this.setState({ localUploadMode: true }),
                "SampleUpload_upload-local_clicked"
              )}
              disabled={this.state.submitting}
            >
              <Icon size="large" name="folder open outline" />
              Upload from Your Computer
            </MenuItem>
            <MenuItem
              active={!this.state.localUploadMode}
              onClick={withAnalytics(
                () => this.setState({ localUploadMode: false }),
                "SampleUpload_upload-remote_clicked"
              )}
              disabled={this.state.submitting}
            >
              <Icon size="large" name="server" />
              Upload from S3
            </MenuItem>
          </Menu>
        </div>
      );
    }

    const toUpload = this.state.localFilesToUpload;

    const localInputFileSection = (
      <div className="field">
        <div className="validation-info">
          Max file size for local uploads: 5GB per file. Accepted formats: fastq
          (.fq), fastq.gz (.fq.gz), fasta (.fa), fasta.gz (.fa.gz).
        </div>
        <div className="row">
          <UploadBox
            className="sample-upload-box"
            onDrop={this.onDrop(0)}
            title={"Read 1 File:"}
            fileToUpload={toUpload.length > 0 ? toUpload[0] : null}
            startUpload={this.state.localUploadShouldStart}
            url={this.state.localFileUploadURLs[0]}
            handleSuccess={this.uploadBoxHandleSuccess}
            handleFailure={this.uploadBoxHandleFailure}
          />
          <UploadBox
            className="sample-upload-box"
            onDrop={this.onDrop(1)}
            title={"Read 2 File (optional):"}
            fileToUpload={toUpload.length > 1 ? toUpload[1] : null}
            startUpload={this.state.localUploadShouldStart}
            url={this.state.localFileUploadURLs[1]}
            handleSuccess={this.uploadBoxHandleSuccess}
            handleFailure={this.uploadBoxHandleFailure}
          />
        </div>
      </div>
    );

    const remoteInputFileSection = (
      <div>
        <div className="field">
          <div className="row">
            <div className="col no-padding s12">
              <div className="field-title">
                <div className="read-count-label">Read 1</div>
                <div className="validation-info">
                  Accepted formats: fastq (.fq), fastq.gz (.fq.gz), fasta (.fa),
                  fasta.gz (.fa.gz)
                </div>
                <div className="example-link">
                  Example:
                  s3://your_s3_bucket/project1/fastqs/sample075_water_S23_R1_001.fastq.gz
                </div>
              </div>
            </div>
          </div>
          <div className="row input-row">
            <div className="col no-padding s12">
              <input
                type="text"
                ref="first_file_source"
                onKeyUp={this.updateSampleName}
                onBlur={this.clearError}
                className="browser-default"
                placeholder="aws/path-to-sample"
                defaultValue={this.firstInput}
                disabled={updateExistingSample}
              />
              {this.state.errors.first_file_source ? (
                <div className="field-error">
                  {this.state.errors.first_file_source}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="field">
          <div className="row">
            <div className="col no-padding s12">
              <div className="field-title">
                <div className="read-count-label">Read 2 (optional)</div>
                <div className="validation-info">
                  Accepted formats: fastq (.fq), fastq.gz (.fq.gz), fasta (.fa),
                  fasta.gz (.fa.gz)
                </div>
                <div className="example-link">
                  Example:
                  s3://your_s3_bucket/project1/fastqs/sample075_water_S23_R2_001.fastq.gz
                </div>
              </div>
            </div>
          </div>
          <div className="row input-row">
            <div className="col no-padding s12">
              <input
                ref="second_file_source"
                onFocus={this.clearError}
                type="text"
                className="browser-default"
                placeholder="aws/path-to-sample"
                defaultValue={this.secondInput}
                disabled={updateExistingSample}
              />
              {this.state.errors.second_file_source ? (
                <div className="field-error">
                  {this.state.errors.second_file_source}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="upload-notes">
          <div>
            - Please ensure that IDseq has permissions to read/list your S3
            bucket or ask our team for help.
          </div>
          <div>
            - Also convert links like
            "https://s3-us-west-2.amazonaws.com/your_s3_bucket/project1/fastqs/sample075_water_S23_R2_001.fastq.gz"
            to the format
            "s3://your_s3_bucket/project1/fastqs/sample075_water_S23_R2_001.fastq.gz"
          </div>
        </div>
      </div>
    );

    let inputFileSection = remoteInputFileSection;
    if (!updateExistingSample && this.state.localUploadMode) {
      inputFileSection = localInputFileSection;
    }

    return (
      <div id="samplesUploader" className="row">
        <div className="col s6 offset-s3 upload-form-container">
          <div className="content">
            <div>
              <div className="form-title">Single Upload</div>
              <div className="upload-info">
                Upload a single sample to be processed through the IDseq
                pipeline.
              </div>
            </div>
            <div>
              <p className="upload-question">
                Want to upload multiple samples at once?{" "}
                <a href="/samples/bulk_new">Click here.</a>
                <br />Rather use our command-line interface?
                <a
                  href="/cli_user_instructions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {" "}
                  View CLI Instructions.
                </a>
              </p>
            </div>
            <form
              ref="form"
              onSubmit={
                updateExistingSample
                  ? withAnalytics(
                      this.handleUpdate,
                      "SampleUpload_update-form_submitted"
                    )
                  : withAnalytics(
                      this.handleUpload,
                      "SampleUpload_upload-form_submitted",
                      {
                        localUploadMode: this.state.localUploadMode,
                      }
                    )
              }
            >
              <div className="fields">
                <div className="field proj-field">
                  <div className="row">
                    <div className="col field-title no-padding s12">
                      Project
                    </div>
                  </div>
                  <div className="row input-row">
                    <Tipsy
                      content="Name of experiment or project"
                      placement="top"
                    >
                      <div className="col project-list no-padding s8">
                        <select
                          ref="projectSelect"
                          disabled={
                            this.state.disableProjectSelect ? "disabled" : ""
                          }
                          className="projectSelect"
                          id="sample"
                          onChange={this.handleProjectChange}
                          value={this.state.selectedProject}
                        >
                          <option disabled defaultValue>
                            {this.state.selectedProject}
                          </option>
                          {this.state.allProjects.length ? (
                            ObjectHelper.sortByKey(
                              this.state.allProjects,
                              "name"
                            ).map((project, i) => {
                              return (
                                <option ref="project" key={i} id={project.id}>
                                  {project.name}
                                </option>
                              );
                            })
                          ) : (
                            <option>No projects to display</option>
                          )}
                        </select>
                        {this.state.errors.selectedProject ? (
                          <div className="field-error">
                            {this.state.errors.selectedProject}
                          </div>
                        ) : null}
                      </div>
                    </Tipsy>
                    <div className="col no-padding s4">
                      <Tipsy
                        content="Add a new desired experiment or project name"
                        placement="right"
                      >
                        <button
                          type="button"
                          onClick={this.toggleNewProjectInput}
                          className="new-project-button new-button secondary-button"
                        >
                          <i className="fa fa-plus" />
                          <span>New Project</span>
                        </button>
                      </Tipsy>
                    </div>
                    <div className="col no-padding s12 new-project-input hidden">
                      <input
                        type="text"
                        ref="new_project"
                        onFocus={this.clearError}
                        className="browser-default new_project_input"
                        placeholder="Input new project name"
                      />
                      <span
                        className="input-icon hidden"
                        onClick={e => {
                          if (this.refs.new_project.value.trim().length) {
                            this.handleProjectSubmit();
                          }
                          $(".new-project-button").click();
                        }}
                      >
                        Create project
                      </span>
                      {this.state.errors.new_project ? (
                        <div className="field-error">
                          {this.state.errors.new_project}
                        </div>
                      ) : null}
                    </div>
                    <div className="col no-padding s12 new-project-input public_access hidden">
                      <input
                        ref="public_checked"
                        type="checkbox"
                        name="switch"
                        id="public_checked"
                        className="col s8 filled-in"
                        onChange={this.toggleCheckBox}
                        value={this.state.publicChecked}
                      />
                      <label htmlFor="public_checked" className="checkbox">
                        Make project public
                      </label>
                    </div>
                  </div>
                </div>

                <div className="field field-host">
                  <div className="row">
                    <Tipsy
                      content="This will be subtracted by the pipeline"
                      placement="top"
                    >
                      <div
                        className="col field-title no-padding s5"
                        data-delay="50"
                      >
                        Select host genome
                      </div>
                    </Tipsy>
                    {this.userDetails.admin ? (
                      <div className="col s7 right-align no-padding right admin-genomes">
                        {this.state.adminGenomes.map(g => {
                          return (
                            <div
                              key={g.id}
                              className={`${
                                this.state.selectedHostGenome === g.name
                                  ? "active"
                                  : ""
                              } genome-label`}
                              id={g.name}
                              onClick={() =>
                                this.handleHostChange(g.id, g.name)
                              }
                            >
                              {g.name}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                  <div className="row input-row">
                    <div className="col center no-padding s12">
                      <ul className="host-selector">
                        {this.state.hostGenomes.map(g => {
                          return SampleUpload.resolveGenomeIcon(g.name) ? (
                            <li
                              key={g.id}
                              className={`${
                                this.state.selectedHostGenome === g.name
                                  ? "active"
                                  : ""
                              } `}
                              id={g.name}
                              onClick={() =>
                                this.handleHostChange(g.id, g.name)
                              }
                            >
                              <div className="img-container">
                                {SampleUpload.resolveGenomeIcon(g.name)}
                              </div>
                              <div className="genome-label">{g.name}</div>
                            </li>
                          ) : null;
                        })}
                        {this.state.hostGenomes.length ? (
                          ""
                        ) : (
                          <div>
                            <small>No host organism found!</small>
                          </div>
                        )}
                      </ul>
                      {this.state.errors.selectedHostGenome ? (
                        <div className="field-error">
                          {this.state.errors.selectedHostGenome}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="upload-mode-title">Sample Input Files</div>
                {uploadModeSwitcher}
                {inputFileSection}

                <div className="field">
                  <div className="row">
                    <div className="col no-padding s12">
                      <div className="field-title">
                        <div className="read-count-label">Sample name</div>
                      </div>
                    </div>
                  </div>
                  <div className="row input-row">
                    <div className="col no-padding s12">
                      <input
                        type="text"
                        ref="sample_name"
                        className="browser-default"
                        onChange={e =>
                          this.updateSampleName(null, e.target.value)
                        }
                        value={this.state.sampleName}
                        placeholder="sample name"
                      />
                      {this.state.errors.sampleName ? (
                        <div className="field-error">
                          {this.state.errors.sampleName}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                {this.userDetails.admin ? (
                  <div>
                    <div className="admin-fields divider" />
                    <div className="admin-input-title">Admin options</div>
                    <div className="field">
                      <div className="row">
                        <div className="col no-padding s12">
                          <div className="field-title">
                            <div className="read-count-label">
                              Preload results path (s3)
                            </div>
                            <div className="example-link">
                              Example:
                              s3://yunfang-workdir/id-rr004/RR004_water_2_S23/
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row input-row">
                        <div className="col no-padding s12">
                          <input
                            type="text"
                            ref="s3_preload_result_path"
                            className="browser-default"
                            placeholder="aws/path-of-results"
                            disabled={updateExistingSample}
                            defaultValue={this.selected.resultPath}
                          />
                          {this.state.errors.s3_preload_result_path ? (
                            <div className="field-error">
                              {this.state.errors.s3_preload_result_path}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="field">
                      <div className="row">
                        <div className="col no-padding s12">
                          <div className="field-title">
                            <div
                              htmlFor="alignment_config_name"
                              className="read-count-label"
                            >
                              Alignment Config Name. i.e. 2018-12-01
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row input-row">
                        <div className="col no-padding s12">
                          <input
                            id="alignment_config_name"
                            type="text"
                            className="browser-default"
                            ref="alignment_config_name"
                            value={this.state.selectedAlignmentConfigName}
                            placeholder="2018-12-01"
                            onChange={this.handleAlignmentConfigNameChange}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="field">
                      <div className="row">
                        <div className="col no-padding s12">
                          <div className="field-title">
                            <div
                              htmlFor="pipeline_branch"
                              className="read-count-label"
                            >
                              Branch of idseq-dag to be used for processing
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row input-row">
                        <div className="col no-padding s12">
                          <input
                            id="pipeline_branch"
                            type="text"
                            className="browser-default"
                            ref="pipeline_branch"
                            value={this.state.selectedBranch}
                            placeholder="master"
                            onChange={this.handleBranchChange}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="field">
                      <div className="row">
                        <div className="col no-padding s12">
                          <div className="field-title">
                            <div
                              htmlFor="dag_vars"
                              className="read-count-label"
                            >
                              Dictionary of variables to be used in DAG template
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row input-row">
                        <div className="col no-padding s12">
                          <input
                            id="dag_vars"
                            type="text"
                            className="browser-default"
                            ref="dag_vars"
                            value={this.state.selectedDagVars}
                            placeholder="{}"
                            onChange={this.handleDagVarsChange}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="field">
                      <div className="row">
                        <div className="col no-padding s12">
                          <div className="field-title">
                            <div
                              htmlFor="sampling_options"
                              className="read-count-label"
                            >
                              Truncate input fragments / subsample non-host
                              reads
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row input-row">
                        <div className="col s6">
                          <input
                            id="max_input_fragments"
                            type="text"
                            className="browser-default"
                            ref="sampling_options"
                            value={this.state.selectedMaxInputFragments}
                            placeholder="max input fragments"
                            onChange={this.handleMaxInputFragmentsChange}
                          />
                        </div>
                        <div className="col s6">
                          <input
                            id="subsample"
                            type="text"
                            className="browser-default"
                            ref="sampling_options"
                            value={this.state.selectedSubsample}
                            placeholder="subsample non-host reads"
                            onChange={this.handleSubsampleChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="field">
                  <TermsAgreement
                    checked={this.state.consentChecked}
                    onChange={() =>
                      this.setState(
                        {
                          consentChecked: !this.state.consentChecked,
                        },
                        () =>
                          logAnalyticsEvent(
                            "SampleUpload_consent-checkbox_clicked",
                            {
                              consentChecked: this.state.consentChecked,
                            }
                          )
                      )
                    }
                  />
                  <div className="row">
                    <div className="col no-padding s12">
                      {this.state.success ? (
                        <div className="form-feedback success-message">
                          <i className="fa fa-check-circle-o" />{" "}
                          <span>{this.state.successMessage}</span>
                        </div>
                      ) : null}
                      {this.state.invalid ? (
                        <div className="form-feedback error-message">
                          {this.state.errorMessage}
                        </div>
                      ) : null}
                      {submitButton}
                      <button
                        type="button"
                        onClick={withAnalytics(
                          () => window.history.back(),
                          "SampleUpload_cancel-button_clicked"
                        )}
                        className="new-button secondary-button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
  render() {
    return (
      <div className="single-upload-import">
        {this.renderSampleForm(this.props.selectedSample)}
      </div>
    );
  }
}
export default SampleUpload;
