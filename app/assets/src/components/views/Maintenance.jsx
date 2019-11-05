import React from "react";

import BacteriaIcon from "~ui/icons/BacteriaIcon";
import BlankScreenMessage from "~/components/common/BlankScreenMessage";

import cs from "./maintenance.scss";

class Maintenance extends React.Component {
  render() {
    return (
      <div className={cs.maintenance}>
        <BlankScreenMessage
          message={`IDseq is currently undergoing some scheduled maintenance. Sorry
          for the inconvenience!`}
          textWidth={300}
          tagline={`We'll be back online soon.`}
          icon={<BacteriaIcon className={cs.bacteriaIcon} />}
        />
      </div>
    );
  }
}

export default Maintenance;
