import cx from "classnames";
import { capitalize, every, keys, countBy, map } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";

import Accordion from "~/components/layout/Accordion";
import ExternalLink from "~ui/controls/ExternalLink";
import Notification from "~ui/notifications/Notification";

import cs from "./host_organism_message.scss";

/**
 * Shows a message depending on whether the selected host matches a
 * IDseq-supported host.
 */
export default class HostOrganismMessage extends React.Component {
  // By design, host names are case insensitive, so we don't
  // get duplicates.
  hasMatch = host => {
    const filtered = this.props.hostGenomes.filter(
      hg => this.isERCC(hg.name) || !(hg.ercc_only || hg["ercc_only?"])
    );
    return map(hg => hg.name.toLowerCase(), filtered).includes(
      host.toLowerCase()
    );
  };

  renderOneHost(host, count) {
    return (
      <Notification
        type={this.hasMatch(host) ? "info" : "warning"}
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
      <ExternalLink
        className={cs.link}
        href="https://chanzuckerberg.zendesk.com/hc/en-us/articles/360035296573-Upload-on-the-Web#reviewing-data"
        analyticsEventName="HostOrganismMessage_learn-more-link_clicked"
      >
        Learn more
      </ExternalLink>
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
            we will subtract out reads that align to a{" "}
            <strong>{capitalize(host)}</strong> genome
          </span>
        ) : (
          <span>we will only remove ERCCs</span>
        )}
        {host.toLowerCase() !== "human" &&
          " and reads that align to the human genome"}
        .
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
        )}
        ,
      </span>
    );
  }

  renderManyHosts(uniqHosts) {
    // Strangely, the " " spaces are not being ending up in the header so
    // we use &nbsp;
    const isWarn = !every(this.hasMatch, keys(uniqHosts));
    const color = { [cs.warn]: isWarn };
    const header = (
      <Notification
        type={isWarn ? "warning" : "info"}
        displayStyle="flat"
        className={cs.messageContainer}
      >
        <strong>Host Subtraction:</strong>
        &nbsp;Based on your selections for Host Organism, we will subtract out
        reads from your samples that align to different genomes.{" "}
        {this.renderLearnMoreLink()}.
      </Notification>
    );
    return (
      <Accordion
        bottomContentPadding
        header={header}
        open={false}
        className={cx(cs.listContainer, color)}
      >
        {keys(uniqHosts).map(host => (
          <div key={host} className={cx(cs.messageLine, color)}>
            {this.renderTextLine(host, uniqHosts[host])}
          </div>
        ))}
      </Accordion>
    );
  }

  getSelectedHostOrganisms() {
    return this.props.samples.map(sample => sample.host_genome_name);
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
    PropTypes.shape({
      host_genome_id: PropTypes.number,
      host_genome_name: PropTypes.string,
    })
  ).isRequired,
  hostGenomes: PropTypes.arrayOf(PropTypes.HostGenome).isRequired,
};
