import React from "react";

import cs from "./ImpactVRSection.scss";

const ImpactVRSection = () => {
  return (
    <div className={cs.vrContainer}>
      <div className={cs.cardboardContainer}>
        <h3>Watch with Google Cardboard</h3>
        <ol>
          <li>Assemble Google Cardboard.</li>
          <li>Open YouTube on your mobile device.</li>
          <li>
            Search for the VR video &ldquo;Infectious DIsease Detectives -
            Bangladesh&rdquo;
          </li>
          <li>To start playback, tap the play button.</li>
          <li>Tap the Cardboard icon.</li>
          <li>Insert your phone into Cardboard.</li>
          <li>Look around to view the video in 360 degrees.</li>
        </ol>
        <a
          className={cs.btnLink}
          href="https://arvr.google.com/cardboard/"
          target="_blank"
          rel="noreferrer"
        >
          Learn More
        </a>
      </div>
      <div className={cs.oculusContainer}>
        <h3>Watch with Your Oculus Headset</h3>
        <p>
          Watch the VR video for free via the Oculus store video gallery. The
          video is compatible with all Oculus headsets.
          <br />
          <br />
          If you are logged into your Oculus account, you can save the video to
          your device on the Oculus Gallery Page.
        </p>
        <a
          className={cs.btnLink}
          href="https://www.oculus.com/experiences/media/138425597437093/2292875140835046/"
          target="_blank"
          rel="noreferrer"
        >
          Learn More
        </a>
      </div>
    </div>
  );
};

export default ImpactVRSection;
