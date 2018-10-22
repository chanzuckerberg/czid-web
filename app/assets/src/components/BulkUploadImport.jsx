import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import $ from "jquery";
import Tipsy from "react-tipsy";
import SampleUpload from "./SampleUpload";
import ObjectHelper from "../helpers/ObjectHelper";

class BulkUploadImport extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.hostGenomes = props.host_genomes || [];
    this.hostName = this.hostGenomes.length ? this.hostGenomes[0].name : "";
    this.hostId = this.hostGenomes.length ? this.hostGenomes[0].id : null;
    this.handleImportSubmit = this.handleImportSubmit.bind(this);
    this.handleUploadSubmit = this.handleUploadSubmit.bind(this);
    this.csrf = props.csrf;
    this.handleProjectSubmit = this.handleProjectSubmit.bind(this);
    this.clearError = this.clearError.bind(this);
    this.handleProjectChange = this.handleProjectChange.bind(this);
    this.handleProjectChangeForSample = this.handleProjectChangeForSample.bind(
      this
    );
    this.handleHostChange = this.handleHostChange.bind(this);
    this.handleHostChangeForSample = this.handleHostChangeForSample.bind(this);
    this.handleBulkPathChange = this.handleBulkPathChange.bind(this);
    this.selectSample = this.selectSample.bind(this);
    this.toggleNewProjectInput = this.toggleNewProjectInput.bind(this);
    this.adminGenomes = this.hostGenomes.map(g => {
      return g.name.toLowerCase().indexOf("test") >= 0 ? g.name : "";
    });
    this.userDetails = props.loggedin_user;
    this.toggleCheckBox = this.toggleCheckBox.bind(this);
    this.state = {
      submitting: false,
      allProjects: props.projects || [],
      hostGenomes: this.hostGenomes || [],
      invalid: false,
      errorMessage: "",
      imported: false,
      success: false,
      successMessage: "",
      hostName: this.hostName,
      hostId: this.hostId,
      project: "Select a Project",
      projectId: null,
      selectedBulkPath: "",
      samples: [],
      selectedSampleIndices: [],
      createdSampleIds: [],
      allChecked: false,
      disableProjectSelect: false,
      errors: {},
      serverErrors: null,
      publicChecked: false,
      consentChecked: false
    };
  }
  componentDidUpdate() {
    $(".custom-select-dropdown").dropdown({
      belowOrigin: true
    });
  }

  componentDidMount() {
    $("body").addClass("background-cover");
    this.initializeSelectTag();
    $(ReactDOM.findDOMNode(this.refs.projectSelect)).on(
      "change",
      this.handleProjectChange
    );
    $(ReactDOM.findDOMNode(this.refs.hostSelect)).on(
      "change",
      this.handleHostChange
    );
    this.initializeSelectTag();
    this.initializeSelectAll();
  }

  toggleNewProjectInput(e) {
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

  selectSample(e) {
    this.setState({
      allChecked: false
    });
    // current array of options
    const sampleList = this.state.selectedSampleIndices;

    let index;

    // check if the check box is checked or unchecked
    if (e.target.checked) {
      // add the numerical value of the checkbox to options array
      sampleList.push(+e.target.id);
    } else {
      // or remove the value from the unchecked checkbox from the array
      index = sampleList.indexOf(+e.target.id);
      sampleList.splice(index, 1);
    }

    // update the state with the new array of options
    this.setState({ selectedSampleIndices: sampleList });
  }

  initializeSelectAll() {
    $(".checkAll").click(e => {
      const checkedStatus = e.target.checked;
      this.setState(
        {
          allChecked: checkedStatus
        },
        () => {
          $("input:checkbox")
            .not(this)
            .prop("checked", this.state.allChecked);
          $(".sample-box").each((id, element) => {
            let sampleList = this.state.selectedSampleIndices;
            if (this.state.allChecked) {
              if (sampleList.indexOf(id) === -1) {
                sampleList.push(+id);
              }
            } else {
              sampleList = [];
            }
            this.setState({ selectedSampleIndices: sampleList });
          });
        }
      );
    });
  }

  handleUploadSubmit(e) {
    e.preventDefault();
    $("html, body")
      .stop()
      .animate({ scrollTop: 0 }, 200, "swing", () => {
        this.clearError();
      });
    if (!this.isUploadFormInvalid()) {
      this.setState({
        submitting: true
      });
      this.bulkUploadSubmit();
    }
  }

  handleImportSubmit(e) {
    e.preventDefault();
    this.clearError();
    if (!this.isImportFormInvalid()) {
      this.setState({
        submitting: true
      });
      this.bulkUploadImport();
    }
  }

  initializeSelectTag() {
    $("select").material_select();
  }

  clearError() {
    this.setState({
      invalid: false,
      success: false
    });
  }

  gotoPage(path) {
    location.href = `${path}`;
  }

  toggleCheckBox(e) {
    this.setState({
      [e.target.id]: e.target.value == "true" ? false : true
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
            project: response.data.name,
            projectId: response.data.id,
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
          errorMessage: "Project exists already or is invalid"
        });
      });
  }

  isProjectInvalid() {
    if (
      this.refs.new_project.value === "" &&
      this.state.project === "Select a project"
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

  bulkUploadImport() {
    var that = this;
    axios
      .get("/samples/bulk_import.json", {
        params: {
          project_id: this.state.projectId,
          host_genome_id: this.state.hostId,
          bulk_path: this.state.selectedBulkPath,
          authenticity_token: this.csrf
        }
      })
      .then(response => {
        that.setState({
          submitting: false,
          success: true,
          successMessage: "Samples imported. Pick the ones you want to submit.",
          samples: response.data.samples,
          imported: true
        });
        that.initializeSelectTag();
        that.initializeSelectAll();
      })
      .catch(error => {
        that.setState({
          submitting: false,
          invalid: true,
          errorMessage: error.response.data.status || "Something went wrong",
          serverErrors: error.response.data
        });
      });
  }

  bulkUploadSubmit() {
    var that = this;
    var samples = [];
    this.state.selectedSampleIndices.map(idx => {
      samples.push(this.state.samples[idx]);
    });
    axios
      .post("/samples/bulk_upload.json", {
        samples: samples,
        authenticity_token: this.csrf
      })
      .then(response => {
        that.setState({
          success: true,
          successMessage: "Samples created. Redirecting...",
          createdSampleIds: response.data.sample_ids
        });
        setTimeout(() => {
          that.setState({
            submitting: false
          });
          that.gotoPage(`/home?project_id=${that.state.projectId}`);
        }, 2000);
      })
      .catch(error => {
        that.setState({
          submitting: false,
          invalid: true,
          errorMessage:
            error.response.data.status ||
            "Unable to process sample(s), " +
              "ensure sample is not a duplicate in the selected project",
          serverErrors: error.response.data
        });
      });
  }

  filePathValid(str) {
    var regexPrefix = /s3:\/\//;
    if (str.match(regexPrefix)) {
      return true;
    } else {
      return false;
    }
  }

  isImportFormInvalid() {
    const errors = {};
    if (this.state.project) {
      if (this.state.project.toLowerCase() === "select a project") {
        errors.project = "Please select a project";
      }
    } else {
      errors.project = "Please select a project";
    }
    if (this.refs.bulk_path) {
      if (this.refs.bulk_path.value === "") {
        errors.bulk_path = "Please fill in the S3 bulk path";
      } else if (!this.filePathValid(this.refs.bulk_path.value)) {
        errors.bulk_path = "S3 bulk path is invalid";
      }
    } else {
      errors.bulk_path = "Please fill in the S3 bulk path";
    }
    const errorsLength = Object.keys(errors).length;
    this.setState({
      invalid: errorsLength > 0,
      errors
    });
    return errorsLength;
  }

  isUploadFormInvalid() {
    if (!this.state.selectedSampleIndices.length) {
      this.setState({
        invalid: true,
        errorMessage: "Please select desired samples"
      });
      return true;
    }
    return false;
  }

  handleProjectChange(e) {
    let projectId;
    if (e.target.selectedIndex > 0) {
      projectId = this.state.allProjects[e.target.selectedIndex - 1].id;
    }
    this.setState({
      project: e.target.value.trim(),
      projectId: projectId
    });
    this.clearError();
  }

  handleProjectChangeForSample(samplesId, projectId, element) {
    const selectedSampleElement = $(element.target);
    selectedSampleElement
      .parent()
      .prev()
      .html(
        `${selectedSampleElement.text()} <i class='fa fa-caret-down right' />`
      );
    // updating the label for slected project
    const samples = this.state.samples;
    samples[samplesId].project_id = this.state.allProjects[projectId].id;
    this.setState({
      samples: samples
    });
    this.clearError();
  }

  handleHostChangeForSample(samplesId, hostGenomeId, element) {
    const selectedSampleElement = $(element.target);
    selectedSampleElement
      .parent()
      .prev()
      .html(
        `
      <div>
        <div class='genome-icon'>
          ${SampleUpload.resolveGenomeIcon(
            selectedSampleElement.text(),
            "#59bcd6"
          ) || selectedSampleElement.text()}
        </div>
        <i class='fa fa-caret-down' />
      </div>
      `
      );
    const samples = this.state.samples;
    samples[samplesId].host_genome_id = this.state.hostGenomes[hostGenomeId].id;
    this.setState({
      samples: samples
    });
    this.clearError();
  }

  displayError(failedStatus, serverError, formattedError) {
    if (failedStatus) {
      return serverError instanceof Array ? (
        serverError.map((error, i) => {
          return <p key={i}>{error}</p>;
        })
      ) : (
        <p>{formattedError}</p>
      );
    } else {
      return null;
    }
  }

  handleHostChange(hostId, hostName) {
    this.setState({ hostName, hostId });
    this.clearError();
  }

  handleBulkPathChange(e) {
    this.setState({
      selectedBulkPath: e.target.value.trim()
    });
  }

  renderBulkUploadSubmitForm() {
    return (
      <div id="samplesUploader" className="row">
        <div className="col s8 offset-s2 upload-form-container">
          <div className="content">
            <div>
              <div className="form-title">Batch Upload</div>
              <div className="upload-info">
                Select which files you want to run through the pipeline.
              </div>
              <form
                className="bulkSubmitForm"
                ref="form"
                onSubmit={this.handleUploadSubmit}
              >
                {this.state.success ? (
                  <div className="form-feedback success-message">
                    <i className="fa fa-check-circle-o" />{" "}
                    <span>{this.state.successMessage}</span>
                  </div>
                ) : null}
                {this.state.invalid ? (
                  <div className="form-feedback error-message">
                    {this.displayError(
                      this.state.invalid,
                      this.state.serverErrors,
                      this.state.errorMessage
                    )}
                  </div>
                ) : null}
                <div className="fields">
                  <div className="row">
                    <div className="row header">
                      <div className="col s5 no-padding">
                        <input
                          type="checkbox"
                          checked={this.state.allChecked}
                          id="checkAll"
                          className="filled-in checkAll"
                          onChange={this.initializeSelectAll()}
                        />
                        <label htmlFor="checkAll">Sample Name</label>
                      </div>
                      <div className="col s3 no-padding">Host</div>
                      <div className="col s4 no-padding">Project</div>
                    </div>
                    <div className="divider" />
                    <br />
                    {this.state.samples.map((sample, i) => {
                      return (
                        <div className="row field-row sample-row" key={i}>
                          <p className="col s5 sample-names no-padding">
                            <input
                              ref="samples_list"
                              type="checkbox"
                              id={i}
                              className="filled-in sample-box"
                              value={
                                this.state.selectedSampleIndices.indexOf(i) < 0
                                  ? 0
                                  : 1
                              }
                              onChange={this.selectSample}
                            />
                            <label htmlFor={i}> {sample.name}</label>
                          </p>
                          <div className="col s3 no-padding">
                            <div
                              className="custom-select-dropdown select-dropdown genome-select"
                              data-activates={`genome-dropdown${i}`}
                            >
                              <div>
                                <div
                                  className="genome-icon"
                                  dangerouslySetInnerHTML={{
                                    __html: SampleUpload.resolveGenomeIcon(
                                      this.state.hostName,
                                      "#59bcd6"
                                    )
                                  }}
                                />
                                <i className="fa fa-caret-down" />
                              </div>
                            </div>
                            <ul
                              id={`genome-dropdown${i}`}
                              className="dropdown-content genomes"
                            >
                              {this.state.hostGenomes.map((host_genome, j) => {
                                if (
                                  this.adminGenomes.indexOf(host_genome.name) <
                                    0 ||
                                  this.userDetails.admin
                                ) {
                                  return (
                                    <li
                                      onClick={e => {
                                        this.handleHostChangeForSample(i, j, e);
                                      }}
                                      ref="genome"
                                      key={j}
                                      value={host_genome.id}
                                    >
                                      {host_genome.name}
                                    </li>
                                  );
                                }
                              })}
                              {!this.state.hostGenomes.length ? (
                                <li>No host genomes to display</li>
                              ) : (
                                ""
                              )}
                            </ul>
                          </div>
                          <div className="col s4 no-padding">
                            <div
                              className="custom-select-dropdown"
                              data-activates={`project-dropdown${i}`}
                            >
                              {this.state.project}
                              <i className="fa fa-caret-down right" />
                            </div>
                            <ul
                              id={`project-dropdown${i}`}
                              className="dropdown-content"
                            >
                              {this.state.allProjects.length ? (
                                ObjectHelper.sortByKey(
                                  this.state.allProjects,
                                  "name"
                                ).map((project, j) => {
                                  return (
                                    <li
                                      onClick={e => {
                                        this.handleProjectChangeForSample(
                                          i,
                                          j,
                                          e
                                        );
                                      }}
                                      ref="project"
                                      key={j}
                                      value={project.id}
                                    >
                                      {project.name}
                                    </li>
                                  );
                                })
                              ) : (
                                <li>No projects to display</li>
                              )}
                            </ul>
                          </div>
                          <div className="col s12" />
                        </div>
                      );
                    })}
                  </div>
                  <div className="field">
                    <div className="row">
                      <div className="col no-padding s12">
                        {this.state.submitting ? (
                          <button
                            type="button"
                            disabled
                            className="new-button blue-button upload-samples-button"
                          >
                            <i className="fa fa-spinner fa-spin fa-lg" />
                          </button>
                        ) : (
                          <button
                            type="submit"
                            onClick={this.handleUploadSubmit}
                            className="new-button blue-button upload-samples-button"
                          >
                            Run Samples
                          </button>
                        )}
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
      </div>
    );
  }

  renderBulkUploadImportForm() {
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
        onClick={this.handleImportSubmit}
      >
        {this.state.submitting ? (
          <i className="fa fa-spinner fa-spin fa-lg" />
        ) : (
          "Upload Samples"
        )}
      </button>
    );

    return (
      <div id="samplesUploader" className="row">
        <div className="col s6 offset-s3 upload-form-container">
          <div className="content">
            <div>
              <div className="form-title">Batch Upload</div>
              <div className="upload-info">
                Upload multiple files at one time to be processed through the
                IDseq pipeline.
              </div>
            </div>
            <div>
              <p className="upload-question">
                Only want to upload one sample?{" "}
                <a href="/samples/new">Click here.</a>
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
            <form ref="form" onSubmit={this.handleUpload}>
              <div className="fields">
                <div className="field">
                  <div className="row">
                    <div className="col field-title no-padding s12">
                      Project
                    </div>
                  </div>
                  <div className="row input-row">
                    <Tipsy
                      content="Name of experiment or project"
                      position="top"
                    >
                      <div
                        className="col project-list no-padding s8"
                        data-delay="50"
                      >
                        <select
                          ref="projectSelect"
                          disabled={
                            this.state.disableProjectSelect ? "disabled" : ""
                          }
                          className="projectSelect"
                          id="sample"
                          onChange={this.handleProjectChange}
                          value={this.state.project}
                        >
                          <option disabled defaultValue>
                            {this.state.project}
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
                        {this.state.errors.project ? (
                          <div className="field-error">
                            {this.state.errors.project}
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
                          data-delay="50"
                        >
                          <i className="fa fa-plus" />
                          <span>New project</span>
                        </button>
                      </Tipsy>
                    </div>
                    <div className="col no-padding s12 new-project-input hidden">
                      <input
                        type="text"
                        ref="new_project"
                        onFocus={this.clearError}
                        className="browser-default"
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
                    <div className="col no-padding 12 new-project-input public_access hidden">
                      <input
                        ref="publicChecked"
                        type="checkbox"
                        name="switch"
                        id="publicChecked"
                        className="col s8 filled-in"
                        onChange={this.toggleCheckBox}
                        value={this.state.publicChecked}
                      />
                      <label htmlFor="publicChecked" className="checkbox">
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
                        {this.state.hostGenomes.map(g => {
                          if (
                            this.adminGenomes.indexOf(g.name) > 0 &&
                            this.userDetails.admin
                          ) {
                            return (
                              <div
                                key={g.id}
                                className={`${
                                  this.state.hostName === g.name ? "active" : ""
                                } genome-label`}
                                id={g.name}
                                onClick={() =>
                                  this.handleHostChange(g.id, g.name)
                                }
                              >
                                {g.name}
                              </div>
                            );
                          }
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
                                this.state.hostName === g.name ? "active" : ""
                              } `}
                              id={g.name}
                              onClick={() =>
                                this.handleHostChange(g.id, g.name)
                              }
                            >
                              {this.state.hostName === g.name ? (
                                <div
                                  className="img-container"
                                  dangerouslySetInnerHTML={{
                                    __html: SampleUpload.resolveGenomeIcon(
                                      g.name,
                                      "#f2f6ee"
                                    )
                                  }}
                                />
                              ) : (
                                <div
                                  className="img-container"
                                  dangerouslySetInnerHTML={{
                                    __html: SampleUpload.resolveGenomeIcon(
                                      g.name,
                                      "#95A1Ab"
                                    )
                                  }}
                                />
                              )}
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
                      {this.state.errors.hostName ? (
                        <div className="field-error">
                          {this.state.errors.hostName}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="field">
                  <div className="row">
                    <div className="col no-padding s12">
                      <div className="field-title">
                        <div className="read-count-label">
                          Path to Samples Folder<br />
                          <i className="validation-info">
                            Files in folder must have one of the following
                            extensions to be considered:<br />
                            fastq.gz / fq.gz / fastq / fq / fasta.gz / fa.gz /
                            fasta / fa.<br />
                            Paired files must be labeled {'"_R1" or "_R2"'} at
                            the end of the basename.
                          </i>
                        </div>
                        <div className="example-link">
                          Example:
                          s3://czbiohub-seqbot/fastqs/171018_NB501961_0022_AHL2TVBGX3/rawdata
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row input-row">
                    <div className="col no-padding s12">
                      <input
                        onChange={this.handleBulkPathChange}
                        onFocus={this.clearError}
                        type="text"
                        ref="bulk_path"
                        className="browser-default"
                        placeholder="s3://aws/path-to-sample-folder"
                      />
                      {this.state.errors.bulk_path ? (
                        <div className="field-error">
                          {this.state.errors.bulk_path}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="upload-notes">
                  <div>
                    - Please ensure that IDseq has permissions to read/list your
                    S3 bucket or ask our team for help.
                  </div>
                  <div>
                    - Also convert links like
                    "https://s3-us-west-2.amazonaws.com/czbiohub-seqbot/fastqs/171018_NB501961_0022_AHL2TVBGX3/rawdata"
                    to the format
                    "s3://czbiohub-seqbot/fastqs/171018_NB501961_0022_AHL2TVBGX3/rawdata"
                  </div>
                </div>
                {termsBlurb}
                <div className="field">
                  <div className="row">
                    <div className="col no-padding s12">
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
    return (
      <div>
        {this.state.imported ? this.renderBulkUploadSubmitForm() : null}
        {!this.state.imported ? this.renderBulkUploadImportForm() : null}
      </div>
    );
  }
}

export default BulkUploadImport;
