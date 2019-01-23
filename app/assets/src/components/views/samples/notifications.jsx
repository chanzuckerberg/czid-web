import React from "react";
import PublicSampleNotification from "./PublicSampleNotification";
import { toast } from "react-toastify";

const publicSampleNotification = (samples, projectName, onClose) => {
  toast(
    ({ closeToast }) => (
      <PublicSampleNotification
        samples={samples}
        projectName={projectName}
        onClose={closeToast}
      />
    ),
    {
      closeButton: false,
      closeOnClick: false,
      onClose: onClose
    }
  );
};

const publicSampleNotificationsByProject = (samples, onClose) => {
  let samplesPerProject = {};
  for (let i = 0; i < samples.length; i++) {
    let sample = samples[i];
    if (!samplesPerProject[sample.project.id]) {
      samplesPerProject[sample.project.id] = [];
    }
    samplesPerProject[sample.project.id].push(sample);
  }

  for (let samples of Object.values(samplesPerProject)) {
    publicSampleNotification(samples, samples[0].project.name, onClose);
  }
};

export { publicSampleNotification, publicSampleNotificationsByProject };
