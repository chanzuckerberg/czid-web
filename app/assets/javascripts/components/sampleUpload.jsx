class SampleUpload extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.csrf = props.csrf;
    this.project = props.project ? props.project : null;
    this.handleProjectSubmit = this.handleProjectSubmit.bind(this);
    this.clearError = this.clearError.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      allProjects: props.projects ? props.projects : null,
      invalid: false,
      errorMessage: '',
      success: false,
      successMessage: '',
      project: 'Select a Project'
    }
  }

  componentDidMount() {
    this.initializeSelectTag();
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
    axios.post('/samples', {
      sample: {
        name: this.refs.name.value.trim(),
        project_name: this.state.project.trim(),
        input_files_attributes: [{source_type: 's3', source: this.refs.first_file_source.value.trim() },
        {source_type: 's3', source: this.refs.second_file_source.value.trim() }],
        s3_preload_result_path: this.refs.s3_preload_result_path.value.trim(),
        job_queue: this.refs.job_queue.value.trim(),
        memory: this.refs.memory.value.trim(),
        status: 'created'
      },
      authenticity_token: this.csrf
    })
    .then(function (response) {
      that.setState({
        success: true,
        successMessage: 'Sample created successfully'
      }, () => {
        that.gotoPage('/');
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
    } else if (this.refs.first_file_source.value === '') {
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

  handleChange(e) {
    this.clearError();
    this.setState({
      project: e.target.value
    })
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
              <div className="col s6 input-field">
                <i className="sample fa fa-area-chart" aria-hidden="true"></i>
                <input ref= "name" type="text" className="" value={this.state.selectDefault} placeholder="Required - Sample name" onFocus={ this.clearError }  />
                <label htmlFor= "sample_name">Name</label>
              </div>
              <div className="col s6 project-list">
                   <select className="browser-default" onChange={ this.handleChange }> 
                    <option disabled selected>{this.state.project}</option>
                  { this.state.allProjects.length ? 
                      this.state.allProjects.map((project, i) => {
                        return <option ref= "project" key={i} id={project.id} >{project.name}</option>
                      }) : <option>No projects to display</option>
                    }
                  </select>
              </div>
            </div>
              <div className="row field-row">
                <div className="col s6 input-field">
                  <i className="sample fa fa-folder" aria-hidden="true"></i>
                  <input ref= "s3_preload_result_path" type="text" className="" onFocus={ this.clearError } placeholder="Optional - Example: s3://yunfang-workdir/id-rr004/RR004_water_2_S23/" />
                  <label htmlFor="sample_s3_preload_result_path">Preload results path (s3 only)</label>
                </div>
                <div className="col s6 input-field"> 
                    <i  onClick={ this.handleProjectSubmit }  className="sample add fa fa-plus" aria-hidden="true"></i>
                    <input ref= "new_project" type="text" onFocus={ this.clearError } placeholder="Add a project if desired project is not on the list" />
                    <label htmlFor="new_project">Project</label>
                </div>
              </div>
              <div className="field-row input-field">
                <i className="sample fa fa-link" aria-hidden="true"></i>
                <input ref= "first_file_source" type="text" className="" onFocus={ this.clearError } placeholder="Example: s3://czbiohub-infectious-disease/RR004/RR004_water_2_S23/RR004_water_2_S23_R1_001.fastq.gz" />
                <label htmlFor="sample_first_file_source">Read 1 fastq s3 path</label>
              </div>
              <div className="field-row input-field">
                <i className="sample fa fa-link" aria-hidden="true"></i>
                <input ref= "second_file_source" type="text" className="" onFocus={ this.clearError } placeholder="Example: s3://czbiohub-infectious-disease/RR004/RR004_water_2_S23/RR004_water_2_S23_R2_001.fastq.gz" />
                <label htmlFor="sample_second_file_source">Read 2 fastq s3 path</label>
              </div>
              <div className="row field-row">
                <div className="col s6 input-field">
                  <i className="sample fa fa-file" aria-hidden="true"></i>
                  <input ref= "job_queue" type="text" className="" onFocus={ this.clearError } placeholder="Optional" />
                  <label htmlFor="sample_job_queue">Job queue</label>
                </div>
                <div className="col s6 input-field">
                  <i className="sample fa fa-file" aria-hidden="true"></i>
                  <input ref= "memory" type="text" className="" onFocus={ this.clearError } placeholder="Optional" />
                  <label htmlFor="sample_memory">Sample memory (in mbs)</label>
                </div>
            </div>
        </div>
        <input className="hidden" type="submit"/>
        <div onClick={ this.handleSubmit } className="center-align login-wrapper">Submit</div>
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