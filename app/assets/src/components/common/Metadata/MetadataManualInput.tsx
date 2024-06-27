import { Icon } from "@czi-sds/components";
import cx from "classnames";
import _fp, {
  filter,
  find,
  get,
  has,
  includes,
  isEmpty,
  keyBy,
  keys,
  LodashZipObject1x2,
  mapValues,
  merge,
  orderBy,
  pickBy,
  set,
  union,
  values,
  zipObject,
} from "lodash/fp";
import React, { useContext } from "react";
import { TrackEventType, useTrackEvent } from "~/api/analytics";
import HostOrganismSearchBox from "~/components/common/HostOrganismSearchBox";
import { UserContext } from "~/components/common/UserContext";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import { processLocationSelection } from "~/components/ui/controls/GeoSearchInputBox";
import { DataHeaders } from "~/components/views/SampleUploadFlow/components/ReviewStep/components/SampleInfo/components/ReviewTable/types";
import DataTable from "~/components/visualizations/table/DataTable";
import UserContextType from "~/interface/allowedFeatures";
import {
  LocationObject,
  MetadataValue,
  SampleFromApi,
} from "~/interface/shared";
import MultipleDropdown from "~ui/controls/dropdowns/MultipleDropdown";
import { AUTO_POPULATE_FIELDS, COLUMN_HEADER_TOOLTIPS } from "./constants";
import MetadataInput from "./MetadataInput";
import cs from "./metadata_manual_input.scss";
import { MetadataManualInputProps, MetadataManualInputState } from "./types";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const map = _fp.map.convert({ cap: false });

interface MetadataManualInputWithContextProps extends MetadataManualInputProps {
  trackEvent: TrackEventType;
  userContext: UserContextType;
}

class MetadataManualInputCC extends React.Component<
  MetadataManualInputWithContextProps,
  MetadataManualInputState
> {
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2416
  state = {
    selectedFieldNames: [],
    projectMetadataFields: null,
    headers: null,
    metadataFieldsToEdit: {},
    headersToEdit: [],
    hostGenomesByName: {},
    // Which cell the "Apply to All" button should appear on.
    applyToAllCell: {
      sampleName: null,
      column: null,
    },
  };

  componentDidMount() {
    this.setRequiredFields();
  }

  componentDidUpdate(prevProps: MetadataManualInputProps) {
    const { projectMetadataFields, samples, samplesAreNew } = this.props;
    // Whenever the samples change, we need to re-sync the metadata with the parent.
    // (e.g. update which samples are included in the metadata object)
    // This is because the validation function checks whether the metadata and samples being uploaded are synced up.
    if (samples !== prevProps.samples) {
      if (samplesAreNew) {
        const isWaterControlSet = this.setDefaultWaterControl();

        // If the water control default was set, the metadata is already synced. No need to do it again.
        if (!isWaterControlSet) {
          this.resyncMetadataWithParent();
        }
      } else {
        this.resyncMetadataWithParent();
      }
    }

    // The projectMetadataFields may change when a user changes the workflow during the upload process.
    // e.g. User starts uploading an mNGS sample -> metadataFields unavailable for selection for a particular
    // workflow get filtered out get passed as props here -> User goes back and selects the CG workflow ->
    // projectMetadataFields available to the workflow get updated (based on the metadataFields unavailable for the CG).
    if (projectMetadataFields !== prevProps.projectMetadataFields) {
      this.setRequiredFields();
    }
  }

  setRequiredFields = () => {
    const { projectMetadataFields, hostGenomes, samplesAreNew } = this.props;

    this.setState(
      {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        projectMetadataFields: projectMetadataFields,
        // Default to the required fields.
        selectedFieldNames: map(
          "key",
          filter(["is_required", 1], projectMetadataFields),
        ),
        hostGenomesByName: keyBy("name", hostGenomes),
        headers: {
          [DataHeaders.SAMPLE_NAME]: DataHeaders.SAMPLE_NAME,
          ...(samplesAreNew
            ? { [DataHeaders.HOST_ORGANISM]: DataHeaders.HOST_ORGANISM }
            : {}),
          ...mapValues("name", keyBy("key", projectMetadataFields)),
        },
      },
      samplesAreNew ? this.setDefaultWaterControl : null,
    );
  };

  // Need to special case this to avoid a missing required field error.
  // Return whether water control was set.
  setDefaultWaterControl = () => {
    if (has("water_control", this.props.projectMetadataFields)) {
      // Default water_control values to No if they aren't already set.
      this.applyToAll("water_control", "No", false);
      return true;
    }
    return false;
  };

  getManualInputColumns = (): string[] => {
    return [
      DataHeaders.SAMPLE_NAME,
      ...(this.props.samplesAreNew ? [DataHeaders.HOST_ORGANISM] : []),
      ...this.state.selectedFieldNames,
    ];
  };

  autoPopulateMetadata = () => {
    const { samples } = this.props;
    const { metadataFieldsToEdit, headersToEdit } = this.state;

    const newMetadataFieldsToEdit = {};

    // For each sample, merge auto-populate fields into existing fields (which may be empty).
    // Existing fields take precedence.
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    samples.forEach(sample => {
      newMetadataFieldsToEdit[sample.name] = merge(
        AUTO_POPULATE_FIELDS,
        metadataFieldsToEdit[sample.name] || {},
      );
    });

    const newHeadersToEdit = union(headersToEdit, keys(AUTO_POPULATE_FIELDS));

    this.setState({
      metadataFieldsToEdit: newMetadataFieldsToEdit,
      headersToEdit: newHeadersToEdit,
      applyToAllCell: {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        sampleName: null,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        column: null,
      },
    });

    this.onMetadataChange(newHeadersToEdit, newMetadataFieldsToEdit);
  };

  // Update metadata field based on user's manual input.
  updateMetadataField = (
    key: string,
    value: MetadataValue,
    sample: SampleFromApi,
  ) => {
    const newHeaders = union<string>([key], this.state.headersToEdit);
    const newFields = set(
      [sample.name, key],
      value,
      this.state.metadataFieldsToEdit,
    );
    this.setState({
      metadataFieldsToEdit: newFields,
      headersToEdit: newHeaders,
      applyToAllCell: {
        sampleName: sample.name,
        column: key,
      },
    });

    this.onMetadataChange(newHeaders, newFields);
  };

  applyToAll = (
    column: string,
    newValue: string | LocationObject,
    overrideExistingValue = true,
  ) => {
    let newFields = this.state.metadataFieldsToEdit;

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    this.props.samples.forEach(curSample => {
      // Only change the metadata value for samples where that field is valid.
      if (
        (this.isHostGenomeIdValidForField(
          this.getSampleHostGenomeId(curSample),
          column,
        ) &&
          overrideExistingValue) ||
        get([curSample.name, column], newFields) === undefined
      ) {
        let value = newValue;
        // If the field is location-type, return a less-specific location if necessary.
        if (
          column !== DataHeaders.HOST_ORGANISM &&
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
          this.state.projectMetadataFields[column].dataType === "location"
        ) {
          const isHuman =
            get("taxa_category", this.getSampleHostGenome(curSample)) ===
            "human";
          value = processLocationSelection(newValue, isHuman);
        }

        newFields = set([curSample.name, column], value, newFields);
      }
    });

    const newHeaders = union([column], this.state.headersToEdit);
    this.setState({
      metadataFieldsToEdit: newFields,
      headersToEdit: newHeaders,
      applyToAllCell: {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        sampleName: null,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        column: null,
      },
    });

    this.onMetadataChange(newHeaders, newFields);
  };

  // Convert metadata headers and fields to a CSV-like format before passing to parent.
  onMetadataChange = (newHeaders, newFields) => {
    const { samples, samplesAreNew } = this.props;
    // Only send fields for the selected samples to the parent component.
    // If a sample was added, and then later removed, that sample's metadata will not be sent up,
    // but will still persist in this component.
    // If a sample has no metadata set yet, send an empty object.
    const sampleNames = map("name", samples);
    const sampleMetadataFields = map(
      sampleName => newFields[sampleName] || {},
      sampleNames,
    );

    let fieldsForSamples = zipObject(
      sampleNames,
      sampleMetadataFields,
    ) as Partial<LodashZipObject1x2<unknown>>;

    // If we are modifying existing samples, no need to include the samples with empty metadata fields to edit.
    // When modifying new samples, we DO include the empty field objects so the validation error is clearer.
    // (i.e. instead of saying "row missing" for metadata manual input, it will say "host genome missing".)
    if (!samplesAreNew) {
      fieldsForSamples = pickBy(fields => !isEmpty(fields), fieldsForSamples);
    }

    this.props.onMetadataChange({
      metadata: {
        headers: ["sample_name", ...newHeaders],
        rows: map(
          (fields, sampleName) => ({
            ...mapValues(value => value || "", fields),
            sample_name: sampleName,
          }),
          fieldsForSamples,
        ),
      },
    });
  };

  // If the samples have changed, we need to re-sync the metadata with the parent
  // (e.g. update which samples are included in the metadata object)
  // even if the user hasn't changed any of the metadata.
  resyncMetadataWithParent = () => {
    const { headersToEdit, metadataFieldsToEdit } = this.state;
    this.onMetadataChange(headersToEdit, metadataFieldsToEdit);
  };

  getMetadataValue = (sample, key) => {
    // Return the manually edited value, or the original value fetched from the server.
    const editedValue = get(
      [sample.name, key],
      this.state.metadataFieldsToEdit,
    );

    if (editedValue !== undefined) return editedValue;

    return get(key, sample.metadata);
  };

  handleColumnChange = selectedFieldNames => {
    this.setState({ selectedFieldNames });
  };

  getHostGenomeOptions = () =>
    orderBy(
      "count",
      "desc",
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      this.props.hostGenomes.map(hostGenome => ({
        text: hostGenome.name,
        value: hostGenome.id,
        count: hostGenome.samples_count,
      })),
    );

  renderColumnSelector = () => {
    const options = values(this.props.projectMetadataFields).map(field => ({
      value: field.key,
      text: field.name,
    }));

    return (
      <MultipleDropdown
        direction="left"
        hideArrow
        hideCounter
        rounded
        search
        checkedOnTop
        menuLabel="Select Columns"
        onChange={this.handleColumnChange}
        options={options}
        trigger={<Icon sdsIcon="plusCircle" sdsSize="s" sdsType="button" />}
        value={this.state.selectedFieldNames}
        className={cs.columnPicker}
        data-testid="select-columns"
      />
    );
  };

  // Update host genome for a sample.
  updateHostGenome = (hostGenomeIdOrNewName, sample) => {
    const hostGenome = find(
      ["id", hostGenomeIdOrNewName],
      this.props.hostGenomes,
    );
    this.updateMetadataField(
      DataHeaders.HOST_ORGANISM,
      // Convert the id to a name.
      hostGenome ? hostGenome.name : hostGenomeIdOrNewName,
      sample,
    );
  };

  renderApplyToAll = (sample, column) => {
    return this.state.applyToAllCell.sampleName === sample.name &&
      this.state.applyToAllCell.column === column ? (
      <button
        className={cx(cs.applyToAll, "noStyleButton")}
        onClick={() => {
          const newValue = this.getMetadataValue(sample, column);
          this.applyToAll(column, newValue);
        }}
      >
        Apply to All
      </button>
    ) : null;
  };

  getSampleHostGenomeId = sample =>
    this.props.samplesAreNew
      ? get(
          "id",
          // eslint-disable-next-line standard/computed-property-even-spacing
          this.state.hostGenomesByName[
            this.getMetadataValue(sample, DataHeaders.HOST_ORGANISM)
          ],
        )
      : sample.host_genome_id;

  getSampleHostGenome = sample =>
    // eslint-disable-next-line standard/computed-property-even-spacing
    this.state.hostGenomesByName[
      this.getMetadataValue(sample, DataHeaders.HOST_ORGANISM)
    ];

  isHostGenomeIdValidForField = (hostGenomeId, field) =>
    // Special-case "Host Organism" (the field that lets you change the Host Genome)
    field === DataHeaders.HOST_ORGANISM ||
    get([field, "is_required"], this.props.projectMetadataFields) ||
    includes(
      hostGenomeId,
      get([field, "host_genome_ids"], this.props.projectMetadataFields),
    );

  // Create form fields for the table.
  getManualInputData = () => {
    if (!this.props.samples) {
      return null;
    }
    return this.props.samples.map(sample => {
      const columns = this.getManualInputColumns();

      return zipObject(
        columns,
        // Render the table cell.
        columns.map(column => {
          if (column === DataHeaders.SAMPLE_NAME) {
            return (
              <div className={cs.sampleName} key="Sample Name">
                {sample.name}
              </div>
            );
          }

          const inputClasses = cx(
            cs.input,
            // Add extra width to location inputs for long names.
            column.startsWith("collection_location") && cs.extraWidth,
          );

          const sampleHostGenomeId = this.getSampleHostGenomeId(sample);
          if (
            this.props.samplesAreNew &&
            column === DataHeaders.HOST_ORGANISM
          ) {
            return (
              <div>
                <HostOrganismSearchBox
                  className={inputClasses}
                  value={this.getMetadataValue(sample, column)}
                  onResultSelect={({ result }) => {
                    this.updateHostGenome(result.name || result, sample);
                  }}
                  hostGenomes={this.props.hostGenomes || []}
                />
                {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
                {this.props.samples.length > 1 &&
                  this.renderApplyToAll(sample, column)}
              </div>
            );
          } else if (
            // Only show a MetadataInput if this metadata field matches the sample's host genome.
            this.isHostGenomeIdValidForField(sampleHostGenomeId, column)
          ) {
            // host is unknown on initial load
            const hostGenome = this.getSampleHostGenome(sample) || {};
            return (
              <div>
                <MetadataInput
                  key={column}
                  className={inputClasses}
                  value={this.getMetadataValue(sample, column)}
                  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
                  metadataType={this.state.projectMetadataFields[column]}
                  onChange={(key, value) => {
                    this.updateMetadataField(key, value, sample);
                  }}
                  withinModal={this.props.withinModal}
                  taxaCategory={hostGenome.taxa_category}
                  isHuman={sampleHostGenomeId === 1}
                  sampleTypes={this.props.sampleTypes}
                />
                {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
                {this.props.samples.length > 1 &&
                  this.renderApplyToAll(sample, column)}
              </div>
            );
          }
          return (
            <div className={cs.noInput} key={column}>
              {"--"}
            </div>
          );
        }),
      );
    });
  };

  getColumnWidth = column => {
    // The width of the input needs to be about 15px smaller than the width of
    // the column to maintain some padding. See also getColumnWidth.
    if ([DataHeaders.SAMPLE_NAME, "collection_location_v2"].includes(column)) {
      return parseInt(cs.metadataInputExtraWidth) + 15;
    } else {
      return parseInt(cs.metadataInputWidth) + 15;
    }
  };

  getColumnHeaders = columns => {
    return zipObject(
      columns,
      columns.map(column => {
        const label = (this.state.headers || {})[column];
        const content = COLUMN_HEADER_TOOLTIPS[column];
        if (content) {
          const showLink = ![
            DataHeaders.SAMPLE_NAME,
            DataHeaders.HOST_ORGANISM,
          ].includes(column);
          return (
            // Disable the preventOverflow popper.js modifer as it is flipping
            // the tooltip unnecessarily.
            <ColumnHeaderTooltip
              key={label}
              trigger={<span className={cs.label}>{label}</span>}
              title={label}
              content={content}
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
              link={showLink ? "/metadata/dictionary" : null}
              wide={true}
              popperModifiers={[
                {
                  name: "preventOverflow",
                  options: {
                    mainAxis: false,
                  },
                },
              ]}
            />
          );
        }
        return label;
      }),
    );
  };

  render() {
    const { admin } = this.props.userContext;
    const { samplesAreNew } = this.props;
    const columns = this.getManualInputColumns();
    return (
      <div className={cx(cs.metadataManualInput, this.props.className)}>
        <div className={cs.tableContainer}>
          <div className={cs.tableScrollWrapper}>
            <DataTable
              className={cs.inputTable}
              headers={this.getColumnHeaders(columns)}
              columns={columns}
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
              data={this.getManualInputData()}
              getColumnWidth={this.getColumnWidth}
            />
          </div>
          {this.renderColumnSelector()}
        </div>
        {admin && samplesAreNew && (
          <button
            className={cx(cs.autoPopulateButton, "noStyleButton")}
            onClick={this.autoPopulateMetadata}
          >
            Auto-populate metadata (Admin-only)
          </button>
        )}
      </div>
    );
  }
}

// Using a function component wrapper provides a semi-hacky way to
// access useContext without the class component to function component
// conversion.
const MetadataManualInput = (props: MetadataManualInputProps) => {
  const trackEvent = useTrackEvent();
  const userContext = useContext(UserContext);

  return (
    <MetadataManualInputCC
      {...props}
      trackEvent={trackEvent}
      userContext={userContext}
    />
  );
};

export default MetadataManualInput;
