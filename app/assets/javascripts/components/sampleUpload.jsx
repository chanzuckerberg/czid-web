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
    this.handleQueueChange = this.handleQueueChange.bind(this);
    this.handleMemoryChange = this.handleMemoryChange.bind(this);
    this.handleResultChange = this.handleResultChange.bind(this);
    this.projects = props.projects || [];
    this.project = props.projectInfo || '';
    this.hostGenomes = props.host_genomes || [];
    this.sample = props.selectedSample || '';
    this.userDetails = props.loggedin_user;
    this.selected = {
      name: this.sample.name || '',
      hostGenome: this.sample ? this.sample.host_genome_name : this.hostGenomes[0].name,
      hostGenomeId: this.sample ? this.sample.host_genome_id : this.hostGenomes[0].id,
      project: this.project ? this.project.name : 'Select a project',
      projectId: this.project ? this.project.id : null,
      resultPath: this.sample ? this.sample.s3_preload_result_path : '',
      jobQueue: this.sample ? this.sample.job_queue : '',
      memory: this.sample ? this.sample.sample_memory : '',
      id: this.sample.id || '',
      inputFiles: props.inputFiles && props.inputFiles.length ? props.inputFiles : [],
      status: this.sample.status
    };
    this.firstInput = this.selected.inputFiles.length && this.selected.inputFiles[0] ? (this.selected.inputFiles[0].source === null ? '' : this.selected.inputFiles[0].source) : '',
    this.secondInput = this.selected.inputFiles.length && this.selected.inputFiles[1] ? (this.selected.inputFiles[1].source === null ? '' : this.selected.inputFiles[1].source) : '',
    this.state = {
      submitting: false,
      allProjects: this.projects || [],
      hostGenomes: this.hostGenomes || [],
      invalid: false,
      errorMessage: '',
      success: false,
      successMessage: '',
      serverErrors: [],
      selectedName: this.selected.name || '',
      selectedHostGenome: this.selected.hostGenome || '',
      selectedHostGenomeId: this.selected.hostGenomeId || null,
      selectedProject: this.selected.project || '',
      selectedPId: this.selected.projectId || null,
      selectedResultPath: this.selected.resultPath || '',
      selectedJobQueue: this.selected.jobQueue || '',
      selectedMemory: this.selected.memory || '',
      id: this.selected.id,
    };
  }

  componentDidMount() {
    this.initializeSelectTag();
    $(ReactDOM.findDOMNode(this.refs.projectSelect)).on('change',this.handleProjectChange);
    $(ReactDOM.findDOMNode(this.refs.hostSelect)).on('change',this.handleHostChange);
  }

  handleUpload(e) {
    e.preventDefault();
    e.target.disabled = true;
    this.clearError();
    if(!this.isFormInvalid()) {
      this.createSample()
    }
  }

  handleUpdate(e) {
    e.preventDefault();
    e.target.disabled = true;
    this.clearError();
    if(!this.isUpdateFormInvalid()) {
      this.updateSample()
    }
  }

  initializeSelectTag() {
    $('select').material_select();
  }

  clearError() {
    this.setState({
      invalid: false,
      success: false
     })
  }

  gotoPage(path) {
    location.href = `${path}`
  }


  handleProjectSubmit(e) {
    e.preventDefault();
    this.clearError();
    if(!this.isProjectInvalid()) {
      this.addProject()
    }
  }

  addProject() {
    var that = this;
    axios.post('/projects.json', {
      project: {
        name: this.refs.new_project.value
      },
      authenticity_token: this.csrf
    })
    .then((response) => {
      var newProjectList = that.state.allProjects.slice();
      newProjectList.push(response.data);
      that.setState({
        allProjects: newProjectList,
        selectedProject: response.data.name,
        selectedPId: response.data.id,
        success: true,
        successMessage: 'Project added successfully'
      }, () => {
        this.refs.new_project.value = '';
        that.initializeSelectTag();
      });
    })
    .catch((error) => {
      that.setState({
        invalid: true,
        errorMessage: 'Project exists already or is invalid',
      })
    });
  }

  isProjectInvalid() {
    if (this.refs.new_project.value === '' && this.state.selectedProject === 'Select a project') {
      this.setState({
        invalid: true,
        errorMessage: 'Please enter valid project name'
      })
      return true;
    } else {
      return false;
    }
  }

  createSample() {
    var that = this;
    that.setState({
      submitting: true
    })
    axios.post('/samples.json', {
      sample: {
        name: this.refs.name.value.trim(),
        project_name: this.state.selectedProject.trim(),
        project_id: this.state.selectedPId,
        input_files_attributes: [{source_type: 's3', source: this.refs.first_file_source.value.trim() },
        {source_type: 's3', source: this.refs.second_file_source.value.trim() }],
        s3_preload_result_path: this.refs.s3_preload_result_path.value.trim(),
        job_queue: this.state.selectedJobQueue,
        sample_memory: this.state.selectedMemory,
        host_genome_id: this.state.selectedHostGenomeId,
        status: 'created'
      },
      authenticity_token: this.csrf
    })
    .then((response) => {
      that.setState({
        success: true,
        submitting: false,
        successMessage: 'Sample created successfully'
      });
      setTimeout(() => {
        that.gotoPage(`/samples/${response.data.id}`);
      }, 2000)
    })
    .catch((error) => {
      that.setState({
        invalid: true,
        submitting: false,
        serverErrors: error.response.data,
        errorMessage: 'Something went wrong'
      })
    });
  }


  updateSample() {
    var that = this;
    that.setState({
      submitting: true
    })
    axios.put(`/samples/${this.state.id}.json`, {
      sample: {
        name: this.state.selectedName,
        project: this.state.selectedProject,
        project_id: this.state.selectedPId,
        s3_preload_result_path: this.state.selectedResultPath,
        job_queue: this.state.selectedJobQueue,
        sample_memory: this.state.selectedMemory,
        host_genome_id: this.state.selectedHostGenomeId
      },
      authenticity_token: this.csrf
    })
    .then((response) => {
      that.setState({
        success: true,
        submitting: false,
        successMessage: 'Sample updated successfully'
      });
      setTimeout(() => {
        that.gotoPage(`/samples/${that.state.id}`);
      }, 2000);
    })
    .catch((error) => {
     that.setState({
      submitting: false,
      invalid: true,
      serverErrors: error.response.data,
      errorMessage: 'Failed to upload sample'
     });
    });
  }

  filePathValid(str, read) {
    if (read == 2 && str === '') {
      return true;
    }
    var regexPrefix = /s3:\/\//;
    var regexSuffix = /(\.fastq|\.fastq.gz|\.fasta|\.fasta.gz)/igm;
    if (str.match(regexPrefix) && str.match(regexSuffix)) {
      return true;
    } else {
      return false;
    }
  }

  isUpdateFormInvalid() {
    if (this.state.selectedName === '' && this.state.selectedProject === 'Select a Project' && this.state.selectedHostGenome === '') {
      this.setState({
        invalid: true,
        errorMessage: 'Please fill in name, host genome and select a project'
      })
      return true;
    } else if (this.state.selectedName === '') {
        this.setState({
          invalid: true,
          errorMessage: 'Please fill in Sample name'
        })
        return true;
    } else if (this.state.selectedProject === 'Select a Project') {
        this.setState({
          invalid: true,
          errorMessage: 'Please select a project'
        })
        return true;
    } else if (this.state.selectedHostGenome === '') {
      this.setState({
        invalid: true,
        errorMessage: 'Please select a host genome'
      })
      return true;
    }
    else {
      return false;
    }
  }

  isFormInvalid() {
    if (this.refs.name.value === '' && this.state.selectedProject === 'Select a Project' && this.refs.first_file_source.value === '' && this.refs.second_file_source.value === '' && this.state.selectedHostGenome === '') {
      this.setState({
        invalid: true,
        errorMessage: 'Please fill in all required fields'
      })
      return true;
    } else if (this.refs.name.value === '') {
        this.setState({
          invalid: true,
          errorMessage: 'Please fill in Sample name'
        })
        return true;
    } else if (this.state.selectedProject === 'Select a Project') {
        this.setState({
          invalid: true,
          errorMessage: 'Please select a project'
        })
        return true;
    } else if (this.state.selectedHostGenome === '') {
      this.setState({
        invalid: true,
        errorMessage: 'Please select a host genome'
      })
      return true;
    }
    else if (this.refs.first_file_source.value === '') {
        this.setState({
          invalid: true,
          errorMessage: 'Please fill in first read file path'
        })
        return true;
    } else if ( !this.filePathValid(this.refs.first_file_source.value, 1)) {
        this.setState({
          invalid: true,
          errorMessage: 'Please fill in a valid file path for Read 1, Sample format for path can be found below'
        })
        return true;
    } else if ( !this.filePathValid(this.refs.second_file_source.value, 2)) {
      this.setState({
        invalid: true,
        errorMessage: 'Please fill in a valid file path for Read 2, Sample format for path can be found below'
      })
      return true;
    }
    return false;
  }

  handleProjectChange(e) {
    this.setState({
      selectedProject: e.target.value.trim(),
      selectedPId: this.state.allProjects[e.target.selectedIndex].id
    })
    this.clearError();
  }


  handleHostChange(e) {
    this.setState({
      selectedHostGenome: e.target.value.trim(),
      selectedHostGenomeId: this.state.hostGenomes[e.target.selectedIndex].id
    })
    this.clearError();
  }

  handleQueueChange(e) {
    this.setState({
      selectedJobQueue: e.target.value.trim()
    })
    this.clearError();
  }

  handleMemoryChange(e) {
    this.setState({
      selectedMemory: e.target.value.trim()
    })
    this.clearError();
  }

  handleNameChange(e) {
    this.setState({
      selectedName: e.target.value.trim(),
    })
  }

  handleResultChange(e) {
    this.setState({
      selectedResultPath: e.target.value.trim()
    })
  }

  displayError(failedStatus, serverError, formattedError) {
    if (failedStatus) {
      return serverError.length ? serverError.map((error, i) => {
        return <p className="error center-align" key={i}>{error}</p>
      }) : <span>{formattedError}</span>
    } else {
      return null
    }
  }

  renderUpdateForm() {
    return (
      <div className="form-wrapper">
        <form ref="form" onSubmit={ this.handleUpdate } >
          <div className="row title">
            <p className="col s6 signup">Sample Update</p>
          </div>
          {this.state.success ? <div className="success-info" >
            <i className="fa fa-success"></i>
              <span>{this.state.successMessage}</span>
            </div> : null }
          <div className={this.state.invalid ? 'error-info' : ''} >{ this.displayError(this.state.invalid, this.state.serverErrors, this.state.errorMessage) }</div>
          <div className="row content-wrapper">
            <div className="row field-row">
              <div className="col s6 input-field name">
                <input ref= "name" type="text" className="" onFocus={ this.clearError } onChange= { this.handleNameChange } value= { this.state.selectedName }  />
              </div>
              <div className="col s6 input-field genome-list">
                  <select ref="hostSelect" name="host" className="" id="host" onChange={ this.handleHostChange } value={this.state.selectedHostGenome}>
                      { this.state.hostGenomes.length ?
                          this.state.hostGenomes.map((host, i) => {
                            return <option ref= "host" key={i} id={host.id} >{host.name}</option>
                          }) : <option>No host genomes to display</option>
                        }
                  </select>
                  <label>Host Genomes</label>
                </div>
            </div>
              <div className="row field-row">
                <div className="input-field col s6 project-list">
                   <select ref="projectSelect" className="" onChange={ this.handleProjectChange } value={this.state.selectedProject} id="sample">
                    <option disabled defaultValue>{this.state.selectedProject}</option>
                   { this.state.allProjects.length ?
                      this.state.allProjects.map((project, i) => {
                        return <option ref= "project" key={i} id={project.id} >{project.name}</option>
                      }) : <option>No projects to display</option>
                    }
                  </select>
                  <label>Project List</label>
              </div>
                <div className="input-field col s6">
                    <div className="row">
                      <input className="col s11 project-input" ref= "new_project" type="text" onFocus={ this.clearError } placeholder="Add a project if desired project is not on the list" />
                      <input className="col s1 add-icon" value="&#xf067;" type="button" onClick={ this.handleProjectSubmit } />
                    </div>
                    <label htmlFor="new_project">Project</label>
                </div>
              </div>
              <div className="field-row input-field align">
                <i className="sample fa fa-link" aria-hidden="true"></i>
                <input ref= "first_file_source" type="text" className="no-edit" onFocus={ this.clearError } placeholder="Required" value={ this.firstInput } readOnly/>
                <label htmlFor="sample_first_file_source">Read 1 fastq s3 path</label>
              </div>
              <div className="field-row input-field align" >
                <i className="sample fa fa-link" aria-hidden="true"></i>
                <input ref= "second_file_source" type="text" className="no-edit" onFocus={ this.clearError } placeholder="Required" value={ this.secondInput } readOnly/>
                <label htmlFor="sample_second_file_source">Read 2 fastq s3 path</label>
              </div>
              <div className="row field-row">
                <div className={ this.userDetails.admin ? "col s4 input-field" : "col s12 input-field"}>
                  <i className="sample fa fa-folder" aria-hidden="true"></i>
                  <input ref= "s3_preload_result_path" type="text" className="no-edit" onChange={ this.handleResultChange }  onFocus={ this.clearError } readOnly placeholder="Optional" value={ this.state.selectedResultPath }/>
                  <label htmlFor="sample_s3_preload_result_path">Preload results path (s3 only)</label>
                </div>
                { this.userDetails.admin ? <div className="col s4 input-field">
                  <i className="sample fa fa-file" aria-hidden="true"></i>
                  <input ref= "job_queue" type="text" className="" onFocus={ this.clearError } placeholder="Optional" value={this.state.selectedJobQueue} onChange={ this.handleQueueChange } />
                  <label htmlFor="sample_job_queue">Job queue</label>
                </div> : null }
                { this.userDetails.admin ? <div className="col s4 input-field">
                  <i className="sample fa fa-file" aria-hidden="true"></i>
                  <input ref= "memory" type="text" className="" value={this.state.selectedMemory} onFocus={ this.clearError } placeholder="Optional" onChange={ this.handleMemoryChange } />
                  <label htmlFor="sample_memory">Sample memory (in mbs)</label>
                </div> : null }
            </div>
        </div>
        <input className="hidden" type="submit"/>
        { this.state.submitting ? <div className="center login-wrapper disabled"> <i className='fa fa-spinner fa-spin fa-lg'></i> </div> : 
          <div onClick={ this.handleUpdate } className="center login-wrapper">Submit</div> }
      </form>
    </div>
    )
  }

  renderSampleForm() {
    return (
      <div className="form-wrapper">
        <form ref="form" onSubmit={ this.handleUpload }>
          <div className="row title">
            <p className="col s6 signup">Sample Upload</p>
            <span onClick={ this.gotoPage.bind(this, '/samples/bulk_new') } className="single">To upload multiple samples, click here</span>
          </div>
          { this.state.success ? <div className="success-info" >
                <i className="fa fa-success"></i>
                 <span>{this.state.successMessage}</span>
                </div> : null }
          <div className={this.state.invalid ? 'error-info' : ''} >{ this.displayError(this.state.invalid, this.state.serverErrors, this.state.errorMessage) }</div>
          <div className="row content-wrapper">
            <div className="row field-row">
              <div className="col s6 input-field name">
                <input ref= "name" type="text" className="" onFocus={ this.clearError }  />
                <label>Sample name</label>
              </div>
              <div className="col s6 input-field genome-list">
                  <select ref="hostSelect" name="host" className="" id="host" onChange={ this.handleHostChange } value={this.state.selectedHostGenome}>
                      { this.state.hostGenomes.length ?
                          this.state.hostGenomes.map((host, i) => {
                            return <option ref= "host" key={i} id={host.id} >{host.name}</option>
                          }) : <option>No host genomes to display</option>
                        }
                  </select>
                  <label>Host Genomes</label>
                </div>
            </div>
              <div className="row field-row">
                <div className="input-field col s6 project-list">
                   <select ref="projectSelect" className="" id="sample" onChange={ this.handleProjectChange } value={this.state.selectedProject}>
                    <option disabled defaultValue>{this.state.selectedProject}</option>
                   { this.state.allProjects.length ?
                      this.state.allProjects.map((project, i) => {
                        return <option ref= "project" key={i} id={project.id} >{project.name}</option>
                      }) : <option>No projects to display</option>
                    }
                  </select>
                  <label>Project List</label>
              </div>
                <div className="input-field col s6">
                    <div className="row">
                      <input className="col s11 project-input" ref= "new_project" type="text" onFocus={ this.clearError } placeholder="Add a project if desired project is not on the list" />
                      <input className="col s1 add-icon" value="&#xf067;" type="button" onClick={ this.handleProjectSubmit } />
                    </div>
                    <label htmlFor="new_project">Project</label>
                </div>
              </div>
              <div className="field-row input-field align">
                <i className="sample fa fa-link" aria-hidden="true"></i>
                <input ref= "first_file_source" type="text" className="path" onFocus={ this.clearError } placeholder="Required" />
                <span className="path_label">Example: s3://czbiohub-infectious-disease/RR004/RR004_water_2_S23/RR004_water_2_S23_R1_001.fastq.gz</span>
                <label htmlFor="sample_first_file_source">Read 1 s3 path (accepted formats: .fastq, .fastq.gz, .fasta, .fasta.gz)</label>
              </div>
              <div className="field-row input-field align" >
                <i className="sample fa fa-link" aria-hidden="true"></i>
                <input ref= "second_file_source" type="text" className="path" onFocus={ this.clearError } placeholder="Required" />
                <span className="path_label">Example: s3://czbiohub-infectious-disease/RR004/RR004_water_2_S23/RR004_water_2_S23_R2_001.fastq.gz</span>
                <label htmlFor="sample_second_file_source">Read 2 s3 path (same format as Read 1 s3 path)</label>
              </div>
              <div className="row field-row">
                <div className={ this.userDetails.admin ? "col s4 input-field" :  "col s12 input-field" }>
                  <i className="sample fa fa-folder" aria-hidden="true"></i>
                  <input ref= "s3_preload_result_path" type="text" className="path" onFocus={ this.clearError } placeholder="Optional" />
                  <span className="path_label">Example: s3://yunfang-workdir/id-rr004/RR004_water_2_S23/</span>
                  <label htmlFor="sample_s3_preload_result_path">Preload results path (s3 only)</label>
                </div>
                { this.userDetails.admin ? <div className="col s4 input-field">
                  <i className="sample fa fa-file" aria-hidden="true"></i>
                  <input ref= "job_queue" type="text" className="" onFocus={ this.clearError } placeholder="Optional" value={this.state.selectedJobQueue} onChange={ this.handleQueueChange } />
                  <label htmlFor="sample_job_queue">Job queue</label>
                </div> : null }
                { this.userDetails.admin ? <div className="col s4 input-field">
                  <i className="sample fa fa-file" aria-hidden="true"></i>
                  <input ref= "memory" type="text" className="" value={this.state.selectedMemory} onFocus={ this.clearError } placeholder="Optional" onChange={ this.handleMemoryChange } />
                  <label htmlFor="sample_memory">Sample memory (in mbs)</label>
                </div> : null }
            </div>
        </div>
        <input className="hidden" type="submit"/>
        { this.state.submitting ? <div className="center login-wrapper disabled"> <i className='fa fa-spinner fa-spin fa-lg'></i> </div> : 
          <div onClick={ this.handleUpload } className="center login-wrapper">Submit</div> }
      </form>
    </div>
    )
  }

  render() {
    return (
      <div>
        { this.props.selectedSample ? this.renderUpdateForm() : this.renderSampleForm() }
          <div className="bottom">
            <span className="back" onClick={ this.props.selectedSample ? this.gotoPage.bind(this, '/samples') : this.gotoPage.bind(this, '/') } >Back</span>|
            <span className="home" onClick={ this.gotoPage.bind(this, '/')}>Home</span>
          </div>
      </div>
    )
  }
}

