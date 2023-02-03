import cx from "classnames";
import { capitalize, every, keys, countBy, map } from "lodash/fp";
import React from "react";

import Accordion from "~/components/layout/Accordion";
import { HostGenome, Optional, SampleFromApi } from "~/interface/shared";
import ExternalLink from "~ui/controls/ExternalLink";
import Notification from "~ui/notifications/Notification";

import cs from "./host_organism_message.scss";

interface HostOrganismMessageProps {
  samples: Pick<SampleFromApi, "host_genome_id" | "host_genome_name">[];
  hostGenomes: Optional<
    Pick<HostGenome, "name" | "id" | "ercc_only">,
    "ercc_only"
  >[];
}

type CountUniqHosts = { [host: string]: number };
/**
 * Shows a message depending on whether the selected host matches a
 * IDseq-supported host.
 */
export default class HostOrganismMessage extends React.Component<
  HostOrganismMessageProps
> {
  // By design, host names are case insensitive, so we don't
  // get duplicates.
  hasMatch = (host: string) => {
    const filtered = this.props.hostGenomes.filter(
      hg => this.isERCC(hg.name) || !(hg.ercc_only || hg["ercc_only?"]),
    );
    return map(hg => hg.name.toLowerCase(), filtered).includes(
      host.toLowerCase(),
    );
  };

  renderOneHost(host: string, count: number) {
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

  renderTextLine(host: string, count: number) {
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

  isERCC(host: string) {
    return host.toLowerCase() === "ercc only";
  }

  renderHostPhrase(host: string, count: number) {
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

  renderManyHosts(uniqHosts: CountUniqHosts) {
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
    const uniqHosts = (countBy(
      null,
      this.getSelectedHostOrganisms(),
    ) as unknown) as CountUniqHosts;
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
