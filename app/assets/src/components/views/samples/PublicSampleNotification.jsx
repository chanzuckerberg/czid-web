import React from "react";
import PropTypes from "prop-types";
import NotificationComponent from "~ui/containers/NotificationComponent";
import { minBy } from "lodash";
import moment from "moment";
import cs from "./public_sample_notification.scss";
import cx from "classnames";

class PublicSampleNotification extends React.Component {
  state = { activeIndex: null };

  handleClick = index => {
    this.setState({
      activeIndex: this.state.activeIndex == index ? null : index
    });
  };

  render() {
    const { activeIndex } = this.state;
    const { samples, projectName, onClose } = this.props;

    let minTimestamp = minBy(samples, sample => moment(sample.private_until));
    return (
      <NotificationComponent
        type="warn"
        onClose={onClose}
        className={cs.publicSampleNotification}
      >
        <div className={cs.text}>
          <span className={cs.highlight}>
            {samples.length} sample{samples.length > 1 ? "s" : ""}
          </span>&nbsp;of project{" "}
          <span className={cs.highlight}>{projectName}</span> will become public
          soon starting on &nbsp;
          <span className={cs.highlight}>
            {moment(minTimestamp.private_until).format("MMM Do, YYYY")}
          </span>. If you have any questions, please refer to IDseq's&nbsp;
          <a
            className={cs.policyLink}
            onClick={() => window.open("https://assets.idseq.net/Privacy.pdf")}
          >
            privacy policy
          </a>
          &nbsp;or{" "}
          <a className={cs.emailLink} href="mailto:help@idseq.com">
            email us
          </a>
        </div>

        <div className={cs.accordion}>
          <div
            className={cx(cs.accordionOption, {
              [cs.active]: activeIndex === 0
            })}
            onClick={() => this.handleClick(0)}
          >
            <div className={cs.title}>
              {samples.length} sample{samples.length > 1 ? "s" : ""}
              <i
                className={cx(
                  "fa",
                  activeIndex === 0 ? "fa-angle-up" : "fa-angle-down",
                  cs.icon
                )}
              />
            </div>
            <div className={cs.content}>
              {samples.map(sample => (
                <div key={sample.id} className={cs.sampleEntry}>
                  {sample.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </NotificationComponent>
    );
  }
}

PublicSampleNotification.propTypes = {
  projectName: PropTypes.string.isRequired,
  samples: PropTypes.array.isRequired,
  onClose: PropTypes.func
};

export default PublicSampleNotification;
