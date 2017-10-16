class SampleUpload extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.csrf = this.props.csrf;
    this.state = {
      allProjects: this.props.projects ? this.props.projects : null,
      invalidProject: false,
      errorMessage: ''
    }
  }

  componentDidMount() {
    console.log(this.props, this.state.allProjects);
    $('select').material_select();
  }

  handleSubmit(e) {
    e.preventDefault();
    // if(!this.isFormInValid()) {
      this.createSample()
    // }
  }

  clearError() {
    // this.setState({ showFailedLogin: false })
  }

  gotoPage(path) {
    location.href = `${path}`
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   return this.props !== nextProps || nextState.allProjects !== this.state.allProjects
  // }

  componentDidUpdate() {
    this.handleProjectSubmit ? this.handleProjectSubmit : null
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
      console.log(response, newProjectList, 'that');
      newProjectList.push(response.data);
      // that.gotoPage('/samples')
      that.setState({
        allProjects: newProjectList
      }, function() {
        console.log(this.state.allProjects, 'updated projects');
      })
    })
    .catch((error) => {
      console.log(error)
      that.setState({
        errorMessage: 'Failed to add project'
      })
    });
  }

  isProjectValid() {
    if (this.refs.new_project.value === '') {
      this.setState({
        invalidProject: true,
        errorMessage: 'Please enter valid project name'
      })
      return true;
    } else {
      return false;
    }
  }

  handleProjectSubmit(e) {
    e.preventDefault();
    if (!this.isProjectValid()) {
      this.addProject()
    }
  }


  createSample() {
    console.log('got called', this.refs)
    var that = this;
    axios.post('/samples', {
      sample: {
        name: this.refs.name.value,
        project_name: this.refs.project.value,
        project_id: this.refs.project.id,
        input_files_attributes: [{source_type: 's3', source: this.refs.first_file_source.value },
        {source_type: 's3', source: this.refs.second_file_source.value}],
        s3_preload_result_path: this.refs.s3_preload_result_path.value,
        job_queue: this.refs.job_queue.value,
        memory: this.refs.memory.value,
        status: 'created'
      },
      authenticity_token: this.csrf
    })
    .then(function (response) {
      console.log(response.data);
      // that.gotoPage('/samples')
    })
    .catch(function (error) {
      console.log(error)
      // that.setState({
      //   showFailedLogin: true,
      //   errorMessage: 'Sample upload failed'
      // })
    });
  }

  isFormInvalid() {

  }

  renderSampleForm() {
    return (
      <div className="form-wrapper">
        <form ref="form" onSubmit={ this.handleSubmit }>
          <div className="row title">
            <p className="col s6 signup">Upload Sample</p>
          </div>
          <div className="row content-wrapper">
            {/* <div className="field" >
              <label for="sample_name" className="active">Name</label>
              <input id="sample_name" placeholder="Required" type="text" name="sample[name]" />
            </div>
            <div className="field radiobutton-list">
              <label for="sample_project">Project</label>
              <input type="hidden" name="sample[project_id]" value="" />
              <input type="radio" value="1" name="sample[project_id]" id="sample_project_id_1" /><label for="sample_project_id_1">Awesome Project</label>
            </div>
            <input value="created" type="hidden" name="sample[status]"/>
            <div className="field">
              <label for="sample_Read 1 FASTQ S3 Path" className="active">Read 1 fastq s3 path</label><br/>
              <span style="font-size:9px; color: green">
              Example: s3://czbiohub-infectious-disease/RR004/RR004_water_2_S23/RR004_water_2_S23_R1_001.fastq.gz
              </span>
              <input type="text" name="sample[input_files_attributes][0][source]" id="sample_input_files_attributes_0_source" value="" placeholder="Required" />
            </div>
              <input type="hidden" name="sample[input_files_attributes][0][source_type]" id="sample_input_files_attributes_0_source_type" value="s3" />
              <input type="hidden" name="sample[input_files_attributes][1][source_type]" id="sample_input_files_attributes_1_source_type" value="s3" />

              <div className="field">
                <label for="sample_Read 2 FASTQ S3 Path" className="active">Read 2 fastq s3 path</label><br />
                <span style="font-size:9px; color: green">
                Example: s3://czbiohub-infectious-disease/RR004/RR004_water_2_S23/RR004_water_2_S23_R2_001.fastq.gz
                </span>
                <input type="text" name="sample[input_files_attributes][1][source]" id="sample_input_files_attributes_1_source" value="" placeholder="Required" />
              </div>


              <div className="field">
                <label for="sample_Preload Results Path (S3 only)" className="active">Preload results path (s3 only)</label><br />
                <span style="font-size:9px; color: green">
                Example: s3://yunfang-workdir/id-rr004/RR004_water_2_S23/
                </span>
                <input placeholder="Optional" type="text" name="sample[s3_preload_result_path]" />
              </div>
              <div className="field">
                <label for="sample_Job Queue" className="active">Job queue</label>
                <input id="job_queue" placeholder="Optional" type="text" value="aegea_batch_ondemand" name="sample[job_queue]" />
              </div> */}
            <div className="row field-row">
              <div className="col s6 input-field">
                <i className="sample fa fa-envelope" aria-hidden="true"></i>
                <input ref= "name" type="text" className="" onFocus={ this.clearError }  />
                <label htmlFor= "sample_name">Name</label>
              </div>
              <div className="col s6 project-list input-field">
                  <select selected="Select a Project" >
                  { this.state.allProjects ? 
                      this.state.allProjects.map((project, i) => {
                        return <option key={i} ref="project" id={project.id} value={project.name}>{project.name}</option>
                      }) : <option>No projects to display</option>
                    } }
                  </select> 
            </div>
          </div>
          
          <div className="row field-row">
            <div className="col s6 input-field">
              <i className="sample fa fa-envelope" aria-hidden="true"></i>
              <input ref= "s3_preload_result_path" type="text" className="" onFocus={ this.clearError } placeholder="Optional" />
              <label htmlFor="sample_s3_preload_result_path">Preload results path (s3 only)</label>
            </div>
            <div className="col s4 project-wrapper">      
              <input ref= "new_project" type="text" className="project_input" onFocus={ this.clearError } placeholder="Add a project if desired project is not on the list" />
            </div>
            <div className="col s2 btn-add">
              <a onClick={ this.handleProjectSubmit.bind(this) }className="waves-effect waves-light btn"><i className="fa fa-plus" aria-hidden="true"></i></a>
            </div>
          </div>
          
              <div className="field-row input-field">
                <i className="sample fa fa-envelope" aria-hidden="true"></i>
                <input ref= "first_file_source" type="text" className="" onFocus={ this.clearError } placeholder="Required" />
                <label htmlFor="sample_first_file_source">Read 1 fastq s3 path</label>
              </div>

              <div className="field-row input-field">
                <i className="sample fa fa-envelope" aria-hidden="true"></i>
                <input ref= "second_file_source" type="text" className="" onFocus={ this.clearError } placeholder="Required" />
                <label htmlFor="sample_second_file_source">Read 2 fastq s3 path</label>
              </div>

              

              <div className="row field-row">
                <div className="col s6 input-field">
                  <i className="sample fa fa-envelope" aria-hidden="true"></i>
                  <input ref= "job_queue" type="text" className="" onFocus={ this.clearError } placeholder="Optional" />
                  <label htmlFor="sample_job_queue">Job queue</label>
                </div>

              <div className="col s6 input-field">
                <i className="sample fa fa-envelope" aria-hidden="true"></i>
                <input ref= "memory" type="text" className="" onFocus={ this.clearError } placeholder="Optional" />
                <label htmlFor="sample_memory">Sample memory (in mbs)</label>
              </div>
            </div>
        </div>
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