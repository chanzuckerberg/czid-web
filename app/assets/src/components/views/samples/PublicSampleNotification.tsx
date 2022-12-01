import { minBy, map } from "lodash/fp";
import moment from "moment";
import React from "react";
import { DateString } from "~/interface/shared";
import ListNotification from "~ui/notifications/ListNotification";
import cs from "./public_sample_notification.scss";

interface PublicSampleNotificationProps {
  projectName: string;
  samples: { private_until: DateString }[];
  onClose?: $TSFixMeFunction;
}

class PublicSampleNotification extends React.Component<
  PublicSampleNotificationProps
> {
  render() {
    const { samples, projectName, onClose } = this.props;

    const minTimestamp = minBy(sample => moment(sample.private_until), samples);

    const label = (
      <React.Fragment>
        <span className={cs.highlight}>
          {samples.length} sample{samples.length > 1 ? "s" : ""}
        </span>
        &nbsp;of project <span className={cs.highlight}>{projectName}</span>{" "}
        will become public soon starting on &nbsp;
        <span className={cs.highlight}>
          {moment(minTimestamp.private_until).format("MMM Do, YYYY")}
        </span>
        . If you have any questions, please refer to CZ ID&apos;s&nbsp;
        <a
          className={cs.policyLink}
          href="https://czid.org/privacy"
          target="_blank"
          rel="noreferrer"
        >
          privacy notice
        </a>
        &nbsp;or{" "}
        <a className={cs.emailLink} href="mailto:help@czid.org">
          email us
        </a>
      </React.Fragment>
    );

    return (
      <ListNotification
        className={cs.publicSampleNotification}
        onClose={onClose}
        type="warning"
        label={label}
        listItemName="sample"
        listItems={map("name", samples)}
      />
    );
  }
}

export default PublicSampleNotification;
