import React from "react";
import {
  RESULTS_FOLDER_STAGE_KEYS,
  RESULTS_FOLDER_STEP_KEYS,
} from "~/components/utils/resultsFolder";
import Divider from "./layout/Divider";
import cs from "./results_folder.scss";
import { downloadStringToFile, openUrl } from "./utils/links";
import { SEQUENCING_TECHNOLOGY_OPTIONS } from "./views/SampleUploadFlow/constants";

interface OutputFileProps {
  file?: {
    url: string;
  };
}

const OutputFile = ({ file }: OutputFileProps) => {
  const conditionalOpenUrl = (url: $TSFixMe) => {
    if (url) {
      openUrl(file.url);
    }
  };

  return (
    <tr
      className={`${file.url ? "" : "disabled-"}file-link`}
      onClick={() => conditionalOpenUrl(file.url)}>
      <td className={cs.tableData}>
        <i className="fa fa-file" />
        {file["displayName"]}
        <span className="size-tag"> -- {file["size"]}</span>
      </td>
    </tr>
  );
};

interface ConfigFileProps {
  stageDagJson?: string;
}

const ConfigFile = ({ stageDagJson }: ConfigFileProps) => {
  return (
    <tr
      className="file-link"
      onClick={() => downloadStringToFile(stageDagJson)}>
      <td className={cs.tableData}>
        <i className="fa fa-file" />
        config.json
      </td>
    </tr>
  );
};

const ResultsFolderStepDivider = () => {
  return (
    <tr key="last">
      <td className={cs.tableData}>
        <Divider />
      </td>
    </tr>
  );
};

interface ResultsFolderStepProps {
  step?: object;
  pipelineTechnology?:
    | SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA
    | SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE;
}

const ResultsFolderStep = ({
  step,
  pipelineTechnology,
}: ResultsFolderStepProps) => {
  const { stepDescriptionKey, readsAfterKey, filesKey, stepNameKey } =
    RESULTS_FOLDER_STEP_KEYS;

  const description = step[stepDescriptionKey];
  const readsAfter = step[readsAfterKey];
  const fileList = step[filesKey];
  const stepName = step[stepNameKey];

  return (
    <tbody>
      <tr key="first">
        <td className={cs.tableData}>
          Step <b>{stepName}</b>: {description}{" "}
          {readsAfter ? (
            <span>
              (<b>{readsAfter}</b>{" "}
              {`${pipelineTechnology === "ONT" ? "bases" : "reads"} remained.`})
            </span>
          ) : null}
        </td>
      </tr>
      {fileList.map((file: $TSFixMe, j: $TSFixMe) => {
        return <OutputFile file={file} key={j} />;
      })}
      <ResultsFolderStepDivider />
    </tbody>
  );
};

interface ResultsFolderProps {
  filePath?: string;
  fileList?: unknown[];
  samplePath?: string;
  sampleName?: string;
  projectName?: string;
  rawResultsUrl?: string;
  pipelineTechnology?:
    | SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA
    | SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE;
}

const ResultsFolder = ({
  filePath: escapedFilePath,
  fileList,
  sampleName,
  samplePath,
  projectName,
  rawResultsUrl,
  pipelineTechnology,
}: ResultsFolderProps) => {
  const filePath = escapedFilePath.split("/");

  const {
    stageDescriptionKey,
    // @ts-expect-error Property 'stageDagJsonKey' does not exist on type
    stageDagJsonKey,
    stepsKey,
    stageNameKey,
  } = RESULTS_FOLDER_STAGE_KEYS;

  return (
    <div className="results-folder">
      <div className="header">
        <span className="title">
          <a href="/">{filePath[0]}</a>
          <span className="path">{">"}</span>

          <a href={`/home?project_id=${filePath[1]}`}>{projectName}</a>
          <span className="path">/</span>

          <a href={samplePath}>{sampleName}</a>
          <span className="path">/</span>

          {filePath[3]}
        </span>
      </div>
      <div className="header">
        {!Object.keys(fileList).length
          ? "No files to show"
          : Object.keys(fileList).map((stageKey, k) => {
              const stage = fileList[stageKey];
              const stageDescription = stage[stageDescriptionKey];
              const stageDagJson = stage[stageDagJsonKey] || "None";
              const stepDict = stage[stepsKey];
              const stageName = stage[stageNameKey];
              return (
                <table key={k}>
                  <thead>
                    <tr>
                      <th className={cs.tableHeader}>
                        {stageName}: {stageDescription}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <ConfigFile stageDagJson={stageDagJson} />
                    <ResultsFolderStepDivider />
                  </tbody>
                  {Object.keys(stepDict).map((stepKey, i) => (
                    <ResultsFolderStep
                      pipelineTechnology={pipelineTechnology}
                      step={stepDict[stepKey]}
                      key={i}
                    />
                  ))}
                </table>
              );
            })}
        {rawResultsUrl ? (
          <table key="rawResults">
            <thead>
              <tr>
                <th className={cs.tableHeader}>
                  Need an output that&apos;s not listed here?
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="file-link" onClick={() => openUrl(rawResultsUrl)}>
                <td className={cs.tableData}>Go to raw results folder</td>
              </tr>
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
};

export default ResultsFolder;
