import React from "react";
import PropTypes from "prop-types";
import { keys, countBy, mapValues, keyBy, map } from "lodash/fp";
import cx from "classnames";

import { openUrlInNewTab } from "~/components/utils/links";
import { logAnalyticsEvent } from "~/api/analytics";
import AlertIcon from "~ui/icons/AlertIcon";
import Accordion from "~/components/layout/Accordion";
import Notification from "~ui/notifications/Notification";

import cs from "./host_organism_message.scss";

/**
 * Shows a message depending on whether the selected host matches a
 * IDseq-supported host.
 */
export default class HostOrganismMessage extends React.Component {
  hasMatch(host) {
    return map("name", this.props.hostGenomes).includes(host);
  }

  renderOneHost(host, count) {
    return (
      <Notification
        type="info"
        displayStyle="flat"
        className={cs.messageContainer}
      >
        <strong>Host Subtraction:</strong>{" "}
        {!this.hasMatch(host) &&
          " We don't have any hosts matching your selection."}
        {this.renderTextLine(host, count)} {this.renderLearnMoreLink()}.
      </Notification>
    );
  }

  renderLearnMoreLink() {
    return (
      <a
        className={cs.link}
        target="_blank"
        rel="noopener noreferrer"
        href="https://help.idseq.net/"
        onClick={() =>
          logAnalyticsEvent("HostOrganismMessage_learn-more-link_clicked")
        }
      >
        Learn more
      </a>
    );
  }

  renderTextLine(host, count) {
    return (
      <span>
        {" "}
        For the{" "}
        <strong>
          {count} sample{count > 1 ? "s" : ""}
        </strong>{" "}
        {this.renderHostPhrase(host, count)}{" "}
        {this.hasMatch(host) && !this.isERCC(host) ? (
          <span>
            we will subtract out reads that align to a <strong>{host}</strong>{" "}
            genome
          </span>
        ) : (
          <span>we will only remove ERCCs</span>
        )}
        {host !== "Human" && " and reads that align to the human genome"}.
      </span>
    );
  }

  isERCC(host) {
    return host.toLowerCase() === "ercc only";
  }

  renderHostPhrase(host, count) {
    // special case explict choice of ERCC to avoid awkward phrasing
    return (
      <span>
        {this.isERCC(host) ? (
          <span>that you indicated {count > 1 ? "are" : "is"} ERCC Only</span>
        ) : (
          <span>
            that you indicated {count > 1 ? "are" : "is"} from a{" "}
            <strong>{host}</strong> Host Organism
          </span>
        )},
      </span>
    );
  }

  renderManyHosts(uniqHosts) {
    // Strangely, the " " spaces are not being ending up in the header so
    // we use &nbsp;
    const header = (
      <Notification
        type="info"
        displayStyle="flat"
        className={cs.messageContainer}
      >
        <strong>Host Subtraction:</strong>
        &nbsp;Based on your selections for Host Organism, we will subtract out
        reads from your samples that align to different genomes. &nbsp;<a
          href="#"
          className={cs.link}
        >
          Click for more details.
        </a>
      </Notification>
    );
    return (
      <Accordion
        bottomContentPadding
        header={header}
        open={true}
        className={cs.listContainer}
      >
        {keys(uniqHosts).map(host => (
          <div key={host} className={cs.messageLine}>
            {this.renderTextLine(host, uniqHosts[host])}
          </div>
        ))}
      </Accordion>
    );
  }

  getSelectedHostOrganisms() {
    const idToName = mapValues("name", keyBy("id", this.props.hostGenomes));
    return this.props.samples.map(sample => idToName[sample.host_genome_id]);
  }

  render() {
    const uniqHosts = countBy(null, this.getSelectedHostOrganisms());
    const length = keys(uniqHosts).length;
    if (length === 0) {
      return null;
    }
    if (length === 1) {
      const host = keys(uniqHosts)[0];
      return this.renderOneHost(host, uniqHosts[host]);
    }
    return this.renderManyHosts(uniqHosts);
  }
}

HostOrganismMessage.propTypes = {
  samples: PropTypes.arrayOf(
    PropTypes.shape({ host_genome_id: PropTypes.number })
  ).isRequired,
  hostGenomes: PropTypes.arrayOf(PropTypes.HostGenome).isRequired,
};
