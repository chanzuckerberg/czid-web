import React from "react";

import PropTypes from "~/components/utils/propTypes";
import { sampleErrorInfo } from "~/components/utils/sample";
import SampleMessage from "~/components/views/SampleViewV2/SampleMessage";
import AlertIcon from "~ui/icons/AlertIcon";
import LoadingIcon from "~ui/icons/LoadingIcon";

import csSampleMessage from "./sample_message.scss";

class ConsensusGenomeView extends React.Component {
  render() {
    const { sample } = this.props;
    const executionStatus = sample.temp_sfn_execution_status;

    if (executionStatus === "SUCCEEDED") {
      return <div>Coming Soon...</div>;
    } else if (executionStatus === "RUNNING" || !executionStatus) {
      return (
        <SampleMessage
          icon={<LoadingIcon className={csSampleMessage.icon} />}
          // TODO: Insert specific article when ready.
          link={"https://help.idseq.net"}
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
