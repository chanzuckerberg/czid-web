import React from "react";
import LoadingMessage from "~/components/common/LoadingMessage";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import cs from "~/components/views/nextclade/nextclade_modal_footer.scss";
import AccordionNotification from "~ui/notifications/AccordionNotification";
import Notification from "~ui/notifications/Notification";

interface NextcladeModalFooterProps {
  description?: string;
  invalidSampleNames?: string[];
  hasValidIds?: boolean;
  list?: string[];
  loading?: boolean;
  message?: string;
  onClick?: $TSFixMeFunction;
  samplesNotSentToNextclade?: string[];
  type?: "warning" | "error" | "success" | "info";
  validationError?: string;
}

const NextcladeModalFooter = ({
  hasValidIds,
  invalidSampleNames,
  loading,
  onClick,
  samplesNotSentToNextclade,
  validationError,
}: NextcladeModalFooterProps) => {
  const renderAccordionNotification = ({
    message,
    description,
    list,
    type = "warning" as const,
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
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      message: `${invalidSampleNames.length} consensus genome${
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
    } else {
      return null;
    }
  };

  const renderViewQCInNextcladeButton = () => {
    return (
      <PrimaryButton
        disabled={loading || !hasValidIds}
        text="View QC in Nextclade"
        onClick={onClick}
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
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      } else if (invalidSampleNames.length > 0) {
        return renderInvalidSamplesWarning();
      }
    }
  };

  const renderNonSARSCov2Warning = () => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    if (!loading && samplesNotSentToNextclade.length > 0) {
      return renderAccordionNotification({
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        message: `${samplesNotSentToNextclade.length} consensus genome${
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          samplesNotSentToNextclade.length > 1 ? "s" : ""
        } won't be sent to Nextclade`,
        description:
          ", because Nextclade only accepts SARS-CoV-2 genomes currently:",
        list: samplesNotSentToNextclade,
      });
    }
  };

  return (
    <div className={cs.footer}>
      <div className={cs.notifications}>
        {loading && (
          <LoadingMessage
            message="Validating consensus genomes..."
            className={cs.loading}
          />
        )}
        {renderValidationError()}
        {renderInvalidSamplesNotifications()}
        {renderNonSARSCov2Warning()}
      </div>
      {renderViewQCInNextcladeButton()}
    </div>
  );
};

export default NextcladeModalFooter;
