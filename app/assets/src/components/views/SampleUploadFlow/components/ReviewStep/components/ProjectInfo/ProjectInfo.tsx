import cx from "classnames";
import { Icon } from "czifui";
import React, { useState } from "react";
import { trackEvent } from "~/api/analytics";
import ProjectInfoIconTooltip from "~/components/common/ProjectInfoIconTooltip";
import { Project } from "~/interface/shared";
import { UploadStepType } from "~/interface/upload";
import cs from "./project_info.scss";

interface ProjectTypeProps {
  areLinksEnabled: boolean;
  onLinkClick(link: string): void;
  project: Project;
  uploadType: string;
}

const countNewLines = (text?: string) => {
  // the code for newline in Windows is \r\n
  if (text) {
    return text.split(/\r*\n/).length;
  }
  return 0;
};

const ProjectInfo = ({
  areLinksEnabled,
  onLinkClick,
  project,
  uploadType,
}: ProjectTypeProps) => {
  const [shouldShowLessDescription, setShouldShowLessDescription] =
    useState<boolean>(true);

  const {
    description,
    id,
    name,
    number_of_samples: numberOfSamples,
    public_access: publicAccess,
  } = project;

  const shouldTruncateDescription = countNewLines(description) > 5;
  const isPublicProject = publicAccess === 1;

  return (
    <>
      <div className={cs.reviewHeader}>
        <span className={cs.text}>Project Info</span>
        <div className={cx(cs.links, areLinksEnabled && cs.enabled)}>
          <div
            className={cs.link}
            onClick={() => {
              onLinkClick(UploadStepType.SampleStep);
              trackEvent("ReviewStep_edit-project-link_clicked", {
                projectId: id,
                projectName: name,
                uploadType,
              });
            }}
          >
            Edit Project
          </div>
        </div>
      </div>
      <div className={cs.section}>
        {isPublicProject ? (
          <div className={cs.icon}>
            <Icon sdsIcon="projectPublic" sdsSize="xl" sdsType="static" />
          </div>
        ) : (
          <div className={cs.icon}>
            <Icon sdsIcon="projectPrivate" sdsSize="xl" sdsType="static" />
          </div>
        )}
        <div className={cs.text}>
          <div className={cs.header}>
            <div className={cs.name}>{name}</div>
            <div className={cs.publicAccess}>
              {isPublicProject ? "Public Project" : "Private Project"}
            </div>
            <ProjectInfoIconTooltip
              isPublic={isPublicProject}
              // Offset required to align the carrot of the tooltip accurately on top of the info Icon.
              // This issue is caused by nested div containers being passed to the prop "content" in the BasicPopup component
              // @ts-expect-error Property 'offset' does not exist on type
              offset={[-7, 0]}
              position="top left"
            />
          </div>
          {description && (
            <div className={cs.descriptionContainer}>
              {/* Use showmore/showless pattern if description has many (>4) newlines. */}
              {/* TODO(julie): Consider making a separate component to do this in a
              less hacky way. */}
              <div
                className={cx(
                  shouldTruncateDescription &&
                    shouldShowLessDescription &&
                    cs.truncated,
                )}
              >
                {description}
              </div>
              {shouldTruncateDescription && (
                <div
                  className={cs.showHide}
                  onClick={() =>
                    setShouldShowLessDescription(!shouldShowLessDescription)
                  }
                >
                  {shouldShowLessDescription ? "Show More" : "Show Less"}
                </div>
              )}
            </div>
          )}
          <div className={cs.existingSamples}>
            {numberOfSamples || 0} existing samples in project
          </div>
        </div>
      </div>
    </>
  );
};

export { ProjectInfo };
