import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import $ from "jquery";
import Tipsy from "react-tipsy";
import IconComponent from "./IconComponent";
import ObjectHelper from "../helpers/ObjectHelper";
import Dropzone from "react-dropzone";
import PrimaryButton from "./ui/controls/buttons/PrimaryButton";
import { Icon } from "semantic-ui-react";

class SampleUpload extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.handleUpload = this.handleUpload.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.csrf = props.csrf;
    this.project = props.projectInfo ? props.projectInfo : null;
    this.handleProjectSubmit = this.handleProjectSubmit.bind(this);
    this.clearError = this.clearError.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleProjectChange = this.handleProjectChange.bind(this);
    this.handleHostChange = this.handleHostChange.bind(this);
    this.handleMemoryChange = this.handleMemoryChange.bind(this);
    this.handleBranchChange = this.handleBranchChange.bind(this);
    this.handleResultChange = this.handleResultChange.bind(this);
    this.handleAlignmentConfigNameChange = this.handleAlignmentConfigNameChange.bind(
      this
    );
    this.toggleNewProjectInput = this.toggleNewProjectInput.bind(this);
    this.projects = props.projects || [];
    this.project = props.projectInfo || "";
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
      jobQueue: this.sample ? this.sample.job_queue : "",
      memory: this.sample ? this.sample.sample_memory : "",
      branch: this.sample ? this.sample.pipeline_branch : "",
      dagVars: this.sample ? this.sample.dag_vars : "{}",
      alignmentConfigName: this.sample ? this.sample.alignment_config_name : "",
      id: this.sample.id || "",
      inputFiles:
        props.inputFiles && props.inputFiles.length ? props.inputFiles : [],
      status: this.sample.status
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
      selectedMemory: this.selected.memory || "",
      selectedBranch: this.selected.branch || "",
      selectedDagVars: this.selected.dagVars || "{}",
      id: this.selected.id,
      errors: {},
      adminGenomes,
      sampleName: this.selected.name || "",
      disableProjectSelect: false,
      omitSubsamplingChecked: false,
      publicChecked: false,
      consentChecked: false,
      localUploadMode: true,
      localFilesToUpload: [],
      localFilesDoneUploading: [],
      localUploadProgress: [0, 0]
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
  initializeTooltip() {
    // only updating the tooltip offset when the component is loaded
    $(() => {
      const tooltipIdentifier = $("[rel='tooltip']");
      tooltipIdentifier.tooltip({
        delay: 0,
        html: true,
        placement: "top",
        offset: "0px 50px"
      });
    });
  }

  handleUpload(e) {
    e.preventDefault();
    this.clearError();
    if (!this.isFormInvalid()) {
      if (this.state.localUploadMode) {
        this.createSampleFromLocal();
      } else {
        this.createSampleFromRemote();
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
      errors: {}
    });
  }

  goToPage = path => {
    location.href = path;
  };

  goToPageWithTimeout = page => {
    setTimeout(() => {
      this.goToPage(page);
    }, 2000);
  };

  toggleCheckBox(e) {
    this.setState({
      [e.target.id]: e.target.value == "true" ? false : true
      /* Note: "[e.target.id]" indicates a "computed property name".
         This allows us to use toggleCheckBox(event) to set different state variables
         depending on the id attached to the event. */
    });
  }

  handleProjectSubmit(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    this.clearError();
    if (!this.isProjectInvalid()) {
      this.addProject();
    }
  }

  addProject() {
    var that = this;
    axios
      .post("/projects.json", {
        project: {
          name: this.refs.new_project.value,
          public_access: this.state.publicChecked ? 1 : 0
        },
        authenticity_token: this.csrf
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
            successMessage: "Project added successfully"
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
          errors: { selectedProject: "Project already exists or is invalid" }
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
        errorMessage: "Please enter valid project name"
      });
      return true;
    } else {
      return false;
    }
  }

  createSampleFromRemote() {
    this.setState({
      submitting: true
    });
    axios
      .post("/samples.json", {
        sample: {
          name: this.state.sampleName,
          project_name: this.state.selectedProject.trim(),
          project_id: this.state.selectedPId,
          input_files_attributes: [
            {
              source_type: "s3",
              source: this.refs.first_file_source.value.trim()
            },
            {
              source_type: "s3",
              source: this.refs.second_file_source.value.trim()
            }
          ],
          s3_preload_result_path: this.userDetails.admin
            ? this.refs.s3_preload_result_path.value.trim()
            : "",
          sample_memory: this.state.selectedMemory,
          pipeline_branch: this.state.selectedBranch,
          dag_vars: this.state.selectedDagVars,
          host_genome_id: this.state.selectedHostGenomeId,
          subsample: this.state.omitSubsamplingChecked ? 0 : 1,
          alignment_config_name: this.state.selectedAlignmentConfigName,
          status: "created",
          client: "web"
        },
        authenticity_token: this.csrf
      })
      .then(response => {
        this.setState({
          success: true,
          submitting: false,
          successMessage: "Sample created successfully"
        });
        this.goToPageWithTimeout(`/samples/${response.data.id}`);
      })
      .catch(error => {
        this.setState({
          invalid: true,
          submitting: false,
          errorMessage: this.joinServerError(error.response.data)
        });
      });
  }

  joinServerError = function(response) {
    let joined = "";
    console.log("input response:", response);
    Object.keys(response).forEach(group => {
      joined += response[group].join(". ");
    });
    return joined;
  };

  updateSample() {
    let that = this;
    that.setState({
      submitting: true
    });

    axios
      .put(`/samples/${this.state.id}.json`, {
        sample: {
          name: this.state.sampleName,
          project: this.state.selectedProject,
          project_id: this.state.selectedPId,
          s3_preload_result_path: this.state.selectedResultPath,
          sample_memory: this.state.selectedMemory,
          pipeline_branch: this.state.selectedBranch,
          dag_vars: this.state.selectedDagVars,
          alignment_config_name: this.state.selectedAlignmentConfigName,
          host_genome_id: this.state.selectedHostGenomeId
        },
        authenticity_token: this.csrf
      })
      .then(response => {
        that.setState({
          success: true,
          submitting: false,
          successMessage: "Sample updated successfully"
        });
        this.goToPageWithTimeout(`/samples/${that.state.id}`);
      })
      .catch(error => {
        that.setState({
          submitting: false,
          invalid: true,
          errorMessage: this.joinServerError(error.response.data)
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
        errorMessage: "Please fill in name, host genome and select a project"
      });
      return true;
    } else if (this.state.sampleName === "") {
      this.setState({
        invalid: true,
        errorMessage: "Please fill in Sample name"
      });
      return true;
    } else if (this.state.selectedProject === "Select a Project") {
      this.setState({
        invalid: true,
        errorMessage: "Please select a project"
      });
      return true;
    } else if (this.state.selectedHostGenome === "") {
      this.setState({
        invalid: true,
        errorMessage: "Please select a host genome"
      });
      return true;
    } else {
      return false;
    }
  }
  baseName(str) {
    console.log("str being passed in:", str);
    let base = new String(str).substring(str.lastIndexOf("/") + 1);
    if (base.lastIndexOf(".") != -1) {
      base = base.substring(0, base.lastIndexOf("."));
    }
    return base;
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
      if (this.state.selectedMemory !== "") {
        const memorySize = parseInt(this.state.selectedMemory, 10);
        if (isNaN(memorySize) || memorySize < 1) {
          errors.memory = "Memory size is not valid";
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
        errors: Object.assign({}, this.state.errors, { selectedProject: null })
      });
    }
    this.clearError();
  }

  handleHostChange(hostId, hostName) {
    this.setState({
      selectedHostGenome: hostName,
      selectedHostGenomeId: hostId
    });
    this.clearError();
  }

  handleMemoryChange(e) {
    this.setState({
      selectedMemory: e.target.value.trim()
    });
    this.clearError();
  }

  handleBranchChange(e) {
    this.setState({
      selectedBranch: e.target.value.trim()
    });
    this.clearError();
  }

  handleDagVarsChange = e => {
    this.setState({
      selectedDagVars: e.target.value
    });
    this.clearError();
  };

  handleAlignmentConfigNameChange(e) {
    this.setState({
      selectedAlignmentConfigName: e.target.value.trim()
    });
    this.clearError();
  }

  handleNameChange(e) {
    this.setState({
      sampleName: e.target.value.trim()
    });
  }

  handleResultChange(e) {
    this.setState({
      selectedResultPath: e.target.value.trim()
    });
  }

  toggleNewProjectInput(e) {
    this.clearError();
    $(".new-project-input").slideToggle();
    $(".new-project-input  .input-icon").slideToggle();
    $(".new-project-button").toggleClass("active");
    this.setState(
      {
        disableProjectSelect: !this.state.disableProjectSelect
      },
      () => {
        this.initializeSelectTag();
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
        return IconComponent.mosquito(color);
      case "human":
        return IconComponent.human(color);
      case "tick":
        return IconComponent.tick(color);
      case "mouse":
        return IconComponent.mouse(color);
      case "ercc only":
        return IconComponent.ercc(color);
      default:
        return false;
    }
  }

  updateSampleName(e, sampleField) {
    if (e) {
      let value = e.target.value.trim();
      if (value.length && value.indexOf("/")) {
        if (!this.refs.sample_name.value.trim().length) {
          const simplified = this.getSampleNameFromFileName(value);
          this.refs.sample_name.value = simplified;
          this.setState({ sampleName: simplified });
        }
      }
    } else {
      this.setState({ sampleName: sampleField });
    }
  }

  onDrop = pos => acceptedFiles => {
    const toAdd = acceptedFiles[0];
    const oldFiles = this.state.localFilesToUpload;
    let newFiles = [toAdd];

    if (pos === 0 && oldFiles[1]) {
      newFiles.push(oldFiles[1]);
    } else if (oldFiles[0]) {
      newFiles.unshift(oldFiles[0]);
    }

    this.setState({
      localFilesToUpload: newFiles
    });

    // Set Sample Name field
    if (!this.state.sampleName) {
      const simplified = this.getSampleNameFromFileName(toAdd.name);
      this.refs.sample_name.value = simplified;
      this.setState({ sampleName: simplified });
    }
  };

  updateUploadProgress = (pos, changed) => {
    let progress;
    if (pos === 0) {
      progress = [changed, this.state.localUploadProgress[1]];
    } else {
      progress = [this.state.localUploadProgress[0], changed];
    }
    this.setState({
      localUploadProgress: progress
    });
  };

  uploadFileToURL = (file, url, pos) => {
    console.log("Upload is starting");
    const config = {
      onUploadProgress: e => {
        const percent = Math.round(e.loaded * 100 / e.total);
        this.updateUploadProgress(pos, percent);
      }
    };
    axios
      .put(url, file, config)
      .then(() => {
        console.log("upload is done");
        this.markAndCheckUploadCompletion(file);
      })
      .catch(e => {
        this.setState({
          submitting: false,
          invalid: true,
          errorMessage:
            `Upload of ${
              file.name
            } failed for some reason. Please delete the created sample and try again or ask us our team for help. ` +
            e
        });
        console.log("upload failed");
      });
  };

  markAndCheckUploadCompletion = file => {
    this.setState({
      localFilesDoneUploading: this.state.localFilesDoneUploading.concat(file)
    });
    if (
      this.state.localFilesToUpload.length ===
      this.state.localFilesDoneUploading.length
    ) {
      this.setState({
        submitting: false,
        successMessage: "All uploads finished!",
        errorMessage: ""
      });
      this.goToPageWithTimeout(`/samples/${this.state.id}`);
    }
  };

  uploadLocalFiles = createResponse => {
    console.log("createResponse:", createResponse);
    if (createResponse.length > 0) {
      this.setState({
        submitting: true,
        errorMessage:
          "Upload in progress... Please keep this page open until completed..."
      });

      for (let i = 0; i < createResponse.length; i++) {
        const url = createResponse[i].presigned_url;
        this.uploadFileToURL(this.state.localFilesToUpload[i], url, i);
      }
    }
  };

  createSampleFromLocal = () => {
    this.setState({
      submitting: true
    });
    let inputFilesAttributes = [];
    this.state.localFilesToUpload.forEach(file => {
      inputFilesAttributes.push({
        source_type: "local",
        source: file ? file.name.trim() : "",
        parts: file ? file.name.trim() : ""
      });
    });

    axios
      .post("/samples.json", {
        sample: {
          name: this.state.sampleName,
          project_name: this.state.selectedProject.trim(),
          project_id: this.state.selectedPId,
          input_files_attributes: inputFilesAttributes,
          host_genome_id: this.state.selectedHostGenomeId,

          // Admin options
          s3_preload_result_path: this.userDetails.admin
            ? this.refs.s3_preload_result_path.value.trim()
            : "",
          sample_memory: this.state.selectedMemory,
          alignment_config_name: this.state.selectedAlignmentConfigName,
          pipeline_branch: this.state.selectedBranch,
          status: "created",
          client: "web"
        },
        authenticity_token: this.csrf
      })
      .then(response => {
        this.setState({
          id: response.data.id
        });
        this.uploadLocalFiles(response.data.input_files);
      })
      .catch(error => {
        console.log("ERR:", error);
        this.setState({
          invalid: true,
          submitting: false,
          errorMessage: this.joinServerError(error.response.data)
        });
      });
  };

  toggleUploadMode = () => {
    this.setState({
      localUploadMode: !this.state.localUploadMode
    });
  };

  getSampleNameFromFileName = fname => {
    let base = this.baseName(fname);
    const fastqLabel = /.fastq*$|.fq*$|.fasta*$|.fa*$|.gz*$/gim;
    const readLabel = /_R1.*$|_R2.*$/gi;
    base = base.replace(fastqLabel, "").replace(readLabel, "");
    return base;
  };

  renderSampleForm(updateExistingSample = false) {
    const termsBlurb = (
      <div className="consent-blurb">
        <input
          type="checkbox"
          id="consentChecked"
          className="filled-in"
          onChange={this.toggleCheckBox}
          value={this.state.consentChecked}
        />
        <label htmlFor="consentChecked" className="checkbox">
          <span>
            {
              "I agree that the data I am uploading to IDseq has been lawfully collected and that I have all the necessary consents, permissions, and authorizations needed to collect, share, and export data to IDseq as outlined in the "
            }
          </span>
          <a
            href="https://assets.idseq.net/Terms.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="terms-link"
          >
            Terms
          </a>
          {" and "}
          <a
            href="https://assets.idseq.net/Privacy.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="terms-link"
          >
            Data Privacy Notice.
          </a>
        </label>
      </div>
    );

    const submitButton = (
      <button
        type="submit"
        disabled={!this.state.consentChecked || this.state.submitting}
        className="new-button blue-button upload-samples-button"
        onClick={updateExistingSample ? this.handleUpdate : this.handleUpload}
      >
        {this.state.submitting ? (
          <i className="fa fa-spinner fa-spin fa-lg" />
        ) : (
          (updateExistingSample ? "Update" : "Upload") + " Sample"
        )}
      </button>
    );

    const dropzoneBox = pos => {
      return (
        <Dropzone
          className="dropzone-box"
          acceptClassName="dropzone-accepted"
          onDrop={this.onDrop(pos)}
          maxSize={5e9}
          multiple={false}
        >
          <div className="dropzone-inside">
            <div className="dropzone-file-title">{`Read ${pos + 1} File:`}</div>
            {this.state.localFilesToUpload[pos] ? (
              <div className="dropzone-file">
                {this.state.localFilesToUpload[pos].name}
              </div>
            ) : (
              "Drag and drop a file here, or click to use a file browser."
            )}
            <div className="dropzone-progress">
              {this.state.localUploadProgress[pos]
                ? `${this.state.localUploadProgress[pos]}% uploaded...`
                : null}
            </div>
          </div>
        </Dropzone>
      );
    };

    const localInputFileSection = (
      <div className="field">
        <div className="input-file-header">
          <PrimaryButton
            text="Switch to Remote Upload (From S3)"
            onClick={this.toggleUploadMode}
            icon={<Icon size="large" name="server" />}
          />
          <div className="upload-mode-title">Local Upload Input Files</div>
          <div className="validation-info">
            Max file size for local uploads: 5GB per file. Accepted formats:
            fastq (.fq), fastq.gz (.fq.gz), fasta (.fa), fasta.gz (.fa.gz).
          </div>
        </div>
        <div className="row">
          {dropzoneBox(0)}
          {dropzoneBox(1)}
        </div>
      </div>
    );

    const remoteInputFileSection = (
      <div>
        <div className="field">
          {updateExistingSample ? null : (
            <div className="input-file-header">
              <PrimaryButton
                text="Switch to Local Upload (From Your Computer)"
                onClick={this.toggleUploadMode}
                icon={<Icon size="large" name="folder open outline" />}
              />
              <div className="upload-mode-title">Remote Upload Input Files</div>
            </div>
          )}
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
                  s3://czbiohub-infectious-disease/RR004/RR004_water_2_S23/RR004_water_2_S23_R1_001.fastq.gz
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
                  s3://czbiohub-infectious-disease/RR004/RR004_water_2_S23/RR004_water_2_S23_R2_001.fastq.gz
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
            "https://s3-us-west-2.amazonaws.com/czbiohub-infectious-disease/RR004/RR004_water_2_S23/RR004_water_2_S23_R1_001.fastq.gz"
            to the format
            "s3://czbiohub-infectious-disease/RR004/RR004_water_2_S23/RR004_water_2_S23_R1_001.fastq.gz"
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
                  Instructions here.
                </a>
              </p>
            </div>
            <form
              ref="form"
              onSubmit={
                updateExistingSample ? this.handleUpdate : this.handleUpload
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
                              <div
                                className="img-container"
                                dangerouslySetInnerHTML={{
                                  __html: SampleUpload.resolveGenomeIcon(g.name)
                                }}
                              />
                              <div className="genome-label">{g.name}</div>
                            </li>
                          ) : null;
                        })}
                        {this.state.hostGenomes.length ? (
                          ""
                        ) : (
                          <div>
                            <small>No host genome found!</small>
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
                              htmlFor="sample_memory"
                              className="read-count-label"
                            >
                              Sample memory (in MB)
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row input-row">
                        <div className="col no-padding s12">
                          <input
                            id="sample_memory"
                            type="text"
                            className="browser-default"
                            ref="memory"
                            value={this.state.selectedMemory}
                            placeholder="240000"
                            onChange={this.handleMemoryChange}
                          />
                          {this.state.errors.memory ? (
                            <div className="field-error">
                              {this.state.errors.memory}
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
                              Alignment Config Name. i.e. 2018-02-15
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
                            placeholder="2018-02-15"
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
                              Branch of idseq-pipeline to be used for processing
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
                  </div>
                ) : null}
                <div className="field">
                  {termsBlurb}
                  <div className="row">
                    <div className="col no-padding s12">
                      {this.state.successMessage ? (
                        <div className="form-feedback success-message">
                          <i className="fa fa-check-circle-o" />{" "}
                          <span>{this.state.successMessage}</span>
                        </div>
                      ) : null}
                      {this.state.errorMessage ? (
                        <div className="form-feedback error-message">
                          {this.state.errorMessage}
                        </div>
                      ) : null}
                      {submitButton}
                      <button
                        type="button"
                        onClick={() => window.history.back()}
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
    return <div>{this.renderSampleForm(this.props.selectedSample)}</div>;
  }
}
export default SampleUpload;
