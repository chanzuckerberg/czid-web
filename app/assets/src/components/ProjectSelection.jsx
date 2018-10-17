import React from "react";
import axios from "axios";
import Nanobar from "nanobar";

/**
 @class ProjectSelection
 @desc Creates react component to handle filtering in the page
 */

class ProjectSelection extends React.Component {
  constructor(props) {
    super(props);
    this.nanobar = new Nanobar({
      id: "prog-bar",
      class: "prog-bar"
    });
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
      selectedProjectId: this.fetchParams("project_id") || null
    };
  }

  componentDidMount() {
    this.reformatProjectList(this.favoriteProjects, this.allProjects);
  }

  fetchParams(param) {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  toggleDisplayProjects() {
    this.setState(prevState => ({ showLess: !prevState.showLess }));
  }

  toggleDisplayFavProjects() {
    this.setState(prevState => ({
      showLessFavorites: !prevState.showLessFavorites
    }));
  }

  toggleFavorite(e) {
    e.stopPropagation();
    let favStatus = e.target.getAttribute("data-fav");
    let projectId = e.target.getAttribute("data-id");
    this.nanobar.go(30);
    axios
      .put(
        `/projects/${projectId}/${
          favStatus == "true" ? "remove_favorite" : "add_favorite"
        }?`,
        {
          authenticity_token: this.csrf
        }
      )
      .then(() => {
        this.nanobar.go(100);
        this.projectInFavorites(projectId, this.state.formattedProjectList);
      })
      .catch(err => {});
  }

  reformatProjectList(favorites, allProjects) {
    let favProjects = [];
    let favIds = [];
    if (favorites.length) {
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
        project.favorited = !project.favorited;
      }

      return project;
    });

    this.setState({ formattedProjectList: updatedList });

    return updatedList;
  }

  // check existence of projects in favorites projects list
  // if true then remove else add
  projectInFavorites(id, projects) {
    if (this.state.favIds.includes(parseInt(id))) {
      this.removeProjectFromFavorites(id);
    } else {
      this.addProjectToFavorites(id, projects);
    }
    this.updateProjectsState(id, projects);
  }

  // remove Projects from favorites list
  removeProjectFromFavorites(id) {
    let updatedFavouriteProjects = this.state.formattedFavProjectList.filter(
      project => project.id != id
    );
    let removedFavouriteProject = this.state.formattedFavProjectList.filter(
      project => project.id == id
    );

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
      formattedFavProjectList: [
        ...this.state.formattedFavProjectList,
        ...updatedProject
      ],
      favIds: [...this.state.favIds, updatedProject[0].id]
    });
  }

  handleProjectClick(e) {
    let id = e.target.getAttribute("data-id");
    let listType = e.target.getAttribute("data-type") || null;
    this.props.selectProject(id, listType);
    this.state.selectedProjectId = id;
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

    const favProjects = this.state.formattedFavProjectList.sort(sortLogic);

    let favSection = <div />;
    if (favProjects.length) {
      favSection = (
        <div className="row fav-row">
          <div className="title fav-title">Favorite Projects</div>
          <div className="fav-projects-wrapper projects-wrapper">
            {favProjects.map((project, i) => {
              return (
                <ProjectInSelector
                  parent={this}
                  project={project}
                  i={i}
                  favorite={true}
                />
              );
            })}
          </div>
        </div>
      );
    }

    function ProjectInSelector({ parent, project, i, favorite }) {
      return (
        <div
          className={
            "project-item " +
            (parent.state.selectedProjectId == project.id ? "highlight" : "")
          }
          onClick={parent.handleProjectClick}
          data-id={project.id}
          data-type={favorite ? "favorite" : ""}
          key={i}
        >
          <div className="row label-row">
            <span
              className="project-label no-padding col s10"
              data-id={project.id}
            >
              {project.name}
            </span>
            <span className="icon-container no-padding col s2">
              <i
                data-status="favorite"
                data-fav={project.favorited}
                data-id={project.id}
                onClick={parent.toggleFavorite}
                className={
                  "favorite fa fa-star" +
                  (!project.favorited ? "-o" : "") +
                  " right hidden"
                }
              />
            </span>
          </div>
        </div>
      );
    }

    let ProjectList = this.state.formattedProjectList
      .sort(sortLogic)
      .filter(project => !project.favorited);
    if (this.state.showLess) ProjectList = ProjectList.slice(0, 8);

    const all_projects_section = (
      <div className="projects">
        <div data-title="allprojects" className="title">
          All Projects
        </div>
        <div className="projects-wrapper">
          {!ProjectList.length ? (
            <div className="title">None</div>
          ) : (
            ProjectList.map((project, i) => {
              return (
                <ProjectInSelector
                  parent={this}
                  project={project}
                  i={i}
                  key={i}
                  favorite={false}
                />
              );
            })
          )}
          {ProjectList.length > 7 ? (
            <div className="more" onClick={this.toggleDisplayProjects}>
              {this.state.showLess ? "Show More..." : "Show Less..."}
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
    );
    return (
      <div className="project-wrapper">
        <div className="row">
          <div className="col no-padding s12">
            <div className="projects-wrapper">
              <div
                className={
                  "all-samples project-item " +
                  (!this.state.selectedProjectId ? "highlight" : "")
                }
                onClick={this.handleProjectClick}
              >
                <span className="project-label">All Samples</span>
              </div>
            </div>
          </div>
          {favSection}
          {all_projects_section}
        </div>
      </div>
    );
  }

  render() {
    return <div>{this.renderProjectSection()}</div>;
  }
}
export default ProjectSelection;
