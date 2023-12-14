import { PageObject } from "./page-object";

export class ProjectPage extends PageObject {

  // #region Api
  public async getOrCreateProject(projectName: string) {
    let project = await this.getProjects(projectName);
    if (project.length < 1) {
      const payload = {
        "project":{
          "name": projectName,
          "public_access": 1, // Public
          "description": "created by automation",
        },
      };
      await this.page.context().request.post(
        `${process.env.BASEURL}/projects.json`, {data: payload},
      );
      project = await this.getProjects(projectName);
    }
    return project.filter(p => p.name === projectName)[0];
  }

  public async getProjects(searchTerm: string) {
    const response = await this.page.context().request.get(
      `${process.env.BASEURL}/projects.json?search=${searchTerm}`,
    );
    const responseJson = await response.json();
    return responseJson.projects;
  }

  public async getProjectByName(projectName: string) {
    const projects = await this.getProjects(projectName);
    return projects.length >= 1 ? projects.filter(p => p.name === projectName)[0] : null;
  }

  public async getPublicProjects() {
    const response = await this.page.context().request.get(
      `${process.env.BASEURL}/projects.json?domain=public`,
    );
    const responseJson = await response.json();
    return responseJson.projects;
  }
  // #endregion Api

}