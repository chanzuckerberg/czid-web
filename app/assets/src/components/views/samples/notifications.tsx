import { union } from "lodash/fp";
import React from "react";
import { showToast } from "~/components/utils/toast";
import { NameId } from "../../../interface/shared/";
import PublicSampleNotification from "./PublicSampleNotification";

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
    },
  );
};

const publicSampleNotificationsByProject = samples => {
  const samplesPerProject: {
    projectSamples?: { id: number; project: NameId }[];
  } = {};
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (!samplesPerProject[sample.project.id]) {
      samplesPerProject[sample.project.id] = [];
    }
    samplesPerProject[sample.project.id].push(sample);
  }

  for (const projectSamples of Object.values(samplesPerProject)) {
    publicSampleNotification(
      projectSamples,
      projectSamples[0].project.name,
      () => {
        localStorage.setItem(
          "dismissedPublicSamples",
          JSON.stringify(
            union(
              JSON.parse(localStorage.getItem("dismissedPublicSamples")),
              projectSamples.map(sample => sample.id),
            ),
          ),
        );
      },
    );
  }
};

export { publicSampleNotification, publicSampleNotificationsByProject };
