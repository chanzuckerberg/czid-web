import React from "react";
import PropTypes from "~utils/propTypes";

import IconLoading from "~/components/ui/icons/IconLoading";
import AccordionNotification from "~ui/notifications/AccordionNotification";
import Notification from "~ui/notifications/Notification";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";

import cs from "~/components/views/nextclade/nextclade_modal_footer.scss";

const NextcladeModalFooter = ({
  invalidSampleNames,
  loading,
  onClick,
  validationError,
  validSampleIds,
}) => {
  const renderInvalidSamplesWarning = () => {
    const header = (
      <div>
        <span className={cs.highlight}>
          {invalidSampleNames.length} sample
          {invalidSampleNames.length > 1 ? "s" : ""} won't be sent to Nextclade
        </span>
        , because they either failed or are still processing:
      </div>
    );

    const content = (
      <span>
        {invalidSampleNames.map((name, index) => {
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
        type="warning"
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

  const renderValidationError = () => {
    if (!loading && validationError) {
      renderNotification({
        message: "An error occurred when verifying your selected samples.",
        type: "error",
      });
    }
  };

  const renderViewQCInNextcladeButton = () => {
    return (
      <PrimaryButton
        disabled={loading || validSampleIds.size === 0}
        text="View QC in Nextclade"
        onClick={onClick}
      />
    );
  };

  const renderInvalidSamplesNotifications = () => {
    if (!loading) {
      if (validSampleIds.size === 0) {
        return renderNotification({
          message:
            "No valid samples to upload to Nextclade because they either failed or are still processing.",
          type: "error",
        });
      } else if (invalidSampleNames.length > 0) {
        return renderInvalidSamplesWarning();
      }
    }
  };

  return (
    <div className={cs.footer}>
      <div className={cs.notifications}>
        {loading && (
          <div className={cs.loading}>
            <IconLoading className={cs.loadingIcon} />
            {" Validating samples..."}
          </div>
        )}
        {renderValidationError()}
        {renderInvalidSamplesNotifications()}
      </div>
      {renderViewQCInNextcladeButton()}
    </div>
  );
};

NextcladeModalFooter.propTypes = {
  onClick: PropTypes.func,
  validSampleIds: PropTypes.instanceOf(Set).isRequired,
  invalidSampleNames: PropTypes.arrayOf(PropTypes.string),
  validationError: PropTypes.string,
};

export default NextcladeModalFooter;
