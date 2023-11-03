import { Icon } from "@czi-sds/components";
import { assign, find } from "lodash/fp";
import React from "react";
import { saveProjectName, validateProjectName } from "~/api";
import ProjectInfoIconTooltip from "~/components/common/ProjectInfoIconTooltip";
import EditableInput from "~/components/ui/controls/EditableInput";
import ProjectSettingsModal from "~/components/views/samples/ProjectSettingsModal";
import ProjectUploadMenu from "~/components/views/samples/ProjectUploadMenu";
import { DateString, Project } from "~/interface/shared";
import cs from "./project_header.scss";

interface ProjectHeaderProps {
  fetchedSamples?: { privateUntil: DateString }[];
  onMetadataUpdated?: $TSFixMeFunction;
  onProjectUpdated?: $TSFixMeFunction;
  project: Project | Record<string, never>;
  snapshotProjectName?: string;
  workflow?: string;
}

const ProjectHeader = ({
  project,
  snapshotProjectName,
  onProjectUpdated,
  onMetadataUpdated,
  workflow,
}: ProjectHeaderProps) => {
  const handleProjectUserAdded = (username: string, email: string) => {
    const userFound = find({ email }, project.users);
    if (!userFound) {
      const newProject = assign(project, {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2488
        users: [...project.users, { name: username, email }],
      });
      onProjectUpdated && onProjectUpdated({ project: newProject });
    }
  };

  const handleProjectPublished = () => {
    const newProject = assign(project, {
      public_access: 1,
    });
    onProjectUpdated && onProjectUpdated({ project: newProject });
  };

  const handleProjectRename = async (
    name: string,
  ): Promise<[string, string]> => {
    if (name === project.name) return ["", name];

    const { valid, sanitizedName, message } = await validateProjectName(
      project.id,
      name,
    );
    if (!valid) return [message, name];

    let error = "";

    try {
      await saveProjectName(project.id, sanitizedName);
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
      onMetadataUpdated();
    } catch (e) {
      error = "There was an error renaming your project.";
    }
    return [error, sanitizedName];
  };

  const getWarningMessage = inputText => {
    const specialCharacters = /[^A-Za-z0-9_\- ]/g;
    if (specialCharacters.test(inputText)) {
      return 'The special character(s) you entered will be converted to "-"';
    } else {
      return "";
    }
  };

  return (
    <div data-testid="project-header" className={cs.projectHeader}>
      {project.editable ? (
        <EditableInput
          value={project.name || snapshotProjectName}
          className={cs.name}
          onDoneEditing={handleProjectRename}
          getWarningMessage={getWarningMessage}
        />
      ) : (
        <div className={cs.name}>{project.name || snapshotProjectName}</div>
      )}
      <div className={cs.fillIn} />
      {snapshotProjectName ? (
        <div className={cs.item}>
          <Icon
            className={cs.icon}
            sdsIcon="eyeOpen"
            sdsSize="s"
            sdsType="static"
          />{" "}
          View-only version
        </div>
      ) : project.public_access ? (
        <div className={cs.item}>
          <Icon
            className={cs.icon}
            sdsIcon="globe"
            sdsSize="s"
            sdsType="static"
          />{" "}
          Public project
        </div>
      ) : (
        <div className={cs.item}>
          <Icon
            className={cs.icon}
            sdsIcon="lock"
            sdsSize="s"
            sdsType="static"
          />{" "}
          Private project
        </div>
      )}
      {project.editable && (
        <React.Fragment>
          <ProjectInfoIconTooltip isPublic={project.public_access === 1} />
          <div className={cs.item}>
            <Icon
              className={cs.icon}
              sdsIcon="people"
              sdsSize="s"
              sdsType="static"
            />{" "}
            {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
            {project.users.length
              ? // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
                `${project.users.length} member${
                  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
                  project.users.length > 1 ? "s" : ""
                }`
              : "No members"}
          </div>
          <div className={cs.item}>
            <ProjectSettingsModal
              // TODO(tiago): remove csrf by restructuring api calls within ProjectSettingsModal
              // @ts-expect-error Property 'content' does not exist on type 'HTMLElement'
              csrf={document.getElementsByName("csrf-token")[0].content}
              onUserAdded={handleProjectUserAdded}
              onProjectPublished={handleProjectPublished}
              project={project}
              users={project.users}
            />
          </div>
        </React.Fragment>
      )}

      {project.editable && (
        <div className={cs.item}>
          <ProjectUploadMenu
            project={project}
            onMetadataUpdated={onMetadataUpdated}
            workflow={workflow}
          />
        </div>
      )}
    </div>
  );
};

export default ProjectHeader;
