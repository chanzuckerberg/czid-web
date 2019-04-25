import React from "react";
import PublicSampleNotification from "./PublicSampleNotification";
import { toast } from "react-toastify";

const showNotification = (notificationComponent, params = {}) => {
  toast(notificationComponent, {
    closeButton: false,
    closeOnClick: false,
    draggable: false,
    hideProgressBar: true,
    ...params
  });
};

const publicSampleNotification = (samples, projectName, onClose) => {
  showNotification(
    ({ closeToast }) => (
      <PublicSampleNotification
        samples={samples}
        projectName={projectName}
        onClose={closeToast}
      />
    ),
    {
      onClose
    }
  );
};

const publicSampleNotificationsByProject = samples => {
  let samplesPerProject = {};
  for (let i = 0; i < samples.length; i++) {
    let sample = samples[i];
    if (!samplesPerProject[sample.project.id]) {
      samplesPerProject[sample.project.id] = [];
    }
    samplesPerProject[sample.project.id].push(sample);
  }

  for (let projectSamples of Object.values(samplesPerProject)) {
    publicSampleNotification(
      projectSamples,
      projectSamples[0].project.name,
      () => {
        localStorage.setItem(
          "dismissedPublicSamples",
          JSON.stringify(
            new Set([
              ...JSON.parse(localStorage.getItem("dismissedPublicSamples")),
              ...projectSamples.map(sample => sample.id)
            ])
          )
        );
      }
    );
  }
};

export {
  publicSampleNotification,
  publicSampleNotificationsByProject,
  showNotification
};
