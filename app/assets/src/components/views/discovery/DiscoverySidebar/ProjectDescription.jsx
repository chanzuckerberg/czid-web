import React from "react";
import cx from "classnames";
import cs from "./project_description.scss";

import PropTypes from "prop-types";
import { Accordion } from "~/components/layout";

import { MAX_DESCRIPTION_LENGTH } from "~/components/views/projects/constants";

class ProjectDescription extends React.Component {
  constructor(props) {
    super(props);

    this.toggleDisplayDescription = this.toggleDisplayDescription.bind(this);

    this.state = {
      description: props.project.description,
      showLess: true,
    };
  }

  toggleDisplayDescription() {
    this.setState(prevState => ({ showLess: !prevState.showLess }));
  }

  render() {
    const { description, showLess } = this.state;
    const cutoffLength = MAX_DESCRIPTION_LENGTH / 2;
    const shouldTruncateDescription = description
      ? description.length > cutoffLength
      : false;

    return (
      <Accordion
        className={cs.descriptionContainer}
        bottomContentPadding
        open={true}
        header={<div className={cs.title}>Description</div>}
      >
        {description ? (
          <div>
            <div
              className={cx(
                shouldTruncateDescription && showLess && cs.truncated
              )}
            >
              {description}
            </div>
            {shouldTruncateDescription && (
              <div
                className={cs.showHide}
                onClick={this.toggleDisplayDescription}
              >
                {showLess ? "Show More" : "Show Less"}
              </div>
            )}
          </div>
        ) : (
          <div>No description.</div>
        )}
      </Accordion>
    );
  }
}

ProjectDescription.propTypes = {
  project: PropTypes.object.isRequired,
};

export default ProjectDescription;
