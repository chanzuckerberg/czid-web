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
    this.toggleNewProjectInput = this.toggleNewProjectInput.bind(this);
    this.projects = props.projects || [];
    this.project = props.projectInfo || '';
    this.hostGenomes = props.host_genomes || [];
    this.sample = props.selectedSample || '';
    this.userDetails = props.loggedin_user;
    this.updateSampleName = this.updateSampleName.bind(this);
    const selectedHostGenomeName = (this.hostGenomes[0] && this.hostGenomes[0].name) ? this.hostGenomes[0].name : '';
    const selectedHostGenomeId = (this.hostGenomes[0] && this.hostGenomes[0].id) ? this.hostGenomes[0].id : '';
    const adminGenomes = this.hostGenomes.filter((g) => {
      return g.name.toLowerCase().indexOf('test') >= 0;
    });
    this.selected = {
      name: this.sample.name || '',
      hostGenome: this.sample ? this.sample.host_genome_name : selectedHostGenomeName,
      hostGenomeId: this.sample ? this.sample.host_genome_id : selectedHostGenomeId,
      project: this.project ? this.project.name : 'Select a project',
      projectId: this.project ? this.project.id : null,
      resultPath: this.sample ? this.sample.s3_preload_result_path : '',
      jobQueue: this.sample ? this.sample.job_queue : '',
      memory: this.sample ? this.sample.sample_memory : '',
      id: this.sample.id || '',
      inputFiles: props.inputFiles && props.inputFiles.length ? props.inputFiles : [],
      status: this.sample.status
    };
    this.firstInput = this.selected.inputFiles.length && this.selected.inputFiles[0] ? (this.selected.inputFiles[0].source === null ? '' : this.selected.inputFiles[0].source) : '';
    this.secondInput = this.selected.inputFiles.length && this.selected.inputFiles[1] ? (this.selected.inputFiles[1].source === null ? '' : this.selected.inputFiles[1].source) : '';
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
      errors: {},
      adminGenomes,
      sampleName: '',
      disableProjectSelect: false
    };
  }

  componentDidMount() {
    $('body').addClass('background-cover');
    $('.tooltipped').tooltip({ delay: 50 });
    this.initializeSelectTag();
    $(ReactDOM.findDOMNode(this.refs.projectSelect)).on('change',this.handleProjectChange);
    $(ReactDOM.findDOMNode(this.refs.hostSelect)).on('change',this.handleHostChange);
    this.initializeTooltip();
  }
    initializeTooltip() {
      // only updating the tooltip offset when the component is loaded
      $(() => {
        const tooltipIdentifier = $("[rel='tooltip']");
        tooltipIdentifier.tooltip({
          delay: 0,
          html: true,
          placement: 'top',
          offset: '0px 50px'
        });
      });
    }

  handleUpload(e) {
    e.preventDefault();
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
    if (e && e.preventDefault) {
      e.preventDefault();
    }
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
        errors: { 'selectedProject': 'Project already exists or is invalid' },
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
    this.setState({
      submitting: true
    });
    axios.post('/samples.json', {
      sample: {
        name: this.state.sampleName,
        project_name: this.state.selectedProject.trim(),
        project_id: this.state.selectedPId,
        input_files_attributes: [{source_type: 's3', source: this.refs.first_file_source.value.trim() },
        {source_type: 's3', source: this.refs.second_file_source.value.trim() }],
        s3_preload_result_path: (this.userDetails.admin) ? this.refs.s3_preload_result_path.value.trim() : '',
        job_queue: this.state.selectedJobQueue,
        sample_memory: this.state.selectedMemory,
        host_genome_id: this.state.selectedHostGenomeId,
        status: 'created'
      },
      authenticity_token: this.csrf
    })
    .then((response) => {
      this.setState({
        success: true,
        submitting: false,
        successMessage: 'Sample created successfully'
      });
      setTimeout(() => {
        this.gotoPage(`/samples/${response.data.id}`);
      }, 2000);
    })
    .catch((error) => {
      this.setState({
        invalid: true,
        submitting: false,
        serverErrors: error.response.data,
        errorMessage: 'Something went wrong'
      });
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

  filePathValid(str) {
    const regexPrefix = /s3:\/\//;
    const regexSuffix = /(\.fastq|\.fastq.gz|\.fasta|\.fasta.gz)/igm;
    return (str.match(regexPrefix) && str.match(regexSuffix));
  }

  isUpdateFormInvalid() {
    if (this.state.selectedName === '' && this.state.selectedProject === 'Select a Project' && this.state.selectedHostGenome === '') {
      this.setState({
        invalid: true,
        errorMessage: 'Please fill in name, host genome and select a project'
      });
      return true;
    } else if (this.state.selectedName === '') {
        this.setState({
          invalid: true,
          errorMessage: 'Please fill in Sample name'
        });
        return true;
    } else if (this.state.selectedProject === 'Select a Project') {
        this.setState({
          invalid: true,
          errorMessage: 'Please select a project'
        });
        return true;
    } else if (this.state.selectedHostGenome === '') {
      this.setState({
        invalid: true,
        errorMessage: 'Please select a host genome'
      });
      return true;
    }
    else {
      return false;
    }
  }
  baseName(str) {
    let base = new String(str).substring(str.lastIndexOf('/') + 1);
    if(base.lastIndexOf(".") != -1) {
      base = base.substring(0, base.lastIndexOf("."));
    }
    return base;
  }
  isFormInvalid() {
    const errors = {};

    if(this.state.sampleName) {
      if(this.state.sampleName.toLowerCase() === '') {
        errors.sampleName = 'Please enter a sample name';
      }
    } else {
      errors.sampleName = 'Please enter a sample name';
    }

    if(this.state.selectedProject) {
      if(this.state.selectedProject.toLowerCase() === 'select a project') {
        errors.selectedProject = 'Please select a project';
      }
    } else {
      errors.selectedProject = 'Please select a project';
    }

    if(this.state.selectedHostGenome) {
      if (this.state.selectedHostGenome === '') {
        errors.selectedHostGenome = 'Please select a host genome';
      }
    } else {
      errors.selectedHostGenome = 'Please select a host genome';
    }

    if (this.refs.first_file_source) {
      const firstFileSourceValue = this.refs.first_file_source.value.trim();
      if(!this.filePathValid(firstFileSourceValue)) {
        errors.first_file_source = 'Error: invalid file path';
      }
    } else {
      errors.first_file_source = 'Error: invalid file path';
    }

    if (this.refs.second_file_source) {
      const secondFileSourceValue = this.refs.second_file_source.value.trim();
      if(secondFileSourceValue !== '' && !this.filePathValid(secondFileSourceValue)) {
        errors.second_file_source = 'Error: invalid file path';
      }
    }

    if(this.userDetails.admin ) {
      // running validations for admin inputs
      if(this.refs.s3_preload_result_path) {
        const preloadPath = this.refs.s3_preload_result_path.value.trim();
        if(preloadPath !== '' && preloadPath.indexOf('s3://') < 0) {
          errors.s3_preload_result_path = 'Error: invalid file path';
        }
      }
      if(this.state.selectedMemory !== '') {
        const memorySize = parseInt(this.state.selectedMemory, 10);
        if(isNaN(memorySize) || memorySize < 1) {
          errors.memory = 'Memory size is not valid';
        }
      }
    }
    const errorLength  = Object.keys(errors).length;
    if (errorLength) {
      this.setState({ invalid: true, errors });
    } else {
      this.setState({ invalid: false, errors });
    }
    return errorLength;
  }

  handleProjectChange(e) {
    if(e.target.value.trim().toLowerCase() !== 'select a project') {
      const selectedIndex = e.target.selectedIndex - 1; // because the first item is Select a project
      this.setState({
        selectedProject: e.target.value.trim(),
        selectedPId: this.state.allProjects[selectedIndex].id,
        errors: Object.assign({}, this.state.errors, {selectedProject: null})
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

  handleQueueChange(e) {
    this.setState({
      selectedJobQueue: e.target.value.trim()
    });
    this.clearError();
  }

  handleMemoryChange(e) {
    this.setState({
      selectedMemory: e.target.value.trim()
    });
    this.clearError();
  }

  handleNameChange(e) {
    this.setState({
      selectedName: e.target.value.trim(),
    });
  }

  handleResultChange(e) {
    this.setState({
      selectedResultPath: e.target.value.trim()
    });
  }

  displayError(failedStatus, serverError, formattedError) {
    if (failedStatus) {
      return (serverError instanceof Array) ? serverError.map((error, i) => {
        return <p key={i}>{error}</p>
      }) : <p>{formattedError}</p>
    } else {
      return null
    }
  }

  toggleNewProjectInput(e) {
    $('.new-project-input').slideToggle();
    $('.new-project-button').toggleClass('active');
    this.setState({
      disableProjectSelect: !this.state.disableProjectSelect
    }, () => {
      this.initializeSelectTag();
    });
  }

  static resolveGenomeIcon (genomeName, color) {
    let imgPath = '/assets/generic_genome.png';
    if (typeof genomeName === 'undefined') {
      return false;
    }
    genomeName = genomeName.toLowerCase();
    switch (genomeName) {
      case 'mosquito':
        return IconComponent.mosquito(color);
        break;
      case 'human':
        return IconComponent.human(color);
        break;
      case 'no host subtraction':
        return IconComponent.bacteria(color);
        break;
      default:
        return false;
    }
  }

  updateSampleName(e, sampleField) {
    if(e) {
      let value = e.target.value.trim();
      if((value.length && value.indexOf('/'))) {
        if(!this.refs.sample_name.value.trim().length) {
          let base = this.baseName(value);
          let fastqLabel = /.fastq*$|.fasta*$|.gz*$/igm;
          let readLabel = /_R1.*$|_R2.*$/ig;
          base = base.replace(fastqLabel, '').replace(readLabel, '');
          this.refs.sample_name.value = base;
          this.setState({ sampleName: base });
        }
      }
    } else if(sampleField) {
      this.setState({ sampleName: sampleField });
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
                  <label>Host genomes</label>
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
                  <label>Project list</label>
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
      <div id='samplesUploader' className='row'>
        <div className='col s4 valign-wrapper offset-s4 upload-form-container'>
          <div className='content'>
            <div>
              <div className='form-title'>
                Single Upload
              </div>
              <div className='upload-info'>
                Upload a single sample to be processed through the IDseq pipeline.
              </div>
            </div>
            <div>
              <p className='upload-question'>
                Want to upload multiple samples at once? <a href='/samples/bulk_new'>Click here.</a>
                <br/>
                Rather use our CLI? <a href='https://github.com/chanzuckerberg/idseq-web/blob/master/README.md#submit-a-sample' target='_blank'>Read documentation here.</a>
              </p>
            </div>
            { this.state.success ?
              <div className="form-feedback success-message" >
                <i className="fa fa-check-circle-o"/> <span>{this.state.successMessage}</span>
              </div> : null
            }
            {
              this.state.invalid ?
                <div className='form-feedback error-message'>
                  { this.displayError(this.state.invalid, this.state.serverErrors, this.state.errorMessage) }
                </div> : null
            }
            <form ref="form" onSubmit={ this.handleUpload }>
              <div className='fields'>
                <div className='field'>
                  <div className='row'>
                    <div className='col field-title no-padding s12'>
                      Project
                    </div>
                  </div>
                  <div className='row input-row'>
                    <div className='col project-list no-padding s8'
                         title='Name of experiment or project' data-placement='top' rel='tooltip'>
                      <select ref="projectSelect" disabled={(this.state.disableProjectSelect ? 'disabled' : '')} className="projectSelect" id="sample" onChange={ this.handleProjectChange } value={this.state.selectedProject}>
                        <option disabled defaultValue>{this.state.selectedProject}</option>
                        { this.state.allProjects.length ?
                          this.state.allProjects.map((project, i) => {
                            return <option ref= "project" key={i} id={project.id} >{project.name}</option>
                          }) : <option>No projects to display</option>
                        }
                      </select>
                      {
                        (this.state.errors.selectedProject) ?
                          <div className='field-error'>
                            {this.state.errors.selectedProject}
                          </div> : null
                      }
                    </div>
                    <div className='col no-padding s4'>
                      <button type='button' onClick={this.toggleNewProjectInput}
                              title='Add your desired experiment or project name' data-placement='right' rel='tooltip'
                              className='new-project-button new-button skyblue-button'>
                        <i className='fa fa-plus'/>
                        <span>
                          New project
                        </span>
                      </button>
                    </div>
                    <div className='col no-padding s12 new-project-input hidden'>
                      <input type='text' onBlur={ (e) => {
                        if (e.target.value.trim().length) {
                          this.handleProjectSubmit();
                        }
                        $('.new-project-button').click();
                      }} ref='new_project' onFocus={ this.clearError } className='browser-default' placeholder='Input new project name' />
                      {
                        (this.state.errors.new_project) ?
                          <div className='field-error'>
                            {this.state.errors.new_project}
                          </div> : null
                      }
                    </div>
                  </div>
                </div>

                <div className='field'>
                  <div className='row'>
                    <div className='col field-title no-padding s5'
                         title='This will be subtracted by the pipeline' data-placement='left' rel='tooltip'>
                      Select host genome
                    </div>
                    {
                      (this.userDetails.admin) ?
                        <div className='col s7 right-align no-padding right admin-genomes'>
                          {
                            this.state.adminGenomes.map((g) => {
                              return (
                                <div key={g.id}
                                     className={`${this.state.selectedHostGenome ===  g.name ? 'active' : ''} genome-label`}
                                     id={g.name} onClick={() => this.handleHostChange(g.id, g.name)}>
                                  { g.name }
                                  </div>
                              );
                            })
                          }
                        </div> : null
                    }
                    </div>
                  <div className='row input-row'>
                    <div className='col center no-padding s12'>
                      <ul className='host-selector'>
                        {
                          this.state.hostGenomes.map((g) => {
                            return (
                              SampleUpload.resolveGenomeIcon(g.name) ?
                              <li
                                  key={g.id} className={ `${this.state.selectedHostGenome ===  g.name ? 'active' : ''} `}
                                  id={g.name} onClick={() => this.handleHostChange(g.id, g.name)}>
                                  {
                                    this.state.selectedHostGenome ===  g.name ?
                                    <div className='img-container' dangerouslySetInnerHTML={{ __html: SampleUpload.resolveGenomeIcon(g.name, '#59bcd6') }} />
                                    :
                                    <div className='img-container' dangerouslySetInnerHTML={{ __html: SampleUpload.resolveGenomeIcon(g.name, '#95A1Ab') }} />
                                  }
                                <div className='genome-label'>
                                  { g.name }
                                </div>
                              </li> : null
                            );
                          })
                        }
                        { this.state.hostGenomes.length ? '' :
                          <div>
                            <small>No host genome found!</small>
                          </div>
                        }
                      </ul>
                      {
                        (this.state.errors.selectedHostGenome) ?
                          <div className='field-error'>
                            {this.state.errors.selectedHostGenome}
                          </div> : null
                      }
                    </div>
                  </div>
                </div>
                <div className='field'>
                  <div className='row'>
                    <div className='col no-padding s12'>
                      <div className='field-title'>
                        <div className='read-count-label'>
                          Read 1
                        </div>
                        <div className='validation-info'>
                          Accepted formats: fastq, fastq.gz, fasta, fasta.gz
                        </div>
                        <div className='example-link'>
                          Example: s3://czbiohub-infectious-disease/RR004/RR004_water_2_S23/RR004_water_2_S23_R1_001.fastq.gz
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='row input-row'>
                    <div className='col no-padding s12'>
                      <input type='text' ref='first_file_source' onKeyUp={this.updateSampleName} onBlur={ this.clearError } className='browser-default' placeholder='aws/path-to-sample' />
                      {
                        (this.state.errors.first_file_source) ?
                          <div className='field-error'>
                            {this.state.errors.first_file_source}
                          </div> : null
                      }
                    </div>
                  </div>
                </div>
                <div className='field'>
                  <div className='row'>
                    <div className='col no-padding s12'>
                      <div className='field-title'>
                        <div className='read-count-label'>
                          Read 2
                        </div>
                        <div className='validation-info'>
                          Accepted formats: fastq, fastq.gz, fasta, fasta.gz
                        </div>
                        <div className='example-link'>
                          Example: s3://czbiohub-infectious-disease/RR004/RR004_water_2_S23/RR004_water_2_S23_R2_001.fastq.gz
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='row input-row'>
                    <div className='col no-padding s12'>
                      <input ref='second_file_source' onFocus={ this.clearError } type='text' className='browser-default' placeholder='aws/path-to-sample' />
                      {
                        (this.state.errors.second_file_source) ?
                          <div className='field-error'>
                            {this.state.errors.second_file_source}
                          </div> : null
                      }
                    </div>
                  </div>
                </div>
                <div className='field'>
                  <div className='row'>
                    <div className='col no-padding s12'>
                      <div className='field-title'>
                        <div className='read-count-label'>
                          Sample name
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='row input-row'>
                    <div className='col no-padding s12'>
                      <input type='text' ref='sample_name' className='browser-default'
                      onChange={(e) => this.updateSampleName(null, e.target.value)} placeholder='sample name' />
                      {
                        (this.state.errors.sampleName) ?
                          <div className='field-error'>
                            {this.state.errors.sampleName}
                          </div> : null
                      }
                    </div>
                  </div>
                </div>
                {
                  this.userDetails.admin ?
                    <div>
                      <div className='admin-fields divider'/>
                      <div className='admin-input-title'>
                        Admin options
                      </div>
                      <div className='field'>
                        <div className='row'>
                          <div className='col no-padding s12'>
                            <div className='field-title'>
                              <div className='read-count-label'>
                                Preload results path (s3)
                              </div>
                              <div className='example-link'>
                                Example: s3://yunfang-workdir/id-rr004/RR004_water_2_S23/
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className='row input-row'>
                          <div className='col no-padding s12'>
                            <input type='text' ref='s3_preload_result_path' className='browser-default' placeholder='aws/path-of-results' />
                            {
                              (this.state.errors.s3_preload_result_path) ?
                                <div className='field-error'>
                                  {this.state.errors.s3_preload_result_path}
                                </div> : null
                            }
                          </div>
                        </div>
                      </div>
                      <div className='field'>
                        <div className='row'>
                          <div className='col no-padding s12'>
                            <div className='field-title'>
                              <div className='read-count-label' htmlFor="sample_job_queue">
                                Job queue
                              </div>
                              <div className='validation-info'>
                                Example: aegea_batch_ondemand
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className='row input-row'>
                          <div className='col no-padding s12'>
                            <input id='sample_job_queue' ref= "job_queue" type='text' className='browser-default'
                                   placeholder='queue' value={this.state.selectedJobQueue}
                                   onChange={ this.handleQueueChange } />
                            {
                              (this.state.errors.job_queue) ?
                                <div className='field-error'>
                                  {this.state.errors.job_queue}
                                </div> : null
                            }
                          </div>
                        </div>
                      </div>
                      <div className='field'>
                        <div className='row'>
                          <div className='col no-padding s12'>
                            <div className='field-title'>
                              <div htmlFor="sample_memory" className='read-count-label'>
                                Sample memory (in MB)
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className='row input-row'>
                          <div className='col no-padding s12'>
                            <input id='sample_memory' type='text' className='browser-default' ref= "memory" value={this.state.selectedMemory} placeholder='240000' onChange={ this.handleMemoryChange } />
                            {
                              (this.state.errors.memory) ?
                                <div className='field-error'>
                                  {this.state.errors.memory}
                                </div> : null
                            }
                          </div>
                        </div>
                      </div>
                    </div> :
                    null
                }
                <div className='field'>
                  <div className='row'>
                    <div className='col no-padding s12'>
                      { (this.state.submitting) ?
                        <button type='button' disabled className='new-button blue-button upload-samples-button'>
                          <i className='fa fa-spinner fa-spin fa-lg'/>
                        </button> :
                        <button type='submit' onClick={ this.handleUpload } className='new-button blue-button upload-samples-button'>
                          Upload sample
                        </button>
                      }
                      <button type='button' onClick={() => window.history.back()} className='new-button skyblue-button'>
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
    )
  }
  render() {
    return (
      <div>
        { this.props.selectedSample ? this.renderUpdateForm() : this.renderSampleForm() }
      </div>
    )
  }
}

