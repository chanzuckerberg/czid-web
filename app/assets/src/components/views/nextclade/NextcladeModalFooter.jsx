import React from "react";

import { withAnalytics } from "~/api/analytics";
import LoadingMessage from "~/components/common/LoadingMessage";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import cs from "~/components/views/nextclade/nextclade_modal_footer.scss";
import AccordionNotification from "~ui/notifications/AccordionNotification";
import Notification from "~ui/notifications/Notification";

import PropTypes from "~utils/propTypes";

const NextcladeModalFooter = ({
  hasValidIds,
  invalidSampleNames,
  loading,
  onClick,
  nonSarsCov2SampleNames,
  validationError,
}) => {
  const renderAccordionNotification = ({
    message,
    description,
    list,
    type = "warning",
  }) => {
    const header = (
      <div>
        <span className={cs.highlight}>{message}</span>
        {description}
      </div>
    );

    const content = (
      <span>
        {list.map((name, index) => {
          return (
            <div key={`${name}-${index}`} className={cs.messageLine}>
              {name}
            </div>
          );
        })}
      </span>
    );

    return (
      <AccordionNotification
        header={header}
        content={content}
        open={false}
        type={type}
        displayStyle="flat"
      />
    );
  };

  const renderNotification = ({ message, type }) => {
    return (
      <div className={cs.notificationContainer}>
        <Notification type={type} displayStyle="flat">
          <div className={cs.errorMessage}>{message}</div>
        </Notification>
      </div>
    );
  };

  const renderInvalidSamplesWarning = () => {
    return renderAccordionNotification({
      message: `${invalidSampleNames.length} consensus genome${
        invalidSampleNames.length > 1 ? "s" : ""
      } won't be sent to Nextclade`,
      description: ", because they either failed or are still processing:",
      list: invalidSampleNames,
    });
  };

  const renderValidationError = () => {
    if (!loading && validationError) {
      renderNotification({
        message:
          "An error occurred when verifying your selected consensus genomes.",
        type: "error",
      });
    }
  };

  const renderViewQCInNextcladeButton = () => {
    return (
      <PrimaryButton
        disabled={loading || !hasValidIds}
        text="View QC in Nextclade"
        onClick={withAnalytics(
          onClick,
          "NextcladeModalFooter_view-qc-in-nextclade-button_clicked",
        )}
      />
    );
  };

  const renderInvalidSamplesNotifications = () => {
    if (!loading) {
      if (!hasValidIds) {
        return renderNotification({
          message:
            "No valid consensus genomes to upload to Nextclade because they either failed or are still processing.",
          type: "error",
        });
      } else if (invalidSampleNames.length > 0) {
        return renderInvalidSamplesWarning();
      }
    }
  };

  const renderNonSARSCov2Warning = () => {
    if (!loading && nonSarsCov2SampleNames.length > 0) {
      return renderAccordionNotification({
        message: `${nonSarsCov2SampleNames.length} consensus genome${
          nonSarsCov2SampleNames.length > 1 ? "s" : ""
        } won't be sent to Nextclade`,
        description:
          ", because Nextclade only accepts SARS-CoV-2 genomes currently:",
        list: nonSarsCov2SampleNames,
      });
    }
  };

  return (
    <div className={cs.footer}>
      <div className={cs.notifications}>
        {loading && (
          <LoadingMessage message="Validating consensus genomes..." className={cs.loading}/>
        )}
        {renderValidationError()}
        {renderInvalidSamplesNotifications()}
        {renderNonSARSCov2Warning()}
      </div>
      {renderViewQCInNextcladeButton()}
    </div>
  );
};

NextcladeModalFooter.propTypes = {
  description: PropTypes.string,
  invalidSampleNames: PropTypes.arrayOf(PropTypes.string),
  hasValidIds: PropTypes.bool,
  list: PropTypes.arrayOf(PropTypes.string),
  loading: PropTypes.bool,
  message: PropTypes.string,
  onClick: PropTypes.func,
  nonSarsCov2SampleNames: PropTypes.arrayOf(PropTypes.string),
  type: PropTypes.string,
  validationError: PropTypes.string,
};

export default NextcladeModalFooter;
