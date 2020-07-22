import React from "react";

import SampleMessage from "~/components/views/SampleViewV2/SampleMessage";
import DownloadButton from "~ui/controls/buttons/DownloadButton";
import SecondaryButton from "~ui/controls/buttons/SecondaryButton";
import AlertIcon from "~ui/icons/AlertIcon";
import LoadingIcon from "~ui/icons/LoadingIcon";
import { CONSENSUS_GENOME_DOC_LINK } from "~utils/documentationLinks";
import { openUrlInNewTab } from "~utils/links";
import PropTypes from "~utils/propTypes";
import { sampleErrorInfo } from "~utils/sample";

import cs from "./consensus_genome_view.scss";
import csSampleMessage from "./sample_message.scss";

class ConsensusGenomeView extends React.Component {
  renderResults() {
    return (
      <div className={cs.resultsContainer}>
        <div className={cs.section}>
          <div className={cs.header}>Download Consensus Genome Results</div>
          <div className={cs.body}>
            These are your consensus genome result files. You can download them
            all in a .zip file.
          </div>
          <div className={cs.subheader}>This is what you'll get:</div>
          <div className={cs.body}>
            {/* TODO: Migrate to come from an output file listing what went into the ZIP. */}
            <div>consensus.fa</div>
            <div>depths.png</div>
            <div>no_host_1.fq.gz</div>
            <div>no_host_2.fq.gz</div>
            <div>primertrimmed.bai</div>
            <div>primertrimmed.bam</div>
            <div>realigned.bai</div>
            <div>realigned.bam</div>
            <div>report.txt</div>
            <div>sample.bam</div>
            <div>sample.ercc_stats</div>
            <div>stats.json</div>
            <div>vcf.gz</div>
          </div>
          <div>
            <DownloadButton text="Download All" />
          </div>
        </div>
        <div className={cs.section}>
          <div className={cs.header}>
            Learn more about Consensus Genomes in our Help Center
          </div>
          <div className={cs.body}>
            We'll show you how to analyze your samples, how our pipeline works,
            and how to upload them to public repositories.
          </div>
          <div>
            <SecondaryButton
              onClick={() => openUrlInNewTab(CONSENSUS_GENOME_DOC_LINK)}
              text="View Help Docs"
            />
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { sample } = this.props;
    const executionStatus = sample.temp_sfn_execution_status;

    if (executionStatus === "SUCCEEDED") {
      return this.renderResults();
    } else if (executionStatus === "RUNNING" || !executionStatus) {
      return (
        <SampleMessage
          icon={<LoadingIcon className={csSampleMessage.icon} />}
          link={CONSENSUS_GENOME_DOC_LINK}
          linkText={"Learn about Consensus Genomes"}
          message={"Your Consensus Genome is being generated!"}
          status={"IN PROGRESS"}
          type={"inProgress"}
        />
      );
    } else {
      // FAILED
      const { link, linkText, message, status, type } = sampleErrorInfo({
        sample,
      });
      return (
        <SampleMessage
          icon={<AlertIcon className={csSampleMessage.icon} />}
          link={link}
          linkText={linkText}
          message={message}
          status={status}
          type={type}
        />
      );
    }
  }
}

ConsensusGenomeView.propTypes = {
  sample: PropTypes.object,
};

export default ConsensusGenomeView;
