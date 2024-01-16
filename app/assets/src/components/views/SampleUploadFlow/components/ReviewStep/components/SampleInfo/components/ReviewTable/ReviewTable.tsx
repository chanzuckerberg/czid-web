import { flatten, get, keyBy, map, mapKeys, without } from "lodash/fp";
import React from "react";
import { formatFileSize } from "~/components/utils/format";
import { returnHipaaCompliantMetadata } from "~/components/utils/metadata";
import DataTable from "~/components/visualizations/table/DataTable";
import { HostGenome, MetadataBasic, SampleFromApi } from "~/interface/shared";
import cs from "./review_table.scss";
import { DataHeaders } from "./types";

interface ReviewTableType {
  hostGenomes?: HostGenome[];
  metadata: MetadataBasic | null;
  projectMetadataFields: object | null;
  samples: SampleFromApi[] | null;
  uploadType: string;
}

const getDataHeaders = ({ uploadType, metadata, getFieldDisplayName }) => {
  // Omit sample name, which is the first header.
  const metadataHeaders = without(
    ["Sample Name", "sample_name"],
    metadata.headers.map(getFieldDisplayName),
  );

  if (uploadType !== "basespace") {
    return [
      DataHeaders.SAMPLE_NAME,
      DataHeaders.INPUT_FILES,
      DataHeaders.HOST_ORGANISM,
      ...metadataHeaders,
    ];
  } else {
    return [
      DataHeaders.SAMPLE_NAME,
      DataHeaders.BASESPACE_PROJECT,
      DataHeaders.FILE_SIZE,
      DataHeaders.FILE_TYPE,
      DataHeaders.HOST_ORGANISM,
      ...metadataHeaders,
    ];
  }
};

const getDataRows = ({
  uploadType,
  metadata,
  hostGenomes,
  samples,
  getFieldDisplayName,
}) => {
  const metadataRows = metadata.rows.map(r => mapKeys(getFieldDisplayName, r));

  const metadataBySample = keyBy(
    row => row[DataHeaders.SAMPLE_NAME] || row.sample_name,
    metadataRows,
  );

  const hostGenomesById = keyBy("id", hostGenomes);

  const assembleDataForSample = (sample: SampleFromApi) => {
    const sampleHostName = get("name", hostGenomesById[sample.host_genome_id]);
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
    const sampleMetadata = metadataBySample[sample.name];

    if (sampleHostName === "Human" && "Host Age" in sampleMetadata) {
      sampleMetadata["Host Age"] = returnHipaaCompliantMetadata(
        "host_age",
        sampleMetadata["Host Age"],
      );
    }

    const sampleData = {
      ...sampleMetadata,
      [DataHeaders.SAMPLE_NAME]: (
        <div className={cs.sampleName}>{sample.name}</div>
      ),
      [DataHeaders.HOST_ORGANISM]: sampleHostName,
    };

    // We display different columns if the uploadType is basespace.
    if (uploadType !== "basespace") {
      // Display the concatenated file names here too
      const files = flatten(
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        sample.input_files_attributes.map(pair => pair.concatenated),
      );
      sampleData["Input Files"] = (
        <div className={cs.files}>
          {files.map(file => (
            <div key={file} className={cs.file}>
              {file}
            </div>
          ))}
        </div>
      );
    } else {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      sampleData["File Size"] = formatFileSize(sample.file_size);
      sampleData["File Type"] = sample.file_type;
      sampleData["Basespace Project"] = sample.basespace_project_name;
    }

    return sampleData;
  };

  return map(assembleDataForSample, samples);
};

const getColumnWidth = (column: string) => {
  switch (column) {
    case DataHeaders.SAMPLE_NAME:
      return 200;
    case "Input Files":
      return 300;
    case "Water Control":
      return 80;
    case "Nucleotide Type":
    case "Collection Date":
      return 100;
    default:
      return 140;
  }
};

const ReviewTable = ({
  hostGenomes,
  metadata,
  projectMetadataFields,
  samples,
  uploadType,
}: ReviewTableType) => {
  if (!projectMetadataFields) {
    return <div>Loading...</div>;
  }

  const getFieldDisplayName = (key: string) => {
    return projectMetadataFields[key] ? projectMetadataFields[key].name : key;
  };

  return (
    <DataTable
      columns={getDataHeaders({ uploadType, metadata, getFieldDisplayName })}
      data={getDataRows({
        uploadType,
        metadata,
        hostGenomes,
        samples,
        getFieldDisplayName,
      })}
      getColumnWidth={getColumnWidth}
    />
  );
};

export { ReviewTable };
