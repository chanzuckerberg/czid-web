import React from "react";
import BacteriaIcon from "~ui/icons/BacteriaIcon";

import cs from "./maintenance.scss";

class Maintenance extends React.Component {
  render() {
    return (
      <div className={cs.maintenance}>
        <div className={cs.content}>
          <div className={cs.text}>
            <div className={cs.message}>
              IDseq is currently undergoing some scheduled maintenance. Sorry
              for the inconvenience!
            </div>
            <div className={cs.tagline}>We&apos;ll be back online soon.</div>
          </div>
          <BacteriaIcon className={cs.bacteriaIcon} />
        </div>
      </div>
    );
  }
}

export default Maintenance;
