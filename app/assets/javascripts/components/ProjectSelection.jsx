/**
 @class ProjectSelection
 @desc Creates react component to handle filtering in the page
 */

 class ProjectSelection extends React.Component {
  constructor(props) {
    super(props);
    this.csrf = props.csrf;
    this.favoriteProjects = props.favoriteProjects;
    this.allProjects = props.allProjects;
    this.toggleDisplayProjects = this.toggleDisplayProjects.bind(this);
    this.toggleDisplayFavProjects = this.toggleDisplayFavProjects.bind(this);
    this.toggleFavorite = this.toggleFavorite.bind(this);
    this.handleProjectClick = this.handleProjectClick.bind(this);
    
    this.state = {
      formattedProjectList: [],
      formattedFavProjectList: [],
      favIds: [],
      showLess: true,
      showLessFavorites: true,
      selectedProjectId: this.fetchParams('project_id') || null,
    };
  }

  componentDidMount() {
    this.reformatProjectList(this.favoriteProjects, this.allProjects)
  }

  fetchParams(param) {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param)
  }

  toggleDisplayProjects() {
    this.setState((prevState) => ({ showLess: !prevState.showLess }))
  }

  toggleDisplayFavProjects() {
    this.setState((prevState) => ({ showLessFavorites: !prevState.showLessFavorites }))
  }

  toggleFavorite(e) {
    let favStatus = e.target.getAttribute('data-fav');
    let projectId = e.target.getAttribute('data-id');
    Samples.showLoading(`${favStatus == 'true' ? 'Removing from' : 'Adding to' } favorites...`)
    axios
      .put(`/projects/${projectId}/${favStatus == 'true' ? 'remove_favorite' : 'add_favorite' }?`, {
        authenticity_token: this.csrf
      })
      .then((res) => {
        Samples.hideLoader();
        this.checkIfProjecExistInFavorites(projectId, this.state.formattedProjectList);
      }).catch((err) => {
        Samples.hideLoader();
    })
  }

  reformatProjectList(favorites, allProjects) {
    let favProjects = [];
    let favIds = [];
    if(favorites.length) {
      favIds = favorites.map(e => e.id);
    }
    let formattedList = allProjects.map(e => {
      let project = e;

      if (!project.favorited) {
        project.favorited = favIds.includes(project.id);

        if (project.favorited) {
          favProjects.push(project);
        }
      } 

      return project;
    });

    this.setState({ 
      formattedProjectList: formattedList,
      formattedFavProjectList: favProjects,
      favIds: favIds
    });

    return formattedList;
  }

  // update
  updateProjectsState(id, projects) {
    let updatedList = projects.map(project => {
      if (project.id == id) {
        project.favorited = !project.favorited
      }

      return project;
    });

    this.setState({ formattedProjectList: updatedList });

    return updatedList;
  }

  // check existence of projects in favorites projects list
  // if true then remove else add
  checkIfProjecExistInFavorites(id, projects) {
    if (this.state.favIds.includes(parseInt(id))) {
      this.removeProjectFromFavorites(id);
    } else {
      this.addProjectToFavorites(id, projects);
    }
    this.updateProjectsState(id, projects);
  }

  
  // remove Projects from favorites list
  removeProjectFromFavorites(id) {
    let updatedFavouriteProjects = this.state.formattedFavProjectList.filter(project => project.id != id);
    let removedFavouriteProject = this.state.formattedFavProjectList.filter(project => project.id == id);
    
    let favIds = this.state.favIds;
    let projectIdIndex = favIds.indexOf(removedFavouriteProject[0].id);
    
    if (projectIdIndex > -1) {
      favIds.splice(projectIdIndex, 1);
      this.setState({ 
        formattedFavProjectList: updatedFavouriteProjects,
        favIds
      });
    }
  }

  // add Projects to favorites list
  addProjectToFavorites(id, projects) {
    let updatedProject = projects.filter(project => project.id == id);

    this.setState({
        formattedFavProjectList: [...this.state.formattedFavProjectList, ...updatedProject],
        favIds: [...this.state.favIds, updatedProject[0].id]
    });
  }


  handleProjectClick(e) {
    let id = e.target.getAttribute('data-id');
    let listType = e.target.getAttribute('data-type');
    if (listType == 'fav') {
      this.highlightSelectedFavoriteProject(id) 
    } else {
      this.highlightSelectedProject(id);
    }
    this.props.selectProject(id);
  }

  highlightSelectedProject(id) {
    this.removeHighlight();
    $(`.project-item[data-id="${id}"]`).addClass('highlight');
  }

  removeHighlight() {
    $('.fav-item').removeClass('highlight')
    $('.project-item').removeClass('highlight')
  }

  highlightSelectedFavoriteProject(id) {
    this.removeHighlight();
    $(`.fav-item[data-id="${id}"]`).addClass('highlight');
  } 


  addFavIconClass(project) {
    return (
      <i data-status="favorite" data-fav={project.favorited} data-id={project.id} onClick={this.toggleFavorite} className={!project.favorited ? "favorite fa fa-star-o":  "favorite fa fa-star"}></i>
    )
  }

  renderProjectSection() {
    const sortLogic = (a, b) => {
      var nameA = a.name.toUpperCase(); // ignore upper and lowercase
      var nameB = b.name.toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      // names must be equal
      return 0;
    };

    const fav_section = (
      <div className="row fav-row">
        <span className="title">Favorite Projects</span>
        <hr/>
        <div className="fav-projects-wrapper">
          {!this.state.formattedFavProjectList.length ? <div className="none">None</div>: this.state.showLessFavorites ? this.state.formattedFavProjectList.sort(sortLogic).slice(0,4).map((project, i) => {
            return (
              <div className="fav-item" data-id={project.id}  key={i}><div onClick={this.handleProjectClick} data-id={project.id}><span data-id={project.id}>{project.name}</span></div>{this.addFavIconClass(project)}</div>
            )
          }): 
          this.state.formattedFavProjectList.sort(sortLogic).map((project, i) => {
            return (
              <div className="fav-item" data-id={project.id}  key={i}><div onClick={this.handleProjectClick} data-id={project.id}><span data-id={project.id}>{project.name}</span></div>{this.addFavIconClass(project)}</div>
            )
          }) }
          { this.state.formattedFavProjectList.length > 4 ? <div className="more" onClick={this.toggleDisplayFavProjects}>{this.state.showLessFavorites ? 'Show More...' : 'Show Less...'}</div> : ''}
        </div>
      </div>
    )

    const all_projects_section = (
      <div className="projects">
        <span onClick={this.handleProjectClick} className="title">All Projects</span>
        <hr/>
        <div className="projects-wrapper">
          { !this.state.formattedProjectList.length ? "None" : this.state.showLess ? this.state.formattedProjectList.sort(sortLogic).slice(0,7).map((project, i) => {
              return (
                  <div className="project-item" data-id={project.id}  key={i}><div onClick={this.handleProjectClick} data-id={project.id}><span data-id={project.id}>{project.name}</span></div>{this.addFavIconClass(project)}</div>
              )
            }) : 
            this.state.formattedProjectList.sort(sortLogic).map((project, i) => {
            return (
              <div className="project-item" data-id={project.id} key={i}><div onClick={this.handleProjectClick} data-id={project.id}><span data-id={project.id}>{project.name}</span></div>{this.addFavIconClass(project)}</div>
            )
          }) }
          { this.state.formattedProjectList.length > 7 ? <div className="more" onClick={this.toggleDisplayProjects}>{this.state.showLess ? 'Show More...' : 'Show Less...'}</div> : ''}
        </div>
      </div>
    )
    return (  
      <div className="project-wrapper">
        <div className="row">
          <div className="samples">
            <p>All Samples</p>
            <span onClick={this.uploadSample}><i className="fa fa-lg fa-plus-circle" aria-hidden="true"></i></span>
          </div>
          { fav_section }
          { all_projects_section }
        </div>
      </div>
    )
  }
  
  render() {
    return (
      <div>
        { this.renderProjectSection() }
      </div>
    )
  }
 }