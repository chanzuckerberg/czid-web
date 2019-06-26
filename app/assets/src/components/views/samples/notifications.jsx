import React from "react";
import PublicSampleNotification from "./PublicSampleNotification";
import { showToast } from "~/components/utils/toast";

const publicSampleNotification = (samples, projectName, onClose) => {
  showToast(
    ({ closeToast }) => (
      <PublicSampleNotification
        samples={samples}
        projectName={projectName}
        onClose={closeToast}
      />
    ),
    {
      onClose,
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
              ...projectSamples.map(sample => sample.id),
            ])
          )
        );
      }
    );
  }
};

export { publicSampleNotification, publicSampleNotificationsByProject };
