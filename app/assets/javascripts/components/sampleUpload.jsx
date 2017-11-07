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
    this.hostGenomes = props.host_genomes || [];
    this.hostName = this.hostGenomes.length ? this.hostGenomes[0].name : '';
    this.hostId = this.hostGenomes.length ? this.hostGenomes[0].id : null;
    this.sample = props.selectedSample || '';
    this.userDetails = props.loggedin_user;
    this.selectedSample = {
      name: this.sample.name || '',
      hostGenome: this.sample.host_genome_name || '',
      hostGenomeId: this.sample.host_genome_id || null,
      project: props.projectInfo ? props.projectInfo : '',
      resultPath: this.sample.s3_preload_result_path || '',
      jobQueue: this.sample.job_queue || '',
      memory: this.sample.sample_memory || '',
      id: this.sample.id || '',
      inputFiles: props.inputFiles && props.inputFiles.length ? props.inputFiles : [],
      projectId: this.project ? this.project.id : null,
      status: this.sample.status
    };
    this.state = {
      submitting: false,
      allProjects: this.projects || [],
      hostGenomes: this.hostGenomes || [],
      hostName: this.hostName,
      hostId: this.hostId,
      invalid: false,
      errorMessage: '',
      success: false,
      successMessage: '',
      project: 'Select a Project',
      projectId: null,
      job_queue: '',
      memory: '',
      serverErrors: [],
      selectedName: this.selectedSample.name || '',
      selectedHostGenome: this.selectedSample.hostGenome || '',
      selectedHostGenomeId: this.selectedSample.hostGenomeId || null,
      selectedProject: this.selectedSample.project.name || '',
      selectedPId: this.selectedSample.projectId || null,
      selectedResultPath: this.selectedSample.resultPath || '',
      selectedJobQueue: this.selectedSample.jobQueue || '',
      selectedMemory: this.selectedSample.memory || '',
      id: this.selectedSample.id,
      firstInput: this.selectedSample.inputFiles.length && this.selectedSample.inputFiles[0] ? (this.selectedSample.inputFiles[0].source === null ? '' : this.selectedSample.inputFiles[0].source) : '',
      secondInput: this.selectedSample.inputFiles.length && this.selectedSample.inputFiles[1] ? (this.selectedSample.inputFiles[1].source === null ? '' : this.selectedSample.inputFiles[1].source) : '',
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
        project: response.data.name,
        selectedProject: response.data.name,
        selectedPId: response.data.id,
        projectId: response.data.id,
        success: true,
        successMessage: 'Project added successfully'
      }, () => {
        this.refs.new_project.value = '';
        that.initializeSelectTag();
      });
    })
    .catch((error) => {
      console.log(error.response, 'error');
      that.setState({
        invalid: true,
        errorMessage: 'Project exists already or is invalid',
      })
    });
  }

  isProjectInvalid() {
    if (this.refs.new_project.value === '' && this.state.project === 'Select a project') {
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
    });
    axios.post('/samples.json', {
      sample: {
        name: this.refs.name.value.trim(),
        project_name: this.state.project.trim(),
        project_id: this.state.projectId,
        input_files_attributes: [{source_type: 's3', source: this.refs.first_file_source.value.trim() },
        {source_type: 's3', source: this.refs.second_file_source.value.trim() }],
        s3_preload_result_path: this.refs.s3_preload_result_path.value.trim(),
        job_queue: this.state.job_queue,
        sample_memory: this.state.memory,
        host_genome_id: this.state.hostId,
        host_genome_name: this.state.host,
        status: ''
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
    .catch(function (error) {
      that.setState({
        invalid: true,
        serverErrors: error.response.data,
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
        host_genome_id: this.state.selectedHostGenomeId,
        host_genome_name: this.state.selectedHostGenome,
        status: this.selectedSample.status
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
    .catch(function (error) {
     that.setState({
      submitting: false,
      invalid: true,
      serverErrors: error.response.data,
     });
    });
  }

  filePathValid(str) {
    var regexPrefix = /s3:\/\//;
    var regexSuffix = /(\.fastq.gz)/igm;
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
    if (this.refs.name.value === '' && this.state.project === 'Select a Project' && this.refs.first_file_source.value === '' && this.refs.second_file_source.value === '' && this.state.host === '') {
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
    } else if (this.state.project === 'Select a Project') {
        this.setState({
          invalid: true,
          errorMessage: 'Please select a project'
        })
        return true;
    } else if (this.state.host === '') {
      this.setState({
        invalid: true,
        errorMessage: 'Please select a host genome'
      })
      return true;
    }
    else if (this.refs.first_file_source.value === '') {
        this.setState({
          invalid: true,
          errorMessage: 'Please fill in first read fastq path'
        })
        return true;
    } else if (this.refs.second_file_source.value === '') {
        this.setState({
          invalid: true,
          errorMessage: 'Please fill in second read fastq path'
        })
        return true;
    } else if ( !this.filePathValid(this.refs.first_file_source.value)) {
        this.setState({
          invalid: true,
          errorMessage: 'Please fill in a valid file path for Read 1, Sample format for path can be found below'
        })
        return true;
    } else if ( !this.filePathValid(this.refs.second_file_source.value)) {
      this.setState({
        invalid: true,
        errorMessage: 'Please fill in a valid file path for Read 2, Sample format for path can be found below'
      })
      return true;
    }
    else {
      return false;
    }
  }

  handleProjectChange(e) {
    this.setState({
      selectedProject: e.target.value.trim(),
      project: e.target.value.trim(),
      selectedPId: e.target.selectedIndex
    })
    this.clearError();
  }


  handleHostChange(e) {
    this.setState({
      host: e.target.value.trim(),
      selectedHostGenome: e.target.value.trim(),
      selectedHostGenomeId: e.target.selectedIndex
    })
    this.clearError();
  }

  handleQueueChange(e) {
    this.setState({
      job_queue: e.target.value.trim(),
      selectedJobQueue: e.target.value.trim()
    })
    this.clearError();
  }

  handleMemoryChange(e) {
    this.setState({
      memory: e.target.value.trim(),
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
                    <option disabled defaultValue>{this.state.selectedHostGenome}</option>
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
                <input ref= "first_file_source" type="text" className="no-edit" onFocus={ this.clearError } placeholder="Required" value={ this.state.firstInput } readOnly/>
                <label htmlFor="sample_first_file_source">Read 1 fastq s3 path</label>
              </div>
              <div className="field-row input-field align" >
                <i className="sample fa fa-link" aria-hidden="true"></i>
                <input ref= "second_file_source" type="text" className="no-edit" onFocus={ this.clearError } placeholder="Required" value={ this.state.secondInput } readOnly/>
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
        <div onClick={ this.handleUpdate } className="center login-wrapper">{ !this.state.submitting ? 'Submit' : <i className='fa fa-spinner fa-spin fa-lg'></i>}</div>
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
                  <select ref="hostSelect" name="host" className="" id="host" onChange={ this.handleHostChange } value={this.state.host}>
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
                   <select ref="projectSelect" className="" id="sample" onChange={ this.handleProjectChange } value={this.state.project}>
                    <option disabled defaultValue>{this.state.project}</option>
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
                <label htmlFor="sample_first_file_source">Read 1 fastq s3 path</label>
              </div>
              <div className="field-row input-field align" >
                <i className="sample fa fa-link" aria-hidden="true"></i>
                <input ref= "second_file_source" type="text" className="path" onFocus={ this.clearError } placeholder="Required" />
                <span className="path_label">Example: s3://czbiohub-infectious-disease/RR004/RR004_water_2_S23/RR004_water_2_S23_R2_001.fastq.gz</span>
                <label htmlFor="sample_second_file_source">Read 2 fastq s3 path</label>
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
                  <input ref= "job_queue" type="text" className="" onFocus={ this.clearError } placeholder="Optional" value={this.state.job_queue} onChange={ this.handleQueueChange } />
                  <label htmlFor="sample_job_queue">Job queue</label>
                </div> : null }
                { this.userDetails.admin ? <div className="col s4 input-field">
                  <i className="sample fa fa-file" aria-hidden="true"></i>
                  <input ref= "memory" type="text" className="" value={this.state.memory} onFocus={ this.clearError } placeholder="Optional" onChange={ this.handleMemoryChange } />
                  <label htmlFor="sample_memory">Sample memory (in mbs)</label>
                </div> : null }
            </div>
        </div>
        <input className="hidden" type="submit"/>
        <div onClick={ this.handleUpload } className="center login-wrapper">{ !this.state.submitting ? 'Submit' : <i className='fa fa-spinner fa-spin fa-lg'></i>}</div>
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
