class SampleUpload extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.csrf = props.csrf;
    this.project = props.project ? props.project : null;
    this.handleProjectSubmit = this.handleProjectSubmit.bind(this);
    this.clearError = this.clearError.bind(this);
    this.handleProjectChange = this.handleProjectChange.bind(this);
    this.handleHostChange = this.handleHostChange.bind(this);
    this.handleQueueChange = this.handleQueueChange.bind(this);
    this.handleMemoryChange = this.handleMemoryChange.bind(this);
    this.state = {
      allProjects: props.projects || [],
      hostGenomes: props.host_genomes || [],
      hostName: props.host_genomes.length ? props.host_genomes[0].name : '',
      hostId: props.host_genomes.length ? props.host_genomes[0].id : null,
      invalid: false,
      errorMessage: '',
      success: false,
      successMessage: '',
      project: 'Select a Project',
      job_queue: 'aegea_batch',
      memory: 64000
    }
  }

  componentDidMount() {
    this.initializeSelectTag();
    $(ReactDOM.findDOMNode(this.refs.projectSelect)).on('change',this.handleProjectChange);
    $(ReactDOM.findDOMNode(this.refs.hostSelect)).on('change',this.handleHostChange);
  }

  handleSubmit(e) {
    e.preventDefault();
    this.clearError();
    if(!this.isFormInvalid()) {
      this.createSample()
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

  componentDidUpdate() {
    this.handleProjectSubmit ? this.handleProjectSubmit : null
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
        name: this.refs.new_project.value,
      },
      authenticity_token: this.csrf
    })
    .then((response) => {
      var newProjectList = that.state.allProjects.slice();
      newProjectList.push(response.data);
      that.setState({
        allProjects: newProjectList,
        project: response.data.name,
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
        errorMessage: 'Project exists already or is invalid'
      })
    });
  }

  isProjectInvalid() {
    if (this.refs.new_project.value === '') {
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
    axios.post('/samples.json', {
      sample: {
        name: this.refs.name.value.trim(),
        project_name: this.state.project.trim(),
        input_files_attributes: [{source_type: 's3', source: this.refs.first_file_source.value.trim() },
        {source_type: 's3', source: this.refs.second_file_source.value.trim() }],
        s3_preload_result_path: this.refs.s3_preload_result_path.value.trim(),
        job_queue: this.state.job_queue,
        memory: this.state.memory,
        host_genome_id: this.state.hostId,
        status: 'created'
      },
      authenticity_token: this.csrf
    })
    .then(function (response) {
      that.setState({
        success: true,
        successMessage: 'Sample created successfully'
      }, () => {
        that.gotoPage(`/samples/${response.data.id}`);
      })
    })
    .catch(function (error) {
     that.setState({
      invalid: true,
       errorMessage: 'Failed to create sample'
     })
    });
  }

  filePathValid(str) {
    var regexPrefix = /^s3:\/\//;
    var regexSuffix = /(\A[^\s\/]+\.fastq.gz)/igm;
    if (str.match(regexPrefix) && str.match(regexSuffix)) {
      return true;
    } else {
      return false;
    }
  }

  isFormInvalid() {
    if (this.refs.name.value === '' && this.state.project === 'Select a Project' && this.refs.first_file_source.value === '' && this.refs.second_file_source.value === '') {
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
          errorMessage: 'Please fill in a valid file path'
        })
        return true;
    } else if ( !this.filePathValid(this.refs.second_file_source.value)) {
      this.setState({
        invalid: true,
        errorMessage: 'Please fill in a valid file path'
      })
      return true;
    }
    else {
      return false;
    }
  }

  handleProjectChange(e) {
    this.setState({
      project: e.target.value
    })
    this.clearError();
  }


  handleHostChange(e) {
    this.setState({
      host: e.target.value
    })
    this.clearError();
  }

  handleQueueChange(e) {
    this.setState({
      job_queue: e.target.value
    })
    this.clearError();
  }

  handleMemoryChange(e) {
    this.setState({
      memory: e.target.value
    })
    this.clearError();
  }

  renderSampleForm() {
    return (
      <div className="form-wrapper">
        <form ref="form" onSubmit={ this.handleSubmit }>
          <div className="row title">
            <p className="col s6 signup">Sample Upload</p>
          </div>
          { this.state.success ? <div className="success-info" >
                <i className="fa fa-success"></i>
                 <span>{this.state.successMessage}</span>
                </div> : null }
              { this.state.invalid ? <div className="error-info" >
                  <i className="fa fa-error"></i>
                  <span>{this.state.errorMessage}</span>
              </div> : null }
          <div className="row content-wrapper">
            <div className="row field-row">
              <div className="col s6 input-field name">
                <input ref= "name" type="text" className="path" onFocus={ this.clearError }  />
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
                    <option disabled selected>{this.state.project}</option>
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
                      <input className="col s1 add-icon" value="&#xf067;" type="submit" onClick={ this.handleProjectSubmit } />
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
                <div className="col s4 input-field">
                  <i className="sample fa fa-folder" aria-hidden="true"></i>
                  <input ref= "s3_preload_result_path" type="text" className="path" onFocus={ this.clearError } placeholder="Optional" />
                  <span className="path_label">Example: s3://yunfang-workdir/id-rr004/RR004_water_2_S23/</span>
                  <label htmlFor="sample_s3_preload_result_path">Preload results path (s3 only)</label>
                </div>
                <div className="col s4 input-field">
                  <i className="sample fa fa-file" aria-hidden="true"></i>
                  <input ref= "job_queue" type="text" className="" onFocus={ this.clearError } placeholder="Optional" value={this.state.job_queue} onChange={ this.handleQueueChange } />
                  <label htmlFor="sample_job_queue">Job queue</label>
                </div>
                <div className="col s4 input-field">
                  <i className="sample fa fa-file" aria-hidden="true"></i>
                  <input ref= "memory" type="text" className="" value={this.state.memory} onFocus={ this.clearError } placeholder="Optional" onChange={ this.handleMemoryChange } />
                  <label htmlFor="sample_memory">Sample memory (in mbs)</label>
                </div>
            </div>
        </div>
        <input className="hidden" type="submit"/>
        <div onClick={ this.handleSubmit } className="center login-wrapper">Submit</div>
      </form>
    </div>
    )
  }

  render() {
    return (
      <div>
        { this.renderSampleForm() }
      </div>
    )
  }
}