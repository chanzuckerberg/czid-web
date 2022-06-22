import React from "react";
import GoogleCardboardIcon from "~/images/impact_page/google-cardboard-icon.png";
import cs from "./ImpactVRSection.scss";

const ImpactVRSection = () => {
  return (
    <div>
      <p className={cs.vrCompatibilityText}>
        Compatible with headsets including Daydream View, Gear VR, Google
        Cardboard, HTC Vive, Lenovo Mirage Solo, Oculus Go, Oculus Quest, Oculus
        Rift, and PlayStation VR.
      </p>
      <div className={cs.vrContainer}>
        <div className={cs.cardboardContainer}>
          <h3>Watch with your VR headset:</h3>
          <ol>
            <li>
              Make sure you have the YouTube app installed on your device.
            </li>
            <li>Put on your VR device.</li>
            <li>
              Open the{" "}
              <a
                className={cs.vrInlineLink}
                href="https://www.youtube.com/watch?v=7w-pAc4rwHI"
              >
                CZ ID video
              </a>
              .
            </li>
            <li>Press play.</li>
          </ol>
        </div>
        <div className={cs.oculusContainer}>
          <h3>
            Alternatively, watch on your phone with a cardboard VR viewer:
          </h3>
          <ol>
            <li>Download the Youtube app on your phone.</li>
            <li>Put on your VR device.</li>
            <li>
              Open the{" "}
              <a
                className={cs.vrInlineLink}
                href="https://www.youtube.com/watch?v=7w-pAc4rwHI"
              >
                CZ ID video
              </a>
              .
            </li>
            <li>Press play.</li>
            <li>
              Tap on the{" "}
              <img src={GoogleCardboardIcon} alt="Google Cardboard icon" /> icon
              in the lower right of the video to play in VR.
            </li>
            <li>
              Once the video is playing in stereoscopic, place your phone in
              your cardboard VR viewer.
            </li>
            <li>
              Hold the viewer up to your eyes and simply move your head around.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ImpactVRSection;
