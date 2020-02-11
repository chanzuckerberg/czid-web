import React from "react";

import { NarrowContainer } from "~/components/layout";
import NextActionButton from "~/components/ui/controls/buttons/NextActionButton";
import { UserContext } from "~/components/common/UserContext";

import cs from "./support.scss";

export default class PublicNcovHomepage extends React.Component {
  render() {
    const { appConfig } = this.context || {};

    const VIEW_SAMPLES_LINK =
      `public?projectId=${
        appConfig.publicNcovProjectId
      }&currentDisplay=table&currentTab=samples&` +
      `sampleActiveColumns=%5B"sample"%2C"createdAt"%2C"host"%2C"collectionLocationV2"%2C"sampleType"%2C"totalReads"%2C"nonHostReads"%2C"qcPercent"%5D&showFilters=true&showStats=true`;

    return (
      <NarrowContainer className={cs.publicNcovHomepage} size="small">
        <div className={cs.title}>
          <h1>Wuhan Family Cluster</h1>
          <div className={cs.fill} />
          <a href={VIEW_SAMPLES_LINK}>
            <NextActionButton label="View Samples" />
          </a>
        </div>
        <p className={cs.large}>
          This is a public dataset for the Wuhan virus, consectetur adipiscing
          elit, sed do eiusmod tempor incididunt ut labore et dolore magna
          aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
          laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
          in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <img className={cs.image} src="assets/wuhan_map_placeholder.png" />
        <h2>Hypothesis</h2>
        <p className={cs.large}>
          Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <h2>How the Data was Generated</h2>
        <p className={cs.large}>
          Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <h2>Conclusion</h2>
        <p className={cs.large}>
          Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <h2>How to Reproduce</h2>
        <p className={cs.large}>
          Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <ol>
          <li>
            <div className={cs.listItemTitle}>1. View Samples</div>
            <div>
              Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
              labore et dolore magna aliqua. Ut enim ad minim veniam, quis
              nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
              consequat.
            </div>
          </li>
          <li>
            <div className={cs.listItemTitle}>2. View Heatmap</div>
            <div className={cs.content}>
              <img src="assets/wuhan_heatmap_mini.png" />
              <div>
                Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
                labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                commodo consequat.
              </div>
            </div>
          </li>
        </ol>
        <h2>Why it Matters</h2>
        <p className={cs.large}>
          Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </NarrowContainer>
    );
  }
}

PublicNcovHomepage.contextType = UserContext;
